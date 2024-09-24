import { IsNumber, IsUUID } from 'class-validator';

export class VerifyOtpDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  otp: number;
}
