import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Post,
    Put,
    Query,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dtos/createUser.dto';
import { VerifyOtpDto } from '../dtos/verifyotp.dto';
import { UserService } from '../service/user.service';
import { ResendOtp } from '../../users/dtos/resendOtp.dto';
import { LoginDto } from '../../users/dtos/login.dto';
import { InitiatePasswordReset } from '../../users/dtos/initiatepasswor.dto';
import { CompletePasswordReset } from '../../users/dtos/completepassword.dto';
import { CreateProfileDto } from '../dtos/createprofile.dto';
import { UpdateAddressDto } from '../dtos/updateAddress.dto';
import { CreateAddressDto } from '../dtos/createaddress.dto';
import { GetUsersDto } from '../dtos/getusers.dto';

@Controller('api/v1/user')
export class UsersController {
    constructor(private userService: UserService) {}

    @Post()
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUserAccount(createUserDto);
    }

    @Get('/all')
    getUsersByType(
        @Headers('authorization') authHeader: string,
        @Query() query: { type: number; size: number; page: number },
    ) {
        return this.userService.getUsersByType(query, authHeader);
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

    @Post('/sign-out')
    logout(@Headers('authorization') authHeader: string) {
        return this.userService.Logout(authHeader);
    }

    @Get('/profile')
    getProfile(@Headers('authorization') authHeader: string) {
        return this.userService.getProfile(authHeader);
    }

    @Post('/profile')
    createProfile(
        @Headers('authorization') authHeader: string,
        @Body() payload: CreateProfileDto,
    ) {
        return this.userService.createProfile(payload, authHeader);
    }

    @Put('/profile')
    updateProfile(
        @Headers('authorization') authHeader: string,
        @Body() payload: any,
    ) {
        return this.userService.updateProfile(payload, authHeader);
    }

    @Get('/addresses')
    getAddresses(
        @Headers('authorization') authHeader: string,
        @Query() query: { page: number; size: number },
    ) {
        return this.userService.getUserAddresses(query, authHeader);
    }

    @Get('/address')
    getAddress(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.userService.getAddress({ addressId: id }, authHeader);
    }

    @Delete('/address')
    deleteAddress(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.userService.deleteAddress({ addressId: id }, authHeader);
    }

    @Post('/address')
    createAddress(
        @Headers('authorization') authHeader: string,
        @Body() payload: CreateAddressDto,
    ) {
        return this.userService.createAddress(payload, authHeader);
    }

    @Put('/default/address')
    updateDefaultAddress(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        console.log(id);
        return this.userService.updateDefaultAddress(
            { addressId: id },
            authHeader,
        );
    }

    @Put('/address')
    updateAddress(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
        @Body() payload: UpdateAddressDto,
    ) {
        return this.userService.editAddress(
            { addressId: id, address: payload.address },
            authHeader,
        );
    }
}
