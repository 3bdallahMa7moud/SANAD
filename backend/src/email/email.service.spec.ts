import { describe, it, expect, vi } from 'vitest';
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

  it('queues one branded OTP email with a public logo and SANAD sender', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = new EmailService(
      new ConfigService({
        FRONTEND_URL: 'https://sanad.example',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'sender@gmail.com',
        SMTP_PASSWORD: 'app-password',
      }),
      { email_queue: { create } } as unknown as PrismaService,
    );
    smtpSend.mockClear();

    await service.sendOtpEmail('customer@example.com', '123456');

    expect(create).toHaveBeenCalledOnce();
    const queued = create.mock.calls[0][0].data;
    expect(queued.subject).toBe('SANAD | رمز التحقق');
    expect(queued.body_html).toContain('https://sanad.example/icon.png');
    expect(queued.body_html).toContain('123456');
    expect(queued.body_html).toContain('رمز التحقق الخاص بك');
    expect(queued.body_text).toContain('123456');
    expect(smtpSend).not.toHaveBeenCalled();
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
