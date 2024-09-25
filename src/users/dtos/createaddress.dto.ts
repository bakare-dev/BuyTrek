import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateAddressDto {
    @IsNotEmpty()
    @MinLength(3)
    address: string;
}
