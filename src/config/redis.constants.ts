import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import mainSettings from './main.settings';

export const RedisOptions: CacheModuleAsyncOptions = {
    isGlobal: true,
    imports: [ConfigModule],
    useFactory: async () => {
        const store = await redisStore({
            socket: {
                host: mainSettings.infrastructure.redis.url,
                port: parseInt(mainSettings.infrastructure.redis.port),
            },
        });
        return {
            store: () => store,
        };
    },
};
