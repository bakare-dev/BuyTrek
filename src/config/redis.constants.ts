import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import mainSettings from './main.settings';

export const RedisOptions: CacheModuleAsyncOptions = {
    isGlobal: true,
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
            socket: {
                host: configService.get<string>(
                    mainSettings.infrastructure.redis.url,
                ),
                port: parseInt(mainSettings.infrastructure.redis.port),
            },
        });
        return {
            store: () => store,
        };
    },
    inject: [ConfigService],
};
