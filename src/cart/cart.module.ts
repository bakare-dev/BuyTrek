import { Module } from '@nestjs/common';
import { CartController } from './controller/cart.controller';
import { CartService } from './service/cart.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { ProductPicture } from '../entities/productpicture.entity';
import { User } from '../entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Cart, Product, ProductPicture, User])],
    controllers: [CartController],
    providers: [CartService],
})
export class CartModule {}
