import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    BadRequestException,
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
import { Picture } from '../../entities/picture.entity';
import { Product } from '../../entities/product.entity';
import { ProductPicture } from '../../entities/productpicture.entity';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/userprofile.entity';
import { AuthenticationUtils } from '../../utils/Authentication';
import { HelperUtil } from '../../utils/Helper';
import { WinstonLoggerService } from '../../utils/Logger';
import { NotificationService } from '../../utils/NotificationService';
import { In, Not, Repository } from 'typeorm';
import { CreateProduct, GetOrders } from 'src/types/types';

@Injectable()
export class CoreService {
    private logger;
    private authenticator;
    private noticationService = new NotificationService();
    private helperUtil;

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,

        @InjectRepository(UserProfile)
        private userprofileRepository: Repository<UserProfile>,

        @InjectRepository(Address)
        private addressRepository: Repository<Address>,

        @InjectRepository(Picture)
        private pictureRepository: Repository<Picture>,

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

        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        @InjectRepository(ProductPicture)
        private productPictureRepository: Repository<ProductPicture>,

        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.logger = new WinstonLoggerService();

        this.authenticator = new AuthenticationUtils(cacheManager);

        this.helperUtil = new HelperUtil();
    }

    async createProduct(payload: CreateProduct, authHeader: string) {
        const { product, description, amount, pictures } = payload;

        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.id,
            },
        });

        if (!user) {
            throw new BadRequestException('Unauthorized');
        }

        const productdata = await this.productRepository.create({
            product,
            user,
            description,
            amount,
        });

        const savedProduct = await this.productRepository.save(productdata);

        for (const pictureId of pictures) {
            const picture = await this.pictureRepository.findOne({
                where: {
                    id: pictureId,
                },
            });

            if (picture) {
                const productPicture = this.productPictureRepository.create({
                    product: savedProduct,
                    picture,
                });

                await this.productPictureRepository.save(productPicture);
            }
        }

        return {
            statusCode: 201,
            message: 'Product created successfully',
        };
    }

    async makeProductAvailble(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        product.isAvailable = true;

        await this.productRepository.save(product);

        return {
            message: 'Product updated',
        };
    }

    async makeProductUnAvailable(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        product.isAvailable = false;

        await this.productRepository.save(product);

        return {
            message: 'Product updated',
        };
    }

    async getProduct(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const productpictures = await this.productPictureRepository.find({
            where: {
                product: {
                    id: product.id,
                },
            },
        });

        return {
            data: {
                productId: product.id,
                product: product.product,
                amount: product.amount,
                decription: product.description,
                isAvailble: product.isAvailable,
                pictures: productpictures.map((picture) => picture.picture.url),
            },
        };
    }

    async updateProduct() {}

    async deleteProduct() {}

    async getAdminProducts() {}

    async getProducts() {}

    async getOrderTransaction() {}

    async getProductsForCustomer() {}

    async initiateOrder() {}

    async completeOrderPayment() {}

    async addToCart(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const cartProductExist = await this.cartRepository.findOne({
            where: {
                product: {
                    id: product.id,
                },
            },
        });

        if (cartProductExist) {
            throw new BadRequestException('Product Exists in Cart');
        }

        const cart = await this.cartRepository.create({
            user,
            product,
        });

        await this.cartRepository.save(cart);

        return {
            message: 'Product added to cart',
        };
    }

    async increaseProductQuantityInCart(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const cartProductExist = await this.cartRepository.findOne({
            where: {
                product: {
                    id: product.id,
                },
            },
        });

        if (!cartProductExist) {
            throw new BadRequestException('Product does not exist in Cart');
        }

        const quantity = cartProductExist.quantity;

        await this.cartRepository.update(cartProductExist.id, {
            quantity: quantity + 1,
        });

        return {
            message: 'Product added to cart',
        };
    }

    async decreaseProductQuantityInCart(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const cartProductExist = await this.cartRepository.findOne({
            where: {
                product: {
                    id: product.id,
                },
            },
        });

        if (!cartProductExist) {
            throw new BadRequestException('Product does not exist in Cart');
        }

        const quantity = cartProductExist.quantity;

        await this.cartRepository.update(cartProductExist.id, {
            quantity: quantity - 1,
        });

        return {
            message: 'Product removed from cart',
        };
    }

    async removeProductFromCart(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const cartProductExist = await this.cartRepository.findOne({
            where: {
                product: {
                    id: product.id,
                },
            },
        });

        if (!cartProductExist) {
            throw new BadRequestException('Product does not exist in Cart');
        }

        await this.cartRepository.delete(cartProductExist.id);

        return {
            message: 'Product removed from cart',
        };
    }

    async cancelOrder(orderId: string, authHeader: string) {
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
            throw new BadRequestException(
                'Order not pending/payment completed',
            );
        }

        await this.orderRepository.update(order.id, {
            status: 'Cancelled',
        });

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
            message: 'Updated to Cancelled',
        };
    }

    async getOrders(query: GetOrders, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 1) {
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

        if (isTokenValid.type != 1) {
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

        if (isTokenValid != 0) {
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

        if (isTokenValid.type != 1 && isTokenValid != 0) {
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
            });

            const productpictureurls = pictures.map(
                (picture) => picture.picture.url,
            );

            products.push({
                product: orderproduct.product.product,
                amount: orderproduct.price,
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

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
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

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
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

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
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

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const userprofile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: isTokenValid.userId,
                },
            },
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
