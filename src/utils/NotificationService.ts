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

    async sendrestockmessage(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'out-of-stock.ejs',
                subject: 'Product Out of Stock',
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

    async SendOrderPackaging(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'packaging.ejs',
                subject: 'Order Packaging in Progress',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderPackaged(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'packaged.ejs',
                subject: 'Your Order Has Been Packaged!',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderOutforDelivery(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'out-for-delivery.ejs',
                subject: 'Your Order is Out for Delivery!',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderDelivered(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'delivered.ejs',
                subject: 'Your Order Has Been Delivered!',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderNewOrder(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'new-order.ejs',
                subject: 'Payment Initiated for Your Order',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderPaymentCompleted(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'payment-completed.ejs',
                subject: 'Payment Successfully Completed',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderNewAdminOrder(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'admin-new-order.ejs',
                subject: 'New Order Available for Processing!',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }

    async SendOrderCancelled(
        message: { recipients: string[]; data: any },
        callback: (response: any) => void,
    ): Promise<void> {
        for (const recipient of message.recipients) {
            const info = {
                sender: 'noreply@bakaredev.me',
                templateFile: 'cancelled.ejs',
                subject: 'Your Order Has Been Canceled!',
                recipients: [recipient],
                data: message.data,
            };

            const response = await this.mailer.sendMail(info);
            callback(response);
        }
    }
}
