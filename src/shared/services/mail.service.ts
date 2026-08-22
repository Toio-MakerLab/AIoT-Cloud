import { Injectable, Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

import { ApiConfigService } from './api-config.service.ts';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporterPromise?: Promise<Transporter>;

  constructor(private configService: ApiConfigService) {}

  private getTransporter(): Promise<Transporter> {
    this.transporterPromise ??= this.createTransporter();

    return this.transporterPromise;
  }

  private async createTransporter(): Promise<Transporter> {
    const { host, port, user, pass, secure } = this.configService.mailConfig;

    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
    }

    // No SMTP configured: fall back to an auto-provisioned Ethereal test
    // account so registration/verification still works in local dev.
    // Preview links for sent mails are logged to the console.
    const testAccount = await nodemailer.createTestAccount();

    this.logger.warn(`No SMTP_HOST configured — using Ethereal test inbox (${testAccount.user}). Sent emails are NOT delivered for real.`);

    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const transporter = await this.getTransporter();
    const verifyUrl = `${this.configService.mailConfig.appUrl}/verify-email?email=${encodeURIComponent(to)}&token=${token}`;

    const info = await transporter.sendMail({
      from: this.configService.mailConfig.from,
      to,
      subject: 'Verify your account',
      html: `<p>Welcome! Please verify your account by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      this.logger.log(`Verification email preview: ${previewUrl}`);
    }
  }
}
