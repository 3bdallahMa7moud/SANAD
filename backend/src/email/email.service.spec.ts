import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

const { send, smtpSend, createTransport } = vi.hoisted(() => ({
  send: vi.fn(),
  smtpSend: vi.fn(),
  createTransport: vi.fn(() => ({ sendMail: smtpSend })),
}));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));
vi.mock('nodemailer', () => ({ createTransport }));

describe('EmailService provider delivery', () => {
  const message = {
    to: 'test@example.invalid',
    subject: 'OTP',
    bodyHtml: 'test',
  };
  const createService = (
    values: Record<string, string> = { RESEND_API_KEY: 're_test' },
  ) => new EmailService(new ConfigService(values), {} as PrismaService);

  beforeEach(() => {
    send.mockReset();
    smtpSend.mockReset();
    createTransport.mockClear();
  });

  it('reports a resolved provider error as failure so the worker retries', async () => {
    send.mockResolvedValueOnce({
      data: null,
      error: { message: 'Rate limit exceeded' },
    });
    expect(await createService().sendDirect(message)).toEqual({
      success: false,
      error: 'Rate limit exceeded',
    });
  });

  it('does not acknowledge a response without a message ID', async () => {
    send.mockResolvedValueOnce({ data: null, error: null });
    expect(await createService().sendDirect(message)).toMatchObject({
      success: false,
    });
  });

  it('acknowledges an accepted message', async () => {
    send.mockResolvedValueOnce({ data: { id: 'email-1' }, error: null });
    expect(await createService().sendDirect(message)).toEqual({
      success: true,
      id: 'email-1',
    });
  });

  it('uses the Gmail account as sender and an authenticated TLS connection', async () => {
    smtpSend.mockResolvedValueOnce({ messageId: 'gmail-1' });
    const service = createService({
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'sender@gmail.com',
      SMTP_PASSWORD: 'app-password',
      EMAIL_FROM: 'noreply@example.com',
    });

    expect(await service.sendDirect(message)).toEqual({
      success: true,
      id: 'gmail-1',
    });
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'sender@gmail.com', pass: 'app-password' },
    });
    expect(smtpSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'SANAD <sender@gmail.com>' }),
    );
  });

  it('falls back to Resend when SMTP delivery fails', async () => {
    smtpSend.mockRejectedValueOnce(new Error('Invalid SMTP credentials'));
    send.mockResolvedValueOnce({ data: { id: 'resend-1' }, error: null });
    const service = createService({
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'sender@gmail.com',
      SMTP_PASSWORD: 'app-password',
      RESEND_API_KEY: 're_test',
    });

    await expect(service.sendDirect(message)).resolves.toEqual({
      success: true,
      id: 'resend-1',
    });
    expect(smtpSend).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledOnce();
  });

  it('delivers one branded OTP email synchronously with a public logo', async () => {
    const service = new EmailService(
      new ConfigService({
        FRONTEND_URL: 'https://sanad.example',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'sender@gmail.com',
        SMTP_PASSWORD: 'app-password',
      }),
      {} as PrismaService,
    );
    smtpSend.mockResolvedValueOnce({ messageId: 'otp-1' });

    await expect(
      service.sendOtpEmail('customer@example.com', '123456'),
    ).resolves.toEqual({ success: true, id: 'otp-1' });

    expect(smtpSend).toHaveBeenCalledOnce();
    const sent = smtpSend.mock.calls[0][0];
    expect(sent.subject).toBe('SANAD | رمز التحقق');
    expect(sent.html).toContain('https://sanad.example/icon.png');
    expect(sent.html).toContain('123456');
    expect(sent.html).toContain('رمز التحقق الخاص بك');
    expect(sent.text).toContain('123456');
  });

  it('refuses simulated delivery in production, including placeholder credentials', () => {
    expect(() =>
      createService({
        NODE_ENV: 'production',
        RESEND_API_KEY: 're_placeholder',
      }),
    ).toThrow(/Production requires/);
  });
});
