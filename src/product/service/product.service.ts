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
import { Picture } from '../../entities/picture.entity';
import { Product } from '../../entities/product.entity';
import { ProductPicture } from '../../entities/productpicture.entity';
import { User } from '../../entities/user.entity';
import { AuthenticationUtils } from '../../utils/Authentication';
import { HelperUtil } from '../../utils/Helper';
import { In, Like, Repository } from 'typeorm';
import {
    CreateInventory,
    CreateProduct,
    GetInventory,
    GetProducts,
    RatingProduct,
} from '../../types/types';
import { Category } from '../../entities/category.entity';
import { ProductInventory } from '../../entities/productinventory.entity';
import { ProductRating } from '../../entities/productrating.entity';
import { UserProfile } from '../../entities/userprofile.entity';
import { NotificationService } from '../../utils/NotificationService';

@Injectable()
export class ProductService {
    private authenticator;
    private helperUtil;
    private notificationService = new NotificationService();

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,

        @InjectRepository(Picture)
        private pictureRepository: Repository<Picture>,

        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        @InjectRepository(ProductPicture)
        private productPictureRepository: Repository<ProductPicture>,

        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,

        @InjectRepository(ProductRating)
        private productratingRepository: Repository<ProductRating>,

        @InjectRepository(ProductInventory)
        private inventoryRepository: Repository<ProductInventory>,

        @InjectRepository(UserProfile)
        private profileRepository: Repository<UserProfile>,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.authenticator = new AuthenticationUtils(cacheManager);

