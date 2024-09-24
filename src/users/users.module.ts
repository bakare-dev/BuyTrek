import { Module } from '@nestjs/common';
import { UsersController } from './controller/users.controller';
import { UserService } from './service/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { UserProfile } from '../entities/userprofile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserProfile, Address])],
    controllers: [UsersController],
    providers: [UserService],
})
export class UsersModule {}
