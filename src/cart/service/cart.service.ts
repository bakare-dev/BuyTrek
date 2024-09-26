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
import { Cart } from '../../entities/cart.entity';
import { Product } from '../../entities/product.entity';
import { ProductPicture } from '../../entities/productpicture.entity';
import { User } from '../../entities/user.entity';
import { AuthenticationUtils } from '../../utils/Authentication';
import { Repository } from 'typeorm';

@Injectable()
export class CartService {
    private authenticator;

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,

        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,

        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        @InjectRepository(ProductPicture)
        private productPictureRepository: Repository<ProductPicture>,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.authenticator = new AuthenticationUtils(cacheManager);
    }

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
                isAvailable: true,
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
                user: {
                    id: user.id,
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

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not Found');
        }

        const product = await this.productRepository.findOne({
            where: {
                id: productId,
                isAvailable: true,
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
                user: {
                    id: user.id,
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

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not Found');
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
                user: {
                    id: user.id,
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

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not Found');
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
                user: {
                    id: user.id,
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

    async getCart(authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not Found');
        }

        const cart = await this.cartRepository.find({
            where: {
                user: {
                    id: user.id,
                },
                product: {
                    isAvailable: true,
                },
            },
            relations: ['product'],
        });

        if (cart.length == 0) {
            throw new NotFoundException('Cart is Empty');
        }

        let basket = [];
        let totalAmount = 0;
        for (const item of cart) {
            const product = item.product;

            const quatity = item.quantity;

            const productTotalAmount = quatity * product.amount;

            totalAmount += productTotalAmount;

            const productpictures = await this.productPictureRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
                relations: ['picture'],
            });

            const pictureUrls = productpictures.map(
                (picture) => picture.picture.url,
            );

            basket.push({
                productId: product.id,
                product: product.product,
                quatity,
                amount: product.amount,
                productTotalAmount,
                description: product.description,
                pictureUrls,
            });
        }

        return {
            data: { cart: basket, totalAmount },
        };
    }
}
