import { Module } from '@nestjs/common';
import { UsersController } from './controller/users/users.controller';
import { UserService } from './service/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AddressService } from './service/address/address.service';
import { UserprofileService } from './userprofile/userprofile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UserService, AddressService, UserprofileService],
})
export class UsersModule {}
