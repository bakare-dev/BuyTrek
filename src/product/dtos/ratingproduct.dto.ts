import { IsInt, Min, Max } from 'class-validator';

export class RatingProductDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
}
