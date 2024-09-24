import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity';
import { Repository } from 'typeorm';
import {
  ActivateAccountPayload,
  CreateUserPayload,
  SignInPayload,
  ResendOtpPayload,
} from '../../../types/types';
import { WinstonLoggerService } from '../../../utils/Logger';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthenticationUtils } from '../../../utils/Authentication';

@Injectable()
export class UserService {
  private logger;
  private authenticator;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger = new WinstonLoggerService();
    this.authenticator = new AuthenticationUtils(this.cacheManager);
  }

  async confirmEmailAndPassword(payload: SignInPayload) {
    try {
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
        this.cacheManager.set(`user-${payload.emailAddress}`, user, 604800000);
      }

      if (!user) {
        throw new ConflictException('Invalid email address');
      }

      const salt = user.salt;
      const hashedPassword = crypto
        .pbkdf2Sync(payload.password, salt, 10000, 64, 'sha512')
        .toString('hex');

      if (hashedPassword !== user.password) {
        throw new ConflictException('Invalid password');
      }

      const token = await this.authenticator.generateToken(user.id, 1);

      return { message: 'Login Successful', data: { token } };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('An eror occurred');
    }
  }

  async createUserAccount(userDetails: CreateUserPayload) {
    try {
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

      this.logger.log(`OTP for user ${user.id}: ${otp}`);

      // let userNotification = {
      //   recipients: [`${user.emailAddress}`],
      //   data: {
      //     otp,
      //   },
      // };

      return {
        statusCode: 201,
        message: 'User account created successfully',
        data: { userId: user.id },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create user account', error);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }

  async activateAccount(payload: ActivateAccountPayload) {
    try {
      const OtpValid = await this.authenticator.validateOtp(
        payload.otp,
        payload.userId,
      );

      if (!OtpValid) {
        throw new ConflictException('Invalid OTP');
      }

      const user = await this.userRepository.findOne({
        where: {
          id: payload.userId,
        },
      });

      if (!user) {
        throw new ConflictException('User not found');
      }

      user.activated = true;

      await this.userRepository.save(user);

      return {
        message: 'Account activated successfully',
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('An eror occurred');
    }
  }

  async resendOtp(payload: ResendOtpPayload) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: payload.userId,
        },
      });

      if (!user) {
        throw new ConflictException('User not found');
      }

      const otp = await this.authenticator.generateOtp(payload.userId);

      this.logger.log(`OTP for user ${payload.userId}: ${otp}`);

      // let userNotification = {
      //   recipients: [`${user.emailAddress}`],
      //   data: {
      //     otp,
      //   },
      // };

      return {
        message: 'OTP sent',
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('An eror occurred');
    }
  }

  generateSalt = () => {
    return crypto.randomBytes(16).toString('hex');
  };
}
