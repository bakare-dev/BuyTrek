import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import config from '../config/main.settings';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/userprofile.entity';
import { Transaction } from '../entities/transaction.entity';
import { Picture } from '../entities/picture.entity';
import { Address } from '../entities/address.entity';
import { Product } from '../entities/product.entity';
import { ProductPicture } from '../entities/productpicture.entity';
import { Cart } from '../entities/cart.entity';
import { Order } from '../entities/order.entity';
import { OrderAddress } from '../entities/orderaddress.entity';
import { OrderTransaction } from '../entities/ordertransaction.entities';
import { OrderProduct } from '../entities/orderproduct.entity';

export const DatabaseEngine: TypeOrmModuleOptions = {
    type: 'mysql',
    host: config.database.development.host,
    port: 3306,
    username: config.database.development.username,
    password: config.database.development.password,
    database: config.database.development.database,
    entities: [
        User,
        UserProfile,
        Transaction,
        Picture,
        Address,
        Product,
        ProductPicture,
        Cart,
        Order,
        OrderAddress,
        OrderTransaction,
        OrderProduct,
    ],
    synchronize: true,
    logging: config.database.development.logging,
};
