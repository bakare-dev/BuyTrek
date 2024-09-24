import { Module } from '@nestjs/common';
import { CoreController } from './controller/core/core.controller';
import { CoreService } from './service/core/core.service';

@Module({
    controllers: [CoreController],
    providers: [CoreService],
})
export class CoreModule {}
