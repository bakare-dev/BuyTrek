import { IsUUID } from 'class-validator';

export class UpdateOrderDto {
    @IsUUID()
    categoryId: string;
}
