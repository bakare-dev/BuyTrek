import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductService } from './service/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Picture } from '../entities/picture.entity';
import { ProductPicture } from '../entities/productpicture.entity';
import { Category } from '../entities/category.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            User,
            Picture,
            ProductPicture,
            Category,
        ]),
    ],
    controllers: [ProductController],
    providers: [ProductService],
})
export class ProductModule {}
