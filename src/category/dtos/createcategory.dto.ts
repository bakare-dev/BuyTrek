import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateCategoryDto {
    @IsNotEmpty()
    @MinLength(3)
    category: string;
}
