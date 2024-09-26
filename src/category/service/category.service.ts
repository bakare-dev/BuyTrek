import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { AuthenticationUtils } from '../../utils/Authentication';
import { HelperUtil } from '../../utils/Helper';
import { Repository } from 'typeorm';
import { CreateCategory, UpdateCategory } from '../../types/types';
import { Category } from '../../entities/category.entity';

@Injectable()
export class CategoryService {
    private authenticator;
    private helperUtil;

    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.authenticator = new AuthenticationUtils(cacheManager);

        this.helperUtil = new HelperUtil();
    }

    async createCategory(payload: CreateCategory, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const category = await this.categoryRepository.create(payload);

        return this.categoryRepository.save(category);
    }

    async getCategories(authHeader: string) {
        await this.authenticator.validateToken(authHeader);

        const [categories, total] =
            await this.categoryRepository.findAndCount();

        return {
            data: { categories, total },
        };
    }

    async updateCategory(payload: UpdateCategory, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const category = await this.categoryRepository.findOne({
            where: {
                id: payload.categoryId,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        await this.categoryRepository.update(category.id, {
            category: payload.category,
        });

        return {
            message: 'Category Updated',
        };
    }

    async deleteCategory(categoryId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const category = await this.categoryRepository.findOne({
            where: {
                id: categoryId,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        await this.categoryRepository.delete(category.id);

        return {
            message: 'Category deleted',
        };
    }

    async getCategory(categoryId: string, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        if (isTokenValid.type != 1) {
            throw new UnauthorizedException('Unathorized');
        }

        const category = await this.categoryRepository.findOne({
            where: {
                id: categoryId,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return {
            data: {
                category,
            },
        };
    }
}
