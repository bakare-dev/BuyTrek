import { Injectable } from '@nestjs/common';
import { MailerService } from './Mailer';

@Injectable()
export class NotificationService {
  private mailer: MailerService;

  constructor(private readonly mailerService: MailerService) {
    this.mailer = mailerService;
  }

  async sendVerifyRegistration(
    message: { recipients: string[]; data: any },
    callback: (response: any) => void,
  ): Promise<void> {
    for (const recipient of message.recipients) {
      const info = {
        sender: 'noreply@bakaredev.me',
        templateFile: 'verify-registration.ejs',
        subject: 'Account Created Successfully',
        recipients: [recipient],
        data: message.data,
      };

      const response = await this.mailer.sendMail(info);
      callback(response);
    }
  }
}
