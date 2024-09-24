import {
    IsNotEmpty,
    IsNumber,
    IsUUID,
    Max,
    Min,
    MinLength,
} from 'class-validator';

export class CompletePasswordReset {
    @IsUUID()
    userId: string;

    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsNumber()
    @Min(100000)
    @Max(999999)
    otp: number;
}
