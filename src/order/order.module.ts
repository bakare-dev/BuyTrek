import { Module } from '@nestjs/common';
import { OrderController } from './controller/order.controller';
import { OrderService } from './service/order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../entities/address.entity';
import { Picture } from '../entities/picture.entity';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/userprofile.entity';
import { Product } from '../entities/product.entity';
import { Cart } from '../entities/cart.entity';
import { Order } from '../entities/order.entity';
import { Transaction } from '../entities/transaction.entity';
import { OrderAddress } from '../entities/orderaddress.entity';
import { OrderProduct } from '../entities/orderproduct.entity';
import { OrderTransaction } from '../entities/ordertransaction.entities';
import { ProductPicture } from '../entities/productpicture.entity';
import { Category } from '../entities/category.entity';
import { HttpModule } from '@nestjs/axios';
import { ProductInventory } from '../entities/productinventory.entity';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([
            Address,
            Picture,
            User,
            UserProfile,
            Product,
            Cart,
            Order,
            Transaction,
            OrderAddress,
            OrderProduct,
            OrderTransaction,
            ProductPicture,
            Category,
            ProductInventory,
        ]),
    ],
    controllers: [OrderController],
    providers: [OrderService],
})
export class OrderModule {}
