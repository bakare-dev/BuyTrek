import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import mainSettings from 'src/config/main.settings';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    // const logtail = new Logtail(
    //   mainSettings.infrastructure.winston.sourceToken,
    // );

    const logFormat = winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(logFormat),
      transports: [
        // new LogtailTransport(logtail),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace ? { trace } : undefined);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
