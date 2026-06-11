import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { getConfigNumber } from '../common/utils/config-number.util';

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    if (this.configService.get<string>('EMAIL_ENABLED', 'true') === 'false') {
      this.logger.warn('Email delivery is disabled by EMAIL_ENABLED=false');
      return;
    }

    this.transporter = createTransport({
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: getConfigNumber(this.configService, 'EMAIL_PORT', 587),
      secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_PASS'),
      },
    });
  }

  async sendMail(input: SendMailInput) {
    if (!this.transporter) {
      this.logger.warn(`Skipped email to ${input.to}: email delivery is disabled`);
      return { accepted: [input.to], rejected: [], messageId: 'email-disabled' };
    }

    try {
      return await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM') ?? this.configService.get('EMAIL_USER'),
        ...input,
      });
    } catch (error) {
      const smtpError = error as { code?: string; responseCode?: number; command?: string };
      this.logger.error(
        `Email delivery failed: code=${smtpError.code ?? 'unknown'} responseCode=${
          smtpError.responseCode ?? 'unknown'
        } command=${smtpError.command ?? 'unknown'}`,
      );
      throw new ServiceUnavailableException(
        'Email provider rejected the message. Check EMAIL_USER and EMAIL_PASS.',
      );
    }
  }

  sendOtp(to: string, otp: string, expiresInMinutes: number) {
    const appName = this.configService.get<string>('APP_NAME', 'SHOJOGI');

    return this.sendMail({
      to,
      subject: `${appName} verification code`,
      text: `Your ${appName} OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${appName} verification code</h2>
          <p>Your OTP is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in ${expiresInMinutes} minutes.</p>
        </div>
      `,
    });
  }
}
