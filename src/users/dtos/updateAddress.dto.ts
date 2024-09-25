import { IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class UpdateAddressDto {
    @IsNotEmpty()
    @MinLength(3)
    address: string;
}
