import { Module } from '@nestjs/common';
import { CoreController } from './controller/core.controller';
import { CoreService } from './service/core.service';
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

@Module({
    imports: [
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
        ]),
    ],
    controllers: [CoreController],
    providers: [CoreService],
})
export class CoreModule {}
