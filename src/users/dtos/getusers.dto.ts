import { IsEmail, IsNotEmpty, IsNumber, Min, MinLength } from 'class-validator';

export class GetUsersDto {
    @IsNumber()
    type: number;

    @IsNumber()
    @Min(0)
    page: number;

    @IsNumber()
    @Min(1)
    size: number;
}
