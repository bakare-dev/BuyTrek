import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsUUID,
    MinLength,
    IsOptional,
} from 'class-validator';

export class UpdateProductDto {
    @IsOptional()
    @IsNotEmpty()
    @MinLength(2)
    product?: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsNotEmpty()
    @MinLength(5)
    description?: string;

    @IsOptional()
    @IsArray()
    pictures?: any[];

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsUUID()
    productId?: string;
}
