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
import { CreateProduct, GetProducts } from '../../types/types';
import { Category } from '../../entities/category.entity';
import { ProductInventory } from '../../entities/productinventory.entity';
import { ProductRating } from '../../entities/productrating.entity';

@Injectable()
export class ProductService {
    private authenticator;
    private helperUtil;

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
            ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;

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
                filteredComments,
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
        });

        if (!productData) {
            throw new NotFoundException('Product not found');
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
        });

        if (!productData) {
            throw new NotFoundException('Product not Found');
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
                ratings.reduce((acc, rating) => acc + rating, 0) /
                ratings.length;

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
                filteredComments,
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
                ratings.reduce((acc, rating) => acc + rating, 0) /
                ratings.length;

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
                filteredComments,
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
                ratings.reduce((acc, rating) => acc + rating, 0) /
                ratings.length;

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
                filteredComments,
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
                ratings.reduce((acc, rating) => acc + rating, 0) /
                ratings.length;

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
                filteredComments,
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

    async addRatingandComment(
        payload: {
            productId: string;
            rating: number;
            comment?: string;
        },
        authHeader: string,
    ) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 0) {
            throw new UnauthorizedException('Unathorized');
        }
    }

    async addNewStock(
        payload: { productId: string; totalQuantity: number },
        authHeader: string,
    ) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2) {
            throw new UnauthorizedException('Unathorized');
        }
    }

    async requestStockUpdate(productId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }
    }

    async getSellerInventory(authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 2) {
            throw new UnauthorizedException('Unathorized');
        }
    }

    async getAdminInventory(authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 3 && isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }
    }
}
