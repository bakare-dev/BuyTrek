import { IsNotEmpty, IsUUID, MinLength, IsOptional } from 'class-validator';

export class GetProductsDto {
    @IsOptional()
    @IsNotEmpty()
    size: number;

    @IsOptional()
    @IsNotEmpty()
    page: number;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsUUID()
    sellerId?: string;

    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    search?: string;
}
