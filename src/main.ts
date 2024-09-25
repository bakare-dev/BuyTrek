import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mainSettings from './config/main.settings';
import { WinstonLoggerService } from './utils/Logger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const logger = new WinstonLoggerService();

    const app = await NestFactory.create(AppModule, {
        logger: new WinstonLoggerService(),
    });

    app.enableCors();

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(mainSettings.server.port);

    logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
