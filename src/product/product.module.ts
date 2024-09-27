import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductService } from './service/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Picture } from '../entities/picture.entity';
import { ProductPicture } from '../entities/productpicture.entity';
import { Category } from '../entities/category.entity';
import { ProductInventory } from '../entities/productinventory.entity';
import { ProductRating } from '../entities/productrating.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            User,
            Picture,
            ProductPicture,
            Category,
            ProductInventory,
            ProductRating,
        ]),
    ],
    controllers: [ProductController],
    providers: [ProductService],
})
export class ProductModule {}
