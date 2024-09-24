import { IsEmail, IsNotEmpty, IsNumber, Min, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  emailAddress: string;

  @IsNumber()
  @Min(0)
  type: number;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
