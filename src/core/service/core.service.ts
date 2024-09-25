import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Address } from '../../entities/address.entity';
import { Cart } from '../../entities/cart.entity';
import { Order } from '../../entities/order.entity';
import { OrderAddress } from '../../entities/orderaddress.entity';
import { OrderProduct } from '../../entities/orderproduct.entity';
import { OrderTransaction } from '../../entities/ordertransaction.entities';
import { Picture } from '../../entities/picture.entity';
import { Product } from '../../entities/product.entity';
import { ProductPicture } from '../../entities/productpicture.entity';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/userprofile.entity';
import { AuthenticationUtils } from '../../utils/Authentication';
import { HelperUtil } from '../../utils/Helper';
import { WinstonLoggerService } from '../../utils/Logger';
import { NotificationService } from '../../utils/NotificationService';
import { Repository } from 'typeorm';

@Injectable()
export class CoreService {
    private logger;
    private authenticator;
    private noticationService = new NotificationService();
    private helperUtil;

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,

        @InjectRepository(UserProfile)
        private userprofileRepository: Repository<UserProfile>,

        @InjectRepository(Address)
        private addressRepository: Repository<Address>,

        @InjectRepository(Picture)
        private pictureRepository: Repository<Picture>,

        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,

        @InjectRepository(Order)
        private orderRepository: Repository<Order>,

        @InjectRepository(OrderAddress)
        private orderAddressRepository: Repository<OrderAddress>,

        @InjectRepository(OrderProduct)
        private orderproductRepository: Repository<OrderProduct>,

        @InjectRepository(OrderTransaction)
        private orderTransactionRepository: Repository<OrderTransaction>,

        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        @InjectRepository(ProductPicture)
        private productPictureRepository: Repository<ProductPicture>,

        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.logger = new WinstonLoggerService();

        this.authenticator = new AuthenticationUtils(cacheManager);

        this.helperUtil = new HelperUtil();
    }
}
