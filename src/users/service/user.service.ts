import {
    Injectable,
    ConflictException,
    Inject,
    NotFoundException,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import {
    ActivateAccountPayload,
    CreateUserPayload,
    SignInPayload,
    ResendOtpPayload,
    InitiatePasswordResetPayload,
    CompletePasswordResetPayload,
    CreateProfilePayload,
    CreateAddress,
    UpdateDefaultAddress,
    UpdateAddress,
    DeleteAddress,
} from '../../types/types';
import { WinstonLoggerService } from '../../utils/Logger';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthenticationUtils } from '../../utils/Authentication';
import { NotificationService } from '../../utils/NotificationService';
import { UserProfile } from '../../entities/userprofile.entity';
import { Address } from '../../entities/address.entity';
import { Picture } from '../../entities/picture.entity';
import { HelperUtil } from 'src/utils/Helper';

@Injectable()
export class UserService {
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

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.logger = new WinstonLoggerService();

        this.authenticator = new AuthenticationUtils(cacheManager);

        this.helperUtil = new HelperUtil();
    }

    async confirmEmailAndPassword(payload: SignInPayload) {
        let user;
        const cachedUser = await this.cacheManager.get(
            `user-${payload.emailAddress}`,
        );

        if (cachedUser) {
            user = cachedUser;
        }

        if (!cachedUser) {
            user = await this.userRepository.findOne({
                where: {
                    emailAddress: payload.emailAddress,
                },
            });

            if (!user.activated) {
                return {
                    message: 'Account not activated',
                    statusCode: 403,
                    data: { userId: user.id },
                };
            }

            this.cacheManager.set(
                `user-${payload.emailAddress}`,
                user,
                604800000,
            );
        }

        if (!user) {
            throw new NotFoundException('Invalid email address');
        }

        const salt = user.salt;
        const hashedPassword = crypto
            .pbkdf2Sync(payload.password, salt, 10000, 64, 'sha512')
            .toString('hex');

        if (hashedPassword !== user.password) {
            throw new UnauthorizedException('Invalid password');
        }

        if (!user || !user.id) {
            throw new Error('User is not defined or user ID is missing');
        }

        let profileExist = false;

        const profile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: user.id,
                },
            },
        });

        if (profile) {
            profileExist = true;
        }

        const token = await this.authenticator.generateToken(user.id, 1);

        return {
            message: 'Login Successful',
            data: { token, profile: profileExist },
        };
    }

    async createUserAccount(userDetails: CreateUserPayload) {
        const existingUser = await this.userRepository.findOne({
            where: {
                emailAddress: userDetails.emailAddress,
            },
        });

        if (existingUser) {
            throw new ConflictException('Email address already exists');
        }

        const salt = this.generateSalt();

        const hashedPassword = crypto
            .pbkdf2Sync(userDetails.password, salt, 10000, 64, 'sha512')
            .toString('hex');

        userDetails.password = hashedPassword;

        const payload = this.userRepository.create({ ...userDetails, salt });
        const user = await this.userRepository.save(payload);

        delete user.password;
        delete user.salt;

        const otp = await this.authenticator.generateOtp(user.id);

        const userNotification = {
            recipients: [`${user.emailAddress}`],
            data: {
                otp,
            },
        };

        this.noticationService.sendVerifyRegistration(
            userNotification,
            () => {},
        );

        return {
            statusCode: 201,
            message: 'User account created successfully',
            data: { userId: user.id },
        };
    }

    async activateAccount(payload: ActivateAccountPayload) {
        const OtpValid = await this.authenticator.validateOtp(
            payload.otp,
            payload.userId,
        );

        if (!OtpValid) {
            throw new UnauthorizedException('Invalid OTP');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.activated = true;

        await this.userRepository.save(user);

        const userNotification = {
            recipients: [`${user.emailAddress}`],
            data: {},
        };

        this.noticationService.SendActivatedAccount(userNotification, () => {});

        return {
            message: 'Account activated successfully',
        };
    }

    async resendOtp(payload: ResendOtpPayload) {
        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId,
            },
        });

        if (!user) {
            throw new ConflictException('User not found');
        }

        const otp = await this.authenticator.generateOtp(payload.userId);

        const userNotification = {
            recipients: [`${user.emailAddress}`],
            data: {
                otp,
            },
        };

        this.noticationService.sendVerifyRegistration(
            userNotification,
            () => {},
        );

        return {
            message: 'OTP sent',
        };
    }

    async initiatePasswordReset(payload: InitiatePasswordResetPayload) {
        const user = await this.userRepository.findOne({
            where: {
                emailAddress: payload.emailAddress,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const otp = await this.authenticator.generateOtp(user.id);

        const userNotification = {
            recipients: [`${user.emailAddress}`],
            data: {
                otp,
            },
        };

        this.noticationService.SendInitiateResetPasswordOtp(
            userNotification,
            () => {},
        );

        return {
            message: `Check your mail(${user.emailAddress}) for OTP`,
            data: {
                userId: user.id,
            },
        };
    }

    async completePasswordReset(payload: CompletePasswordResetPayload) {
        const isOtpValid = await this.authenticator.validateOtp(
            payload.otp,
            payload.userId,
        );

        if (!isOtpValid) {
            throw new UnauthorizedException('Invalid OTP');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const salt = this.generateSalt();

        const hashedPassword = crypto
            .pbkdf2Sync(payload.password, salt, 10000, 64, 'sha512')
            .toString('hex');

        user.password = hashedPassword;
        user.salt = salt;

        await this.userRepository.save(user);

        this.cacheManager.del(`user-${user.emailAddress}`);

        const userNotification = {
            recipients: [`${user.emailAddress}`],
            data: {},
        };

        this.noticationService.SendCompleteResetPasswordOtp(
            userNotification,
            () => {},
        );

        return {
            message: 'Password reset successful',
        };
    }

    async generateNewAccessToken(refreshToken: string) {
        const newTokens =
            await this.authenticator.getNewTokenUsingRefreshToken(refreshToken);

        return {
            data: newTokens,
        };
    }

    async Logout(authHeader: string) {
        const decoded = await this.authenticator.validateToken(authHeader);

        await this.authenticator.logout(decoded.userId);

        return {
            message: 'Logout successful',
        };
    }

    async createProfile(payload: CreateProfilePayload, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const picture = await this.pictureRepository.findOne({
            where: {
                id: payload.pictureId,
            },
        });

        if (!picture) {
            throw new NotFoundException('Picture not found');
        }

        const userProfile = await this.userprofileRepository.create({
            ...payload,
            user,
            picture,
        });

        await this.userprofileRepository.save(userProfile);

        return {
            statusCode: 201,
            message: 'Profile created successfully',
        };
    }

    async getProfile(authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const profile = await this.userprofileRepository.findOne({
            where: {
                user: {
                    id: user.id,
                },
            },
            relations: ['picture'],
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const profileData = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            userId: isTokenValid.userId,
            pictureUrl: profile.picture.url,
        };

        return {
            data: profileData,
        };
    }

    async updateProfile(payload: any, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        let body: { firstName?: string; lastName?: string } = {};

        if (payload.firstName) body.firstName = payload.firstName;

        if (payload.lastName) body.lastName = payload.lastName;

        await this.userprofileRepository.update(
            {
                user: {
                    id: user.id,
                },
            },
            body,
        );

        return {
            message: 'Profile updated successfully',
        };
    }

    async createAddress(payload: CreateAddress, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const addressPayload = this.addressRepository.create({
            ...payload,
            user,
        });

        await this.addressRepository.save(addressPayload);

        return {
            statusCode: 201,
            message: 'Address created sucessfully',
        };
    }

    async updateDefaultAddress(
        payload: UpdateDefaultAddress,
        authHeader: string,
    ) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const address = await this.addressRepository.findOne({
            where: {
                id: payload.addressId,
            },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        const defaultAddress = await this.addressRepository.findOne({
            where: {
                user: {
                    id: user.id,
                },
                isDefault: true,
            },
        });

        if (defaultAddress) {
            await this.addressRepository.update(defaultAddress.id, {
                isDefault: false,
            });
        }

        await this.addressRepository.update(address.id, {
            isDefault: true,
        });

        return {
            message: 'Address updated to default',
        };
    }

    async getUserAddresses(query, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const { page, size } = query;

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const { skip, take } = this.helperUtil.paginate(
            parseInt(page),
            parseInt(size),
        );

        const [addresses, total] = await this.addressRepository.findAndCount({
            where: {
                user: {
                    id: user.id,
                },
            },
            skip,
            take,
        });

        return {
            data: {
                addresses,
                currentPage: parseInt(page) ?? 0,
                totalPages: Math.ceil(total / take),
                totalAddresses: total,
            },
        };
    }

    async getAddress(query: DeleteAddress, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const address = await this.addressRepository.findOne({
            where: {
                id: query.addressId,
            },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        return {
            data: {
                address,
            },
        };
    }

    async editAddress(payload: UpdateAddress, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const address = await this.addressRepository.findOne({
            where: {
                id: payload.addressId,
            },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        address.address = payload.address;

        this.addressRepository.save(address);

        return {
            message: 'Address updated successfully',
        };
    }

    async deleteAddress(query: DeleteAddress, authHeader: string) {
        const isTokenValid = await this.authenticator.validateToken(authHeader);

        const user = await this.userRepository.findOne({
            where: {
                id: isTokenValid.userId,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const address = await this.addressRepository.findOne({
            where: {
                id: query.addressId,
            },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        await this.addressRepository.delete(address.id);

        return {
            message: 'Address deleted',
        };
    }

    private generateSalt = () => {
        return crypto.randomBytes(16).toString('hex');
    };
}
