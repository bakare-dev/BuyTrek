import {
    IsInt,
    Min,
    Max,
    IsUUID,
    IsOptional,
    IsNotEmpty,
    MinLength,
} from 'class-validator';

export class RatingProductDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsUUID()
    productId: string;

    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    comment?: string;
}