        this.helperUtil = new HelperUtil();
    }

    async createProduct(payload: CreateProduct, authHeader: string) {
        const { product, description, amount, pictures, categoryId } = payload;

        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2) {
            throw new UnauthorizedException('Unauthorized');
        }

        const [user, category] = await Promise.all([
            this.userRepository.findOne({ where: { id: isTokenValid.id } }),
            this.categoryRepository.findOne({ where: { id: categoryId } }),
        ]);

        if (!user) {
            throw new BadRequestException('Unauthorized');
        }

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        const productData = this.productRepository.create({
            product,
            user,
            description,
            amount,
            category,
        });

        const savedProduct = await this.productRepository.save(productData);

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

        if (isTokenValid.type != 2) {
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
            relations: ['user'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (user.id != product.user.id) {
            throw new BadRequestException('Unauthorized');
        }

        product.isAvailable = true;

        await this.productRepository.save(product);

        return {
            message: 'Product updated',
        };
    }

    async makeProductUnAvailable(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2) {
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

        if (user.id != product.user.id) {
            throw new BadRequestException('Unauthorized');
        }

        product.isAvailable = false;

        await this.productRepository.save(product);

        return {
            message: 'Product updated',
        };
    }

    async getProduct(productId: string, authHeader: string) {
        await this.authenticator.validateToken(authHeader);

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
            relations: ['picture'],
        });

        const productratings = await this.productratingRepository.find({
            where: {
                product: {
                    id: product.id,
                },
            },
        });

        const ratings = productratings.map(
            (productrating) => productrating.rating,
        );
        const comments = productratings.map(
            (productrating) => productrating.review,
        );

        const averageRating =
            ratings.length > 0
                ? ratings.reduce((acc, rating) => acc + rating, 0) /
                  ratings.length
                : 0;

        const filteredComments = comments.filter(
            (comment) => comment != null && comment != undefined,
        );

        return {
            data: {
                productId: product.id,
                product: product.product,
                amount: product.amount,
                decription: product.description,
                isAvailble: product.isAvailable,
                pictures: productpictures.map((picture) => ({
                    url: picture.picture.url,
                    id: picture.picture.id,
                })),
                averageRating,
                comments: filteredComments,
            },
        };
    }

    async updateProduct(
        payload: {
            product?: string;
            description?: string;
            amount?: number;
            pictures?: any[];
            categoryId?: string;
            productId?: string;
        },
        authHeader: string,
    ) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);
        if (isTokenValid.type != 2) {
            throw new UnauthorizedException('Unauthorized');
        }

        const {
            product,
            description,
            amount,
            pictures,
            categoryId,
            productId,
        } = payload;

        const updateData: any = {
            ...(product && { product }),
            ...(description && { description }),
            ...(amount && { amount }),
        };

        if (categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: categoryId },
            });

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            updateData.category = category;
        }

        const productData = await this.productRepository.findOne({
            where: { id: productId },
            relations: ['user'],
        });

        if (!productData) {
            throw new NotFoundException('Product not found');
        }

        if (isTokenValid.userId != productData.user.id) {
            throw new BadRequestException('Unauthorized');
        }

        if (pictures && pictures.length > 0) {
            const productPictures = await this.productPictureRepository.find({
                where: { product: { id: productData.id } },
                relations: ['picture'],
            });

            const existingPictureIds = productPictures.map((p) => p.picture.id);

            const newPictureIds = pictures.filter(
                (picture) => !existingPictureIds.includes(picture),
            );

            const picturesToRemove = productPictures.filter(
                (picture) => !pictures.includes(picture.picture.id),
            );

            if (newPictureIds.length > 0) {
                for (const picture of newPictureIds) {
                    const pictureData = await this.pictureRepository.findOneBy({
                        id: picture,
                    });
                    const productPicture =
                        await this.productPictureRepository.create({
                            picture: pictureData,
                            product: productData,
                        });

                    this.productPictureRepository.save(productPicture);
                }
            }

            if (picturesToRemove.length > 0) {
                const picturesToRemoveIds = picturesToRemove.map(
                    (p) => p.picture.id,
                );
                await this.productPictureRepository.delete({
                    picture: { id: In(picturesToRemoveIds) },
                });
            }
        }

        await this.productRepository.update(productData.id, updateData);

        return { message: 'Product updated' };
    }

    async deleteProduct(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const productData = await this.productRepository.findOne({
            where: {
                id: productId,
            },
            relations: ['user'],
        });

        if (!productData) {
            throw new NotFoundException('Product not Found');
        }

        if (isTokenValid.type == 2) {
            if (isTokenValid.userId != productData.user.id) {
                throw new BadRequestException('Unauthorized');
            }
        }

        await this.inventoryRepository.delete({
            product: {
                id: productData.id,
            },
        });

        await this.productPictureRepository.delete({
            product: {
                id: productData.id,
            },
        });

        await this.productRepository.delete(productData.id);

        return {
            message: 'Product deleted',
        };
    }

    async getSellerProducts(query: GetProducts, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        let sellerId: string;
        if (query.sellerId) {
            const seller = await this.userRepository.findOne({
                where: {
                    id: sellerId,
                },
            });

            if (!seller) {
                throw new NotFoundException('Seller not Found');
            }

            sellerId = seller.id;
        } else {
            const seller = await this.userRepository.findOne({
                where: {
                    id: isTokenValid.userId,
                },
            });

            if (!seller) {
                throw new NotFoundException('Seller not Found');
            }

            sellerId = seller.id;
        }

        let searchquery: any = {
            user: {
                id: sellerId,
            },
        };

        if (query.categoryId) searchquery.category = { id: query.categoryId };

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const [products, total] = await this.productRepository.findAndCount({
            where: searchquery,
            relations: ['category'],
            skip,
            take,
        });

        let productData = [];
        for (const product of products) {
            const pictures = await this.productPictureRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
                relations: ['picture'],
            });

            const pictureurls = pictures.map((picture) => picture.picture.url);

            const productratings = await this.productratingRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
            });

            const ratings = productratings.map(
                (productrating) => productrating.rating,
            );
            const comments = productratings.map(
                (productrating) => productrating.review,
            );

            const averageRating =
                ratings.length > 0
                    ? ratings.reduce((acc, rating) => acc + rating, 0) /
                      ratings.length
                    : 0;

            const filteredComments = comments.filter(
                (comment) => comment != null && comment != undefined,
            );

            productData.push({
                productId: product.id,
                description: product.description,
                product: product.product,
                amount: product.amount,
                isAvailable: product.isAvailable,
                category: product.category.category,
                categoryId: product.category.id,
                pictureurls,
                averageRating,
                comments: filteredComments,
            });
        }

        return {
            data: {
                products: productData,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async getProductsForCustomer(query: GetProducts, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        let searchquery: any = {
            isAvailable: true,
        };

        if (query.categoryId) searchquery.category = { id: query.categoryId };

        const [products, total] = await this.productRepository.findAndCount({
            where: searchquery,
            relations: ['category'],
            skip,
            take,
        });

        let productData = [];
        for (const product of products) {
            const pictures = await this.productPictureRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
                relations: ['picture'],
            });

            const pictureurls = pictures.map((picture) => picture.picture.url);

            const productratings = await this.productratingRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
            });

            const ratings = productratings.map(
                (productrating) => productrating.rating,
            );
            const comments = productratings.map(
                (productrating) => productrating.review,
            );

            const averageRating =
                ratings.length > 0
                    ? ratings.reduce((acc, rating) => acc + rating, 0) /
                      ratings.length
                    : 0;

            const filteredComments = comments.filter(
                (comment) => comment != null && comment != undefined,
            );

            productData.push({
                productId: product.id,
                description: product.description,
                product: product.product,
                amount: product.amount,
                category: product.category.category,
                categoryId: product.category.id,
                pictureurls,
                averageRating,
                comments: filteredComments,
            });
        }

        return {
            data: {
                products: productData,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async searchSellerProducts(query: GetProducts, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        let sellerId;
        if (query.sellerId) {
            const seller = await this.userRepository.findOne({
                where: {
                    id: sellerId,
                },
            });

            if (!seller) {
                throw new NotFoundException('Seller not Found');
            }

            sellerId = seller.id;
        } else {
            const seller = await this.userRepository.findOne({
                where: {
                    id: isTokenValid.userId,
                },
            });

            if (!seller) {
                throw new NotFoundException('Seller not Found');
            }

            sellerId = seller.id;
        }

        let searchquery: any = {
            user: {
                id: sellerId,
            },
        };

        if (query.categoryId) searchquery.category = { id: query.categoryId };

        if (query.search) searchquery.product = Like(`%${query.search}%`);

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const [products, total] = await this.productRepository.findAndCount({
            where: searchquery,
            relations: ['category'],
            skip,
            take,
        });

        let productData = [];
        for (const product of products) {
            const pictures = await this.productPictureRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
                relations: ['picture'],
            });

            const pictureurls = pictures.map((picture) => picture.picture.url);

            const productratings = await this.productratingRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
            });

            const ratings = productratings.map(
                (productrating) => productrating.rating,
            );
            const comments = productratings.map(
                (productrating) => productrating.review,
            );

            const averageRating =
                ratings.length > 0
                    ? ratings.reduce((acc, rating) => acc + rating, 0) /
                      ratings.length
                    : 0;

            const filteredComments = comments.filter(
                (comment) => comment != null && comment != undefined,
            );

            productData.push({
                productId: product.id,
                description: product.description,
                product: product.product,
                amount: product.amount,
                isAvailable: product.isAvailable,
                category: product.category.category,
                categoryId: product.category.id,
                pictureurls,
                averageRating,
                comments: filteredComments,
            });
        }

        return {
            data: {
                products: productData,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async searchProductsForCustomer(query: GetProducts, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        let searchquery: any = {
            isAvailable: true,
        };

        if (query.categoryId) searchquery.category = { id: query.categoryId };

        if (query.search) searchquery.product = Like(`%${query.search}%`);

        const [products, total] = await this.productRepository.findAndCount({
            where: searchquery,
            relations: ['category'],
            skip,
            take,
        });

        let productData = [];
        for (const product of products) {
            const pictures = await this.productPictureRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
                relations: ['picture'],
            });

            const pictureurls = pictures.map((picture) => picture.picture.url);

            const productratings = await this.productratingRepository.find({
                where: {
                    product: {
                        id: product.id,
                    },
                },
            });

            const ratings = productratings.map(
                (productrating) => productrating.rating,
            );
            const comments = productratings.map(
                (productrating) => productrating.review,
            );

            const averageRating =
                ratings.length > 0
                    ? ratings.reduce((acc, rating) => acc + rating, 0) /
                      ratings.length
                    : 0;

            const filteredComments = comments.filter(
                (comment) => comment != null && comment != undefined,
            );

            productData.push({
                productId: product.id,
                description: product.description,
                product: product.product,
                amount: product.amount,
                isAvailable: product.isAvailable,
                category: product.category.category,
                categoryId: product.category.id,
                pictureurls,
                averageRating,
                comments: filteredComments,
            });
        }

        return {
            data: {
                products: productData,
                currentPage: query.page ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async addRatingandComment(payload: RatingProduct, authHeader: string) {
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
            throw new UnauthorizedException('unauthorized');
        }

        const product = await this.productRepository.findOne({
            where: {
                id: payload.productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        let data: any = {
            rating: payload.rating,
            user,
            product,
        };

        if (payload.comment) data.review = payload.comment;

        const rating = await this.productratingRepository.create(data);

        await this.productratingRepository.save(rating);

        return {
            message: 'Thank you for rating',
        };
    }

    async addNewStock(payload: CreateInventory, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2) {
            throw new UnauthorizedException('Unauthorized');
        }

        const product = await this.productRepository.findOne({
            where: { id: payload.productId },
            relations: ['user'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const { user } = product;
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (isTokenValid.userId != user.id) {
            throw new BadRequestException('Unauthorized');
        }

        const productInventory = await this.inventoryRepository.findOne({
            where: { product: { id: product.id } },
        });

        if (productInventory) {
            productInventory.totalQuantity = payload.totalQuantity;
            productInventory.quantityInStock = payload.totalQuantity;
            await this.inventoryRepository.save(productInventory);
        } else {
            const newInventory = this.inventoryRepository.create({
                totalQuantity: payload.totalQuantity,
                quantityInStock: payload.totalQuantity,
                user,
                product,
            });
            await this.inventoryRepository.save(newInventory);
        }

        return { message: 'Stock Updated' };
    }

    async requestStockUpdate(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const product = await this.productRepository.findOne({
            where: { id: productId },
            relations: ['user'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const profile = await this.profileRepository.findOne({
            where: {
                user: {
                    id: product.user.id,
                },
            },
            relations: ['user'],
        });

        if (!profile) {
            throw new NotFoundException('User not found');
        }

        const userNotification = {
            recipients: [`${profile.user.emailAddress}`],
            data: {
                name: profile.firstName,
                product: product.product,
            },
        };

        this.notificationService.sendrestockmessage(userNotification, () => {});

        return {
            message: 'Notification Sent',
        };
    }

    async getSellerInventory(query: GetInventory, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (
            isTokenValid.type != 2 &&
            isTokenValid.type != 3 &&
            isTokenValid.type != 1
        ) {
            throw new UnauthorizedException('Unathorized');
        }

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const userId = query.sellerId || isTokenValid.userId;

        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const inventory = await this.inventoryRepository.find({
            where: {
                user: {
                    id: user.id,
                },
            },
            skip,
            take,
            relations: ['product'],
        });

        let data = [];
        inventory.map((item) => {
            data.push({
                productId: item.product.id,
                product: item.product.product,
                quantityInStock: item.quantityInStock,
                totalQuantity: item.totalQuantity,
            });
        });

        return {
            data,
        };
    }

    async getAdminInventory(query: GetInventory, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const { skip, take } = this.helperUtil.paginate(query.page, query.size);

        const inventory = await this.inventoryRepository.find({
            relations: ['product', 'user'],
            skip,
            take,
        });

        let data = [];
        inventory.map((item) => {
            data.push({
                productId: item.product.id,
                product: item.product.product,
                quantityInStock: item.quantityInStock,
                totalQuantity: item.totalQuantity,
                sellerId: item.user.id,
            });
        });

        return {
            data,
        };
    }
}
