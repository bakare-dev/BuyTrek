import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Picture } from '../../entities/Picture.entity';
import { Repository } from 'typeorm';
import { WinstonLoggerService } from '../../utils/Logger';
import { CloudinaryService } from '../../utils/Cloudinary';
import * as fs from 'fs';

@Injectable()
export class PictureService {
    private logger: WinstonLoggerService;
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
    private cloudinaryService: CloudinaryService;

    constructor(
        @InjectRepository(Picture)
        private PictureRepository: Repository<Picture>,
    ) {
        this.logger = new WinstonLoggerService();
        this.cloudinaryService = new CloudinaryService();
    }

    async uploadPicture(file: Express.Multer.File): Promise<any> {
        try {
            if (!file) {
                throw new BadRequestException('No file uploaded');
            }

            if (file.size > this.MAX_FILE_SIZE) {
                throw new BadRequestException(
                    'File exceeds the 10MB size limit',
                );
            }

            const uploadResult = await this.cloudinaryService.write(file);

            const picture = this.PictureRepository.create({
                url: uploadResult.secure_url,
            });

            const savedPicture = await this.PictureRepository.save(picture);

            return {
                message: 'File uploaded successfully',
                data: savedPicture,
            };
        } catch (error) {
            this.logger.error('Error uploading picture', error);
            throw new InternalServerErrorException('Internal server error');
        }
    }
}
