import { IsEmail } from 'class-validator';

export class InitiatePasswordReset {
    @IsEmail()
    emailAddress: string;
}
