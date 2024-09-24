import {
  Injectable,
  ConflictException,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity';
import { Repository } from 'typeorm';
import {
  ActivateAccountPayload,
  CreateUserPayload,
  SignInPayload,
  ResendOtpPayload,
  InitiatePasswordResetPayload,
  CompletePasswordResetPayload,
} from '../../../types/types';
import { WinstonLoggerService } from '../../../utils/Logger';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthenticationUtils } from '../../../utils/Authentication';
import { NotificationService } from '../../../utils/NotificationService';

@Injectable()
export class UserService {
  private logger;
  private authenticator;
  private noticationService = new NotificationService();

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger = new WinstonLoggerService();
    this.authenticator = new AuthenticationUtils(cacheManager);
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

      this.cacheManager.set(`user-${payload.emailAddress}`, user, 604800000);
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

    const token = await this.authenticator.generateToken(user.id, 1);

    return { message: 'Login Successful', data: { token } };
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

    this.noticationService.sendVerifyRegistration(userNotification, () => {});

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

    this.noticationService.sendVerifyRegistration(userNotification, () => {});

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

  generateSalt = () => {
    return crypto.randomBytes(16).toString('hex');
  };
}
