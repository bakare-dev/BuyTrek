import { IsUUID } from 'class-validator';

export class DeleteAddressDto {
    @IsUUID()
    addressId: string;
}
