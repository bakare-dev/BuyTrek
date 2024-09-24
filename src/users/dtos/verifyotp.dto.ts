import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class VerifyOtpDto {
    @IsUUID()
    userId: string;

    @IsNumber()
    @Min(100000)
    @Max(999999)
    otp: number;
}
