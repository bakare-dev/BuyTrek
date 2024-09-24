import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../../dtos/CreateUser.dto';
import { VerifyOtpDto } from '../../dtos/verifyotp.dto';
import { UserService } from '../../service/user/user.service';
import { ResendOtp } from 'src/users/dtos/resendOtp.dto';
import { LoginDto } from 'src/users/dtos/login.dto';

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
}
