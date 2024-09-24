import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  emailAddress: string;

  @IsNumber()
  type: number;

  @IsNotEmpty()
  password: string;
}
