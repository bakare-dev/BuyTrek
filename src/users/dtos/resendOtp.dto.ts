import { IsUUID } from 'class-validator';

export class ResendOtp {
    @IsUUID()
    userId: string;
}
