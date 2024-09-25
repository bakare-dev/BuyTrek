import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { WinstonLoggerService } from './Logger';
import mainSettings from '../config/main.settings';

@Injectable()
export class CloudinaryService {
    private readonly logger = new WinstonLoggerService();
    private options: Record<string, any>;

    constructor() {
        cloudinary.config({
            cloud_name: mainSettings.infrastructure.cloudinary.cloudName,
            api_key: mainSettings.infrastructure.cloudinary.apiKey,
            api_secret: mainSettings.infrastructure.cloudinary.apiSecret,
            secure: true,
        });

        this.options = {
            use_filename: true,
            unique_filename: false,
            overwrite: true,
        };
    }

    async write(file): Promise<any> {
        try {
            const tempDir = path.resolve(__dirname, '../tempFiles');
            const tempFilePath = path.join(tempDir, file.originalname);

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            await fs.promises.writeFile(tempFilePath, file.buffer);

            const cloudinaryResp = await cloudinary.uploader.upload(
                tempFilePath,
                {
                    ...this.options,
                    resource_type: 'auto',
                },
            );

            await fs.promises.unlink(tempFilePath);

            return cloudinaryResp;
        } catch (error) {
            this.logger.error('Error uploading to Cloudinary', error);
            return { error: 'internal server error' };
        }
    }
}
