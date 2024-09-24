import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Cache } from 'cache-manager';
import mainSettings from '../config/main.settings';
import { WinstonLoggerService } from './Logger';

@Injectable()
export class AuthenticationUtils {
    private readonly JWT_SECRET = mainSettings.security.jwtSecret;
    private readonly JWT_EXPIRES_IN = '1h';
    private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
    private logger;

    constructor(@Inject('CACHE_MANAGER') private cacheManager: Cache) {
        this.logger = new WinstonLoggerService();
    }

    async generateToken(userId: string, type: number) {
        const now = new Date();

        const accessTokenExpiresIn = new Date(now.getTime() + 3600 * 1000);
        const accessToken = jwt.sign({ userId, type }, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
        });

        await this.cacheManager.set(
            `access-token-${userId}`,
            accessToken,
            3600,
        );

        const refreshTokenExpiresIn = new Date(
            now.getTime() + 7 * 24 * 3600 * 1000,
        );
        const refreshToken = jwt.sign({ userId, type }, this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        });

        await this.cacheManager.set(
            `refresh-token-${userId}`,
            refreshToken,
            604800,
        );

        return {
            accessToken: {
                token: accessToken,
                expiresIn: accessTokenExpiresIn.toISOString(),
            },
            refreshToken: {
                token: refreshToken,
                expiresIn: refreshTokenExpiresIn.toISOString(),
            },
        };
    }

    async validateToken(authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Invalid token format');
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
            const cachedToken = await this.cacheManager.get(
                `access-token-${decoded.userId}`,
            );
            if (!cachedToken || cachedToken != token) {
                throw new UnauthorizedException('Token expired or invalid');
            }
            return {
                data: decoded,
            };
        } catch (error) {
            this.logger.error(error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    async getNewTokenUsingRefreshToken(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, this.JWT_SECRET);
            const cachedRefreshToken = await this.cacheManager.get(
                `refresh-token-${decoded.userId}`,
            );
            if (!cachedRefreshToken || cachedRefreshToken != refreshToken) {
                throw new UnauthorizedException(
                    'Refresh token expired or invalid',
                );
            }

            const newTokens = await this.generateToken(
                decoded.userId,
                decoded.type,
            );
            return newTokens;
        } catch (error) {
            this.logger.error(error);
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        await this.cacheManager.del(`access-token-${userId}`);
        await this.cacheManager.del(`refresh-token-${userId}`);
    }

    async generateOtp(userId: string): Promise<string> {
        const cachedOtp = await this.cacheManager.get(`otp-${userId}`);

        if (cachedOtp) {
            this.cacheManager.del(`otp-${userId}`);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.cacheManager.set(`otp-${userId}`, otp, 300);
        return otp;
    }

    async validateOtp(otp: number, userId: string): Promise<boolean> {
        const cachedOtp = await this.cacheManager.get(`otp-${userId}`);

        if (cachedOtp && cachedOtp == otp) {
            await this.cacheManager.del(`otp-${userId}`);
            return true;
        }
        return false;
    }
}
