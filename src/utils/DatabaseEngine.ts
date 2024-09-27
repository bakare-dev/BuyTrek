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
import { Category } from '../entities/category.entity';
import mainSettings from '../config/main.settings';
import { ProductRating } from '../entities/productrating.entity';
import { ProductInventory } from '../entities/productinventory.entity';

const dbConfig =
    mainSettings.infrastructure.environment == 'production'
        ? config.database.production
        : config.database.development;

export const DatabaseEngine: TypeOrmModuleOptions = {
    type: 'mysql',
    host: dbConfig.host,
    port: 3306,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [
        User,
        UserProfile,
        Transaction,
        Picture,
        Address,
        Product,
        ProductPicture,
        ProductRating,
        ProductInventory,
        Cart,
        Order,
        OrderAddress,
        OrderTransaction,
        OrderProduct,
        Category,
    ],
    synchronize: true,
    logging: dbConfig.logging,
};
