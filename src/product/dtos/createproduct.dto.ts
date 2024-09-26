import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty()
    @MinLength(2)
    product: string;

    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @MinLength(5)
    description: string;

    @IsArray()
    pictures: any[];

    @IsUUID()
    categoryId: string;
}
