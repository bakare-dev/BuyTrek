import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CoreModule } from './core/core.module';
import { DatabaseEngine } from './utils/DatabaseEngine';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from './config/redis.constants';
import { PictureModule } from './picture/picture.module';

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
        CoreModule,
        PictureModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
