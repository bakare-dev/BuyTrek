import { IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class UpdateCategoryDto {
    @IsNotEmpty()
    @MinLength(3)
    category?: string;
}
