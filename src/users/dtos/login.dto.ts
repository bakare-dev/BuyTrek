import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  emailAddress: string;

  @IsString()
  password: string;
}
