import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  emailAddress: string;

  @IsString()
  @MinLength(8)
  password: string;
}
