import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import { WinstonLoggerService } from './Logger';
import mainSettings from '../config/main.settings';

@Injectable()
export class MailerService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new WinstonLoggerService();

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: mainSettings.infrastructure.smtp.host,
            port: mainSettings.infrastructure.smtp.port,
            secure: false,
            auth: {
                user: mainSettings.infrastructure.smtp.user,
                pass: mainSettings.infrastructure.smtp.password,
            },
        });
    }

    async sendMail(info: {
        sender: string;
        recipients: string[];
        subject: string;
        templateFile: string;
        data: any;
    }): Promise<{ status: string; message: any }> {
        try {
            const templatePath = `${process.cwd()}/src/templates/${info.templateFile}`;

            const emailContent = await ejs.renderFile(templatePath, info.data);

            const message = {
                from: info.sender,
                to: info.recipients,
                subject: info.subject,
                html: emailContent,
            };

            const result = await this.transporter.sendMail(message);
            return { status: 'success', message: result };
        } catch (error) {
            this.logger.error('Failed to send email', error.stack);
            return { status: 'failed', message: error.message };
        }
    }
}
