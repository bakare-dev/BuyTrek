import { Module } from '@nestjs/common';
import { PictureController } from './controller/picture.controller';
import { PictureService } from './service/picture.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Picture } from '../entities/picture.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Picture])],
    controllers: [PictureController],
    providers: [PictureService],
})
export class PictureModule {}
