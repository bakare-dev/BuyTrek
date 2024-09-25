import { IsUUID } from 'class-validator';

export class UpdateDefaultAddressDto {
    @IsUUID()
    addressId: string;
}
