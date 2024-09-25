import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PictureService } from '../service/picture.service';
import { Express } from 'express';

@Controller('media-upload')
export class PictureController {
    constructor(private readonly pictureService: PictureService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const result = await this.pictureService.uploadPicture(file);

        return result;
    }
}
