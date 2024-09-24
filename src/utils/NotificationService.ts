import { Injectable } from '@nestjs/common';
import { MailerService } from './Mailer';

@Injectable()
export class NotificationService {
  private mailer: MailerService;

  constructor() {
    this.mailer = new MailerService();
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

  async SendActivatedAccount(
    message: { recipients: string[]; data: any },
    callback: (response: any) => void,
  ): Promise<void> {
    for (const recipient of message.recipients) {
      const info = {
        sender: 'noreply@bakaredev.me',
        templateFile: 'activated-account.ejs',
        subject: 'Account Activated Successfully',
        recipients: [recipient],
        data: message.data,
      };

      const response = await this.mailer.sendMail(info);
      callback(response);
    }
  }

  async SendInitiateResetPasswordOtp(
    message: { recipients: string[]; data: any },
    callback: (response: any) => void,
  ): Promise<void> {
    for (const recipient of message.recipients) {
      const info = {
        sender: 'noreply@bakaredev.me',
        templateFile: 'initiate-password.ejs',
        subject: 'Password Reset Request',
        recipients: [recipient],
        data: message.data,
      };

      const response = await this.mailer.sendMail(info);
      callback(response);
    }
  }

  async SendCompleteResetPasswordOtp(
    message: { recipients: string[]; data: any },
    callback: (response: any) => void,
  ): Promise<void> {
    for (const recipient of message.recipients) {
      const info = {
        sender: 'noreply@bakaredev.me',
        templateFile: 'complete-password.ejs',
        subject: 'Password Reset Successful!',
        recipients: [recipient],
        data: message.data,
      };

      const response = await this.mailer.sendMail(info);
      callback(response);
    }
  }
}
