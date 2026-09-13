import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

export interface QueueEmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateName?: string;
  templateData?: Record<string, any>;
  priority?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly smtpTransporter: nodemailer.Transporter | null = null;
  private readonly emailFrom: string;
  private readonly providerType: 'resend' | 'smtp' | 'mock';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const fromAddress = smtpHost
      ? this.configService.get<string>('SMTP_FROM_EMAIL') ||
        smtpUser ||
        this.configService.get<string>('EMAIL_FROM') ||
        'SANAD <notifications@sanad.ae>'
      : this.configService.get<string>('EMAIL_FROM') ||
        this.configService.get<string>('SMTP_FROM_EMAIL') ||
        'SANAD <notifications@sanad.ae>';
    this.emailFrom = fromAddress.includes('<')
      ? fromAddress
      : `SANAD <${fromAddress}>`;

    if (smtpHost) {
      // 1. SMTP Provider (Gmail, SES, Sendgrid, custom SMTP)
      const smtpPort = parseInt(
        this.configService.get<string>('SMTP_PORT') || '587',
        10,
      );
      const isSecure =
        this.configService.get<string>('SMTP_SECURE') === 'true' ||
        smtpPort === 465;
      const smtpPass = this.configService.get<string>('SMTP_PASSWORD');

      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        auth:
          smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      });

      this.providerType = 'smtp';
      this.logger.log(
        `SMTP email provider initialized successfully (host: ${smtpHost}, port: ${smtpPort})`,
      );
    } else if (resendApiKey && resendApiKey !== 're_placeholder') {
      // 2. Resend Provider
      this.resend = new Resend(resendApiKey);
      this.providerType = 'resend';
      this.logger.log('Resend email provider initialized successfully');
    } else {
      // 3. Mock fallback in Development
      this.providerType = 'mock';
      this.logger.warn(
        'Neither SMTP nor RESEND_API_KEY is configured. Development email delivery will be simulated without logging message bodies.',
      );
    }
  }

  // Queue an email to the DB queue for non-blocking asynchronous dispatch
  async queueEmail(options: QueueEmailOptions) {
    return this.prisma.email_queue.create({
      data: {
        recipient_email: options.to,
        recipient_name: options.recipientName || '',
        subject: options.subject,
        body_html: options.bodyHtml,
        body_text: options.bodyText || '',
        template_name: options.templateName,
        template_data: options.templateData || {},
        priority: options.priority ?? 5,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      },
    });
  }

  // Directly send email via SMTP, Resend or Mock
  async sendDirect(options: {
    to: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    if (this.providerType === 'smtp' && this.smtpTransporter) {
      try {
        const info = await this.smtpTransporter.sendMail({
          from: this.emailFrom,
          to: options.to,
          subject: options.subject,
          html: options.bodyHtml,
          text: options.bodyText,
        });

        return { success: true, id: info.messageId };
      } catch (err: any) {
        this.logger.error(`SMTP send failed: ${err.message}`, err.stack);
        return { success: false, error: err.message };
      }
    } else if (this.providerType === 'resend' && this.resend) {
      try {
        const data = await this.resend.emails.send({
          from: this.emailFrom,
          to: [options.to],
          subject: options.subject,
          html: options.bodyHtml,
          text: options.bodyText,
        });

        if (data.error || !data.data?.id) {
          return {
            success: false,
            error:
              data.error?.message || 'Email provider returned no message ID',
          };
        }
        return { success: true, id: data.data.id };
      } catch (err: any) {
        this.logger.error(`Resend send failed: ${err.message}`, err.stack);
        return { success: false, error: err.message };
      }
    } else {
      // Mock delivery for dev/testing
      this.logger.log(
        `[MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject}`,
      );
      return { success: true, id: `mock_email_${Date.now()}` };
    }
  }

  // Standard email builders
  async sendWelcomeEmail(email: string, name: string) {
    const safeName = this.escapeHtml(name);
    const subject = 'مرحباً بك في منصة سند | Welcome to SANAD';
    const bodyHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>مرحباً بك يا ${safeName} في منصة سند</h2>
        <p>يسعدنا انضمامك إلى منصة سند لتطوير مسارك المهني والارتقاء بسيرتك الذاتية وتجهيزك للفرص الوظيفية الأفضل.</p>
        <p>يمكنك تصفح باقاتنا وخدماتنا المهنية الآن من خلال لوحة التحكم الخاصة بك.</p>
        <br/>
        <p>فريق سند للخدمات المهنية</p>
      </div>
    `;

    return this.queueEmail({
      to: email,
      recipientName: name,
      subject,
      bodyHtml,
      templateName: 'welcome',
      templateData: { name },
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
    const safeName = this.escapeHtml(name);
    const safeResetUrl = this.escapeHtml(resetUrl);
    const subject = 'إعادة تعيين كلمة المرور - منصة سند';
    const bodyHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>طلب إعادة تعيين كلمة المرور</h2>
        <p>مرحباً ${safeName}،</p>
        <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة سند. اضغط على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
        <p><a href="${safeResetUrl}" style="display:inline-block; padding:10px 20px; background-color:#1e3a8a; color:#fff; text-decoration:none; border-radius:5px;">إعادة تعيين كلمة المرور</a></p>
        <p>الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب ذلك بنفسك، يمكنك تجاهل هذه الرسالة بأمان.</p>
      </div>
    `;

    return this.queueEmail({
      to: email,
      recipientName: name,
      subject,
      bodyHtml,
      templateName: 'password_reset',
      templateData: { name, resetUrl },
      priority: 1,
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    const safeOtp = this.escapeHtml(otp);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3001';
    const logoUrl = this.escapeHtml(
      new URL('/icon.png', frontendUrl).toString(),
    );
    const subject = 'SANAD | رمز التحقق';
    const bodyHtml = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f6f1e9;font-family:Tahoma,Arial,sans-serif;color:#17202a;">
          <div style="display:none;font-size:1px;color:#f6f1e9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">رمز التحقق من SANAD صالح لمدة 10 دقائق.</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f1e9;">
            <tr><td align="center" style="padding:32px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e9ddc8;border-radius:16px;overflow:hidden;">
                <tr><td align="center" style="background:#0b2744;padding:28px 24px 24px;">
                  <img src="${logoUrl}" width="88" height="88" alt="SANAD | سند" style="display:block;width:88px;height:88px;border:0;border-radius:12px;background:#fff8ed;">
                  <p style="margin:14px 0 0;color:#e4ceaa;font-size:13px;letter-spacing:2px;font-weight:700;">SANAD</p>
                </td></tr>
                <tr><td style="height:4px;background:#b8955a;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td align="center" style="padding:34px 28px 30px;">
                  <h1 style="margin:0 0 12px;color:#0b2744;font-size:25px;line-height:1.5;">رمز التحقق الخاص بك</h1>
                  <p style="margin:0;color:#526070;font-size:15px;line-height:1.9;">أدخل الرمز التالي لإكمال تسجيل الدخول إلى SANAD</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background:#fff8ed;border:1px solid #e4ceaa;border-radius:12px;">
                    <tr><td align="center" dir="ltr" style="padding:18px 12px;color:#0b2744;font-family:Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:8px;">${safeOtp}</td></tr>
                  </table>
                  <p style="margin:0;color:#526070;font-size:14px;line-height:1.8;">هذا الرمز صالح لمدة <strong>10 دقائق</strong>.</p>
                </td></tr>
                <tr><td align="center" style="padding:20px 28px 26px;background:#f9f6f0;border-top:1px solid #e9ddc8;">
                  <p style="margin:0;color:#687380;font-size:12px;line-height:1.8;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.</p>
                  <p style="margin:12px 0 0;color:#0b2744;font-size:12px;font-weight:700;">SANAD · سند</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `;
    const bodyText = `SANAD | رمز التحقق\n\nرمز التحقق الخاص بك: ${otp}\n\nهذا الرمز صالح لمدة 10 دقائق. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.`;

    await this.queueEmail({
      to: email,
      subject,
      bodyHtml,
      bodyText,
      templateName: 'otp_verification',
      templateData: { otp },
      priority: 1,
    });

  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character] || character,
    );
  }
}
