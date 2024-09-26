import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { DatabaseEngine } from './utils/DatabaseEngine';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from './config/redis.constants';
import { PictureModule } from './picture/picture.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CacheModule.registerAsync(RedisOptions),
        TypeOrmModule.forRoot(DatabaseEngine),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        UsersModule,
        PictureModule,
        CartModule,
        OrderModule,
        CategoryModule,
        ProductModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
