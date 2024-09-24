import {
    Inject,
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { AuthenticationUtils } from '../utils/Authentication';
import mainSettings from '../config/main.settings';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    private rateLimiter: RateLimiterMemory;

    private unprotectedRoutes = mainSettings.security.unprotectedRoutes;

    private authService;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        this.authService = new AuthenticationUtils(cacheManager);
        this.rateLimiter = new RateLimiterMemory({
            points: 10,
            duration: 1,
        });
    }

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            await this.rateLimiter.consume(req.ip);

            res.header('Access-Control-Allow-Origin', '*');
            res.header(
                'Access-Control-Allow-Methods',
                'GET,HEAD,PUT,PATCH,POST,DELETE',
            );
            res.header(
                'Access-Control-Allow-Headers',
                'Content-Type, Authorization, source, auth_mode',
            );
            res.header('Access-Control-Allow-Credentials', 'true');

            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }

            if (this.unprotectedRoutes.includes(req.path)) {
                return next();
            }

            const token = req.headers['authorization'];
            if (!token) {
                throw new UnauthorizedException('No token provided');
            }

            const data = await this.authService.validateToken(token);
            if (data.data) {
                req.body.isAuth = true;
                req.body.userId = data.data.userId;
                req.body.type = data.data.type;
                return next();
            } else {
                throw new UnauthorizedException('Invalid token');
            }
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return res.status(401).json({ message: error.message });
            }
            return res.status(429).json({ message: 'Too Many Requests' });
        }
    }
}
