import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProfileDto {
    @IsUUID()
    pictureId: string;

    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;
}
