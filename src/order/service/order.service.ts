import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Address } from '../../entities/address.entity';
import { Cart } from '../../entities/cart.entity';
import { Order } from '../../entities/order.entity';
import { OrderAddress } from '../../entities/orderaddress.entity';
import { OrderProduct } from '../../entities/orderproduct.entity';
import { OrderTransaction } from '../../entities/ordertransaction.entities';
import { ProductPicture } from '../../entities/productpicture.entity';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/userprofile.entity';
import { AuthenticationUtils } from '../../utils/Authentication';
import { HelperUtil } from '../../utils/Helper';
import { NotificationService } from '../../utils/NotificationService';
import { In, Not, Repository } from 'typeorm';
import { GetOrders, GetTransaction } from '../../types/types';
import mainSettings from 'src/config/main.settings';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class OrderService {
    private authenticator;
    private noticationService = new NotificationService();
    private helperUtil;
    private url;
    private paystackHeader;

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,

        @InjectRepository(UserProfile)
        private userprofileRepository: Repository<UserProfile>,

        @InjectRepository(Address)
        private addressRepository: Repository<Address>,

        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,

        @InjectRepository(Order)
        private orderRepository: Repository<Order>,

        @InjectRepository(OrderAddress)
        private orderAddressRepository: Repository<OrderAddress>,

        @InjectRepository(OrderProduct)
        private orderproductRepository: Repository<OrderProduct>,

        @InjectRepository(OrderTransaction)
        private orderTransactionRepository: Repository<OrderTransaction>,

        @InjectRepository(ProductPicture)
        private productPictureRepository: Repository<ProductPicture>,

        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,

        private readonly httpService: HttpService,
    ) {
        this.authenticator = new AuthenticationUtils(cacheManager);

        this.helperUtil = new HelperUtil();

        this.paystackHeader = {
            headers: {
                Authorization: `Bearer ${mainSettings.infrastructure.paystack.secretKey}`,
                'Content-Type': 'application/json',
            },
        };

        if (mainSettings.infrastructure.environment == 'production') {
            this.url = mainSettings.infrastructure.baseUrl.production;
        } else {
            this.url = mainSettings.infrastructure.baseUrl.development;
        }
    }

    async initiateOrder(authHeader: string) {
        const { type, userId } =
            await this.authenticator.validateToken(authHeader);

        if (type !== 0) {
            throw new UnauthorizedException('Unauthorized');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const cart = await this.cartRepository.find({
            where: { user: { id: user.id }, product: { isAvailable: true } },
            relations: ['product'],
        });

        if (!cart.length) {
            throw new NotFoundException('Cart is empty');
        }

        const cartProducts = new Map();
        let description = '';
        let totalAmount = 0;

        cart.forEach((item) => {
            const { product, quantity } = item;
            description += `${quantity} x ${product.product}, `;
            totalAmount += quantity * product.amount;

            cartProducts.set(product.id, { product, quantity });
        });

        description = description.trim().replace(/,$/, '');

        const ref = `BuyTrek-${Math.random().toString(36).substr(2, 9)}`;
        const orderData = this.orderRepository.create({
            orderNo: ref,
            user,
            totalAmount,
            description,
        });
        const order = await this.orderRepository.save(orderData);

        const userDefaultAddress = await this.addressRepository.findOne({
            where: { user: { id: user.id }, isDefault: true },
        });

        const orderAddressData = this.orderAddressRepository.create({
            order,
            address: userDefaultAddress,
        });
        const orderaddress =
            await this.orderAddressRepository.save(orderAddressData);

        const orderProductsData = Array.from(cartProducts.values()).map(
            ({ product, quantity }) => ({
                product,
                order,
                amount: product.amount,
                quantity,
            }),
        );

        await this.orderproductRepository.save(orderProductsData);

        const transactiondata = await this.transactionRepository.create({
            ref: await this.generateTransactionRef(),
            amount: totalAmount,
            user,
        });

        const transaction =
            await this.transactionRepository.save(transactiondata);

        const paystackpayload = {
            amount: transaction.amount * 100,
            email: user.emailAddress,
            reference: transaction.ref,
            callback_url: this.url + '/orders',
            metadata: {
                cancel_action: this.url + '/order/cancel',
                callback_url: this.url + '/orders',
            },
        };

        const addressId = orderaddress.id;

        try {
            const paystackResponse = await lastValueFrom(
                this.httpService.post(
                    'https://api.paystack.co/transaction/initialize',
                    paystackpayload,
                    this.paystackHeader,
                ),
            );

            if (paystackResponse.status != 200) {
                throw new BadRequestException(
                    paystackResponse.data.data.message,
                );
            }

            const paymentUrl = paystackResponse.data.data.authorization_url;

            await Promise.all(
                cart.map((item) => this.cartRepository.delete(item.id)),
            );

            const userprofile = await this.userprofileRepository.findOne({
                where: {
                    user: {
                        id: user.id,
                    },
                },
            });

            const userNotification = {
                recipients: [`${userprofile.user.emailAddress}`],
                data: {
                    name: userprofile.firstName,
                    orderNo: order.orderNo,
                    amount: order.totalAmount,
                },
            };

            this.noticationService.SendOrderNewOrder(
                userNotification,
                () => {},
            );

            return {
                data: {
                    paymentUrl,
                    orderId: order.id,
                },
            };
        } catch (error) {
            console.log(error.message);

            await this.orderTransactionRepository.delete({
                order: { id: order.id },
            });
            await this.orderproductRepository.delete({
                order: { id: order.id },
            });
            await this.orderAddressRepository.delete(addressId);
            await this.orderRepository.delete(order.id);

            throw new BadRequestException(
                'Payment initialization failed. Please try again.',
            );
        }
    }

    private async generateTransactionRef(
        prefix: string = 'TXN',
    ): Promise<string> {
        const randomString = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();

        const transactionRef = `${prefix}-${randomString}-${timestamp}`;
        return transactionRef;
    }

    async paystackWebhook(signature, clientIP, payload: any) {
        const allowedIPs = mainSettings.infrastructure.paystack.allowedIps;
        const hash = crypto
            .createHmac(
                'sha512',
                mainSettings.infrastructure.paystack.secretKey,
            )
            .update(JSON.stringify(payload))
            .digest('hex');

        if (!allowedIPs.includes(clientIP)) {
            throw new ForbiddenException('Forbidden');
        }

        if (hash == signature) {
            this.completeOrder(payload);
            return {
                statusCode: 200,
                message: 'OK',
            };
        } else {
            throw new BadRequestException('Not allowed');
        }
    }

    private async completeOrder(payload: any) {
        const { event, data } = payload;

        const { reference } = data;

        const amountPaid = (data.amount / 100).toFixed(2);
        const transaction = await this.transactionRepository.findOne({
            where: {
                ref: reference,
            },
            relations: ['user'],
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (event === 'transfer.success' || event === 'charge.success') {
            if (amountPaid != transaction.amount.toString()) {
                throw new BadRequestException(
                    'Amount does not match transaction amount',
                );
            }

            await this.transactionRepository.update(transaction.id, {
                transactionStatus: 'Completed',
            });

            const orderTransaction =
                await this.orderTransactionRepository.findOne({
                    where: {
                        transaction: {
                            id: transaction.id,
                        },
                    },
                    relations: ['order'],
                });

            await this.orderRepository.update(orderTransaction.order.id, {
                status: 'Payment Completed',
            });

            const userprofile = await this.userprofileRepository.findOne({
                where: {
                    user: {
                        id: transaction.user.id,
                    },
                },
                relations: ['user'],
            });

            const admins = await this.userprofileRepository.find({
                where: {
                    user: {
                        type: In([1, 3]),
                    },
                },
                relations: ['user'],
            });

            const admindetails = admins.map((admin) => ({
                email: admin.user.emailAddress,
                name: admin.firstName,
            }));

            let adminNotification = {
                recipients: [],
                data: {
                    orderNo: orderTransaction.order.orderNo,
                    name: '',
                },
            };

            admindetails.map((admin) => {
                adminNotification.recipients.push(admin.email);
                adminNotification.data.name = admin.name;

                this.noticationService.SendOrderNewAdminOrder(
                    adminNotification,
                    () => {},
                );
            });

            const userNotification = {
                recipients: [`${userprofile.user.emailAddress}`],
                data: {
                    name: userprofile.firstName,
                    orderNo: orderTransaction.order.orderNo,
                    amount: orderTransaction.order.totalAmount,
                },
            };

            this.noticationService.SendOrderPaymentCompleted(
                userNotification,
                () => {},
            );

            return {
                message: 'Order payment completed',
            };
        }
    }

    async cancelOrder(orderId: string, type: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
            relations: ['user'],
        });

        if (!userprofile) {
            throw new UnauthorizedException('Unauthorized');
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (
            order.status != 'Pending Payment Confirmation' &&
            order.status != 'Payment Completed'
        ) {
            throw new BadRequestException('Order can not be cancelled');
        }

        if (type == 'payment') {
            await this.orderRepository.update(order.id, {
                status: 'Cancelled',
            });
        } else if (type == 'paymentcancelled') {
            await this.orderTransactionRepository.delete({
                order: { id: order.id },
            });
            await this.orderproductRepository.delete({
                order: { id: order.id },
            });
            await this.orderAddressRepository.delete({
                order: { id: order.id },
            });
            await this.orderRepository.delete(order.id);
        }

        const usernotification = {
            recipients: [`${userprofile.user.emailAddress}`],
            data: {
                orderNo: order.orderNo,
                name: userprofile.firstName,
            },
        };

        this.noticationService.SendOrderCancelled(
            usernotification,
            (resp) => {},
        );

        return {
            message: 'Order Cancelled',
        };
    }

    async getSellerTransactions(query: GetTransaction, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (
            isTokenValid.type != 2 &&
            isTokenValid.type != 1 &&
            isTokenValid.type != 3
        ) {
            throw new UnauthorizedException('Unauthorized');
        }

        const sellerId = query.sellerId || isTokenValid.userId;

        const seller = await this.userRepository.findOne({
            where: { id: sellerId },
        });

        if (!seller) {
            throw new NotFoundException('Seller not Found');
        }

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const [orderProducts, total] =
            await this.orderproductRepository.findAndCount({
                where: {
                    order: {
                        status: Not(In(['Pending Payment Confirmation'])),
                    },
                    product: { user: { id: sellerId } },
                },
                relations: ['order', 'product'],
                skip,
                take,
            });

        const transactions = await Promise.all(
            orderProducts.map(async (orderProduct) => {
                const orderTransaction =
                    await this.orderTransactionRepository.findOne({
                        where: { order: { id: orderProduct.order.id } },
                        relations: ['transaction'],
                    });

                if (!orderTransaction || !orderTransaction.transaction) {
                    return null;
                }

                return {
                    orderNo: orderProduct.order.orderNo,
                    description: orderProduct.order.description,
                    amount: orderTransaction.transaction.amount,
                    transactionref: orderTransaction.transaction.ref,
                    status: orderTransaction.transaction.transactionStatus,
                };
            }),
        );

        const filteredTransactions = transactions.filter(Boolean);

        return {
            data: {
                transactions: filteredTransactions,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async getOrders(query: GetOrders, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userId = isTokenValid.userId;

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const [orderproducts, total] =
            await this.orderproductRepository.findAndCount({
                where: {
                    order: {
                        status: Not(
                            In([
                                'Payment Completed',
                                'Cancelled',
                                'Pending Payment Confirmation',
                            ]),
                        ),
                    },
                    product: {
                        user: {
                            id: userId,
                        },
                    },
                },
                relations: ['order', 'product'],
                skip,
                take,
            });

        let orders = [];

        for (const orderproduct of orderproducts) {
            const order = orderproduct.order;
            const orderIds = orders.map((order) => order.id);

            if (!orderIds.includes(order.id)) {
                const product = orderproduct.product;

                let pictureUrl: string;

                const pictures = await this.productPictureRepository.find({
                    where: {
                        product: {
                            id: product.id,
                        },
                    },
                    relations: ['picture'],
                });

                const productpictureurls = pictures.map(
                    (picture) => picture.picture.url,
                );

                let nextAction: string;

                if (order.status == 'Packaging')
                    nextAction = 'updateToPackaged';
                if (order.status == 'Packaged')
                    nextAction = 'updateToOutforDelivery';
                if (order.status == 'Out for Delivery')
                    nextAction = 'updateToDelivered';
                if (order.status == 'Delivered') nextAction = '';

                pictureUrl = productpictureurls[0];

                let orderData = {
                    orderId: order.id,
                    orderNo: order.orderNo,
                    description: order.description,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    nextAction,
                    pictureUrl,
                };

                orders.push(orderData);
            }
        }

        return {
            data: {
                orders,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async getNewOrders(query: GetOrders, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userId = isTokenValid.userId;

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const [orderproducts, total] =
            await this.orderproductRepository.findAndCount({
                where: {
                    order: {
                        status: 'Payment Completed',
                    },
                    product: {
                        user: {
                            id: userId,
                        },
                    },
                },
                relations: ['order', 'product'],
                skip,
                take,
            });

        let orders = [];

        for (const orderproduct of orderproducts) {
            const order = orderproduct.order;
            const orderIds = orders.map((order) => order.id);

            if (!orderIds.includes(order.id)) {
                const product = orderproduct.product;

                let pictureUrl: string;

                const pictures = await this.productPictureRepository.find({
                    where: {
                        product: {
                            id: product.id,
                        },
                    },
                    relations: ['picture'],
                });

                const productpictureurls = pictures.map(
                    (picture) => picture.picture.url,
                );

                pictureUrl = productpictureurls[0];

                let orderData = {
                    orderId: order.id,
                    orderNo: order.orderNo,
                    description: order.description,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    nextAction: 'updateToPackaging',
                    pictureUrl,
                };

                orders.push(orderData);
            }
        }

        return {
            data: {
                orders,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async getUserOrders(query: GetOrders, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const userId = isTokenValid.userId;

        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const [orders, total] = await this.orderRepository.findAndCount({
            where: {
                user: {
                    id: user.id,
                },
            },
            skip,
            take,
        });

        let ordersDetails = [];

        for (const order of orders) {
            const orderproducts = await this.orderproductRepository.find({
                where: {
                    order: {
                        id: order.id,
                    },
                },
                relations: ['product'],
            });

            let pictureUrl: string;

            if (orderproducts.length > 0) {
                const pictures = await this.productPictureRepository.find({
                    where: {
                        product: {
                            id: orderproducts[0].product.id,
                        },
                    },
                    relations: ['picture'],
                });

                const productpictureurls = pictures.map(
                    (picture) => picture.picture.url,
                );

                pictureUrl = productpictureurls[0];
            }

            ordersDetails.push({
                orderId: order.id,
                orderNo: order.orderNo,
                description: order.description,
                totalAmount: order.totalAmount,
                status: order.status,
                pictureUrl,
            });
        }

        return {
            data: {
                orders: ordersDetails,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async getOrder(orderId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (
            isTokenValid.type != 1 &&
            isTokenValid.type != 3 &&
            isTokenValid.type != 0
        ) {
            throw new UnauthorizedException('Unathorized');
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const orderproducts = await this.orderproductRepository.find({
            where: {
                order: {
                    id: order.id,
                },
            },
            relations: ['product'],
        });

        let products = [];

        for (const orderproduct of orderproducts) {
            const pictures = await this.productPictureRepository.find({
                where: {
                    product: {
                        id: orderproduct.product.id,
                    },
                },
                relations: ['picture'],
            });

            const productpictureurls = pictures.map(
                (picture) => picture.picture.url,
            );

            products.push({
                product: orderproduct.product.product,
                amount: orderproduct.amount,
                quantity: orderproduct.quantity,
                description: orderproduct.product.description,
                pictureUrls: productpictureurls,
            });
        }

        const orderAddress = await this.orderAddressRepository.findOne({
            where: {
                order: {
                    id: order.id,
                },
            },
            relations: ['address'],
        });

        let nextAction: string;

        if (order.status == 'Pending Payment Confirmation') nextAction = '';
        if (order.status == 'Payment Completed')
            nextAction = 'updateToPaackaging';
        if (order.status == 'Cancelled') nextAction = '';
        if (order.status == 'Packaging') nextAction = 'updateToPackaged';
        if (order.status == 'Packaged') nextAction = 'updateToOutforDelivery';
        if (order.status == 'Out for Delivery')
            nextAction = 'updateToDelivered';
        if (order.status == 'Delivered') nextAction = '';

        return {
            data: {
                orderId: order.id,
                orderNo: order.orderNo,
                totalAmount: order.totalAmount,
                status: order.status,
                products,
                nextAction,
                address: orderAddress.address.address,
            },
        };
    }

    async updateOrdertoPackaging(orderId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
            relations: ['user'],
        });

        if (!userprofile) {
            throw new UnauthorizedException('Unauthorized');
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status != 'Payment Completed') {
            throw new BadRequestException(
                'Order not confirmed yet, awaiting payment confirmation',
            );
        }

        await this.orderRepository.update(order.id, {
            status: 'Packaging',
        });

        const usernotification = {
            recipients: [`${userprofile.user.emailAddress}`],
            data: {
                orderNo: order.orderNo,
                name: userprofile.firstName,
            },
        };

        this.noticationService.SendOrderPackaging(
            usernotification,
            (resp) => {},
        );

        return {
            message: 'Updated to Packaging',
        };
    }

    async updateOrdertoPackaged(orderId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
            relations: ['user'],
        });

        if (!userprofile) {
            throw new UnauthorizedException('Unauthorized');
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status != 'Packaging') {
            throw new BadRequestException(
                'Order needs to be updated to packaging',
            );
        }

        await this.orderRepository.update(order.id, {
            status: 'Packaged',
        });

        const usernotification = {
            recipients: [`${userprofile.user.emailAddress}`],
            data: {
                orderNo: order.orderNo,
                name: userprofile.firstName,
            },
        };

        this.noticationService.SendOrderPackaged(
            usernotification,
            (resp) => {},
        );

        return {
            message: 'Updated to Packaged',
        };
    }

    async updateOrdertoOutForDelivery(orderId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
            relations: ['user'],
        });

        if (!userprofile) {
            throw new UnauthorizedException('Unauthorized');
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status != 'Packaged') {
            throw new BadRequestException(
                'Order needs to be updated to packaged',
            );
        }

        await this.orderRepository.update(order.id, {
            status: 'Out for Delivery',
        });

        const usernotification = {
            recipients: [`${userprofile.user.emailAddress}`],
            data: {
                orderNo: order.orderNo,
                name: userprofile.firstName,
            },
        };

        this.noticationService.SendOrderOutforDelivery(
            usernotification,
            (resp) => {},
        );

        return {
            message: 'Updated to Out for Delivery',
        };
    }

    async updateOrdertoDelivered(orderId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
            relations: ['user'],
        });

        if (!userprofile) {
            throw new UnauthorizedException('Unauthorized');
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });

        if (order.status != 'Out for Delivery') {
            throw new BadRequestException(
                'Order needs to be updated to out for Delivery',
            );
        }

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        await this.orderRepository.update(order.id, {
            status: 'Delivered',
        });

        const usernotification = {
            recipients: [`${userprofile.user.emailAddress}`],
            data: {
                orderNo: order.orderNo,
                name: userprofile.firstName,
            },
        };

        this.noticationService.SendOrderDelivered(
            usernotification,
            (resp) => {},
        );

        return {
            message: 'Updated to Delivered',
        };
    }
}
