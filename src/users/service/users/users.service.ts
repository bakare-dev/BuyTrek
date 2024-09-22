import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../typeorm/entities/User';
import { Repository } from 'typeorm';
import { CreateUserParams, UpdateUserParams } from 'src/types/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRespository: Repository<User>,
  ) {}

  getUsers() {
    return this.userRespository.find();
  }

  getUserbyUsername(username: string) {
    return this.userRespository.findOne({
      where: {
        username: username,
      },
    });
  }

  createUser(userDetails: CreateUserParams) {
    const user = this.userRespository.create({
      ...userDetails,
    });

    return this.userRespository.save(user);
  }

  updateUser(id: string, payload: UpdateUserParams) {
    return this.userRespository.update({ id }, { ...payload });
  }
}
