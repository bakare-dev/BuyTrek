import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../../dtos/createUser.dto';
import { VerifyOtpDto } from '../../dtos/verifyotp.dto';
import { UserService } from '../../service/user/user.service';
import { ResendOtp } from '../../../users/dtos/resendOtp.dto';
import { LoginDto } from '../../../users/dtos/login.dto';
import { InitiatePasswordReset } from '../../../users/dtos/initiatepasswor.dto';
import { CompletePasswordReset } from '../../../users/dtos/completepassword.dto';

@Controller('api/v1/user')
export class UsersController {
  constructor(private userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUserAccount(createUserDto);
  }

  @Post('/activate')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.userService.activateAccount(verifyOtpDto);
  }

  @Post('/resend-otp')
  resendOtp(@Body() resendOtp: ResendOtp) {
    return this.userService.resendOtp(resendOtp);
  }

  @Post('/sign-in')
  login(@Body() loginDto: LoginDto) {
    return this.userService.confirmEmailAndPassword(loginDto);
  }

  @Post('/initiate-password-reset')
  initiatePasswordReset(
    @Body() initiatePasswordResetDto: InitiatePasswordReset,
  ) {
    return this.userService.initiatePasswordReset(initiatePasswordResetDto);
  }

  @Post('/complete-password-reset')
  completePasswordReset(
    @Body() completePasswordResetDto: CompletePasswordReset,
  ) {
    return this.userService.completePasswordReset(completePasswordResetDto);
  }

  @Post('/refresh-token')
  getRefreshToken(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [type, refreshToken] = authHeader.split(' ');

    if (type != 'Bearer' || !refreshToken) {
      throw new UnauthorizedException('Invalid token format');
    }

    return this.userService.generateNewAccessToken(refreshToken);
  }
}
