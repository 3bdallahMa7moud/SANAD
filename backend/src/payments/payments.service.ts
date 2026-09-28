import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConfirmDemoPaymentDto,
  ConfirmManualPaymentDto,
  CreatePaymentDto,
  PaymentFilterDto,
} from './dto';
import { createPaginatedResponse } from '../common/utils';
import { ConfigService } from '@nestjs/config';
import {
  createPaymentBypassResponse,
  createPaymentBypassTransactionId,
  PAYMENT_BYPASS_PROVIDER,
  PAYMENT_BYPASS_TRANSACTION_PREFIX,
} from './payment-bypass';
import {
  normalizeDemoCardNumber,
  PAYMENT_DEMO_CARD,
  PAYMENT_DEMO_PROVIDER,
  PAYMENT_DEMO_TRANSACTION_PREFIX,
} from './payment-demo';
import * as crypto from 'crypto';
import {
  PAYMENT_PROVIDER_TOKEN,
  PaymentProvider,
} from './interfaces/payment-provider.interface';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER_TOKEN)
    private readonly paymentProvider: PaymentProvider,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Customer initiates payment for an order
  async createPayment(userId: number, dto: CreatePaymentDto) {
    const configuredProvider =
      this.configService.get<string>('PAYMENT_PROVIDER') || 'mock';
    if (configuredProvider === 'disabled' || configuredProvider === 'manual') {
      throw new ServiceUnavailableException({
        message:
          'Online checkout is temporarily unavailable while card payments are being activated.',
        code: 'CHECKOUT_DISABLED',
      });
    }

    const paymentBypassed = configuredProvider === PAYMENT_BYPASS_PROVIDER;
    const paymentDemo = configuredProvider === PAYMENT_DEMO_PROVIDER;

    if (dto.payment_method && dto.payment_method !== 'card') {
      throw new BadRequestException({
        message: 'Only bank card payments are supported',
        code: 'CARD_PAYMENT_ONLY',
      });
    }

    if (dto.return_url) {
      const allowedOrigin = new URL(
        this.configService.get<string>('FRONTEND_URL') ||
          'http://localhost:3001',
      ).origin;
      let returnOrigin: string;
      try {
        returnOrigin = new URL(dto.return_url).origin;
      } catch {
        throw new BadRequestException('Invalid payment return URL');
      }
      if (returnOrigin !== allowedOrigin) {
        throw new BadRequestException('Payment return URL is not allowed');
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${dto.order_id} FOR UPDATE`;
        const order = await tx.orders.findUnique({
          where: { id: dto.order_id },
          include: { package: true },
        });

        if (!order) {
          throw new NotFoundException({
            message: 'Order not found',
            code: 'ORDER_NOT_FOUND',
          });
        }
        if (order.user_id !== userId) {
          throw new ForbiddenException({
            message: 'You do not have access to this order',
            code: 'ORDER_FORBIDDEN',
          });
        }
        if (
          paymentBypassed &&
          (order.status === 'paid' || order.status === 'completed')
        ) {
          const existingBypass = await tx.payments.findFirst({
            where: {
              order_id: order.id,
              transaction_id: {
                startsWith: PAYMENT_BYPASS_TRANSACTION_PREFIX,
              },
            },
            orderBy: { created_at: 'desc' },
          });
          if (existingBypass) {
            return this.formatBypassResult(
              existingBypass,
              Number(order.final_amount),
              true,
            );
          }
        }
        if (order.status === 'paid' || order.status === 'completed') {
          throw new BadRequestException({
            message: 'This order has already been paid for',
            code: 'ORDER_ALREADY_PAID',
          });
        }
        if (order.status === 'cancelled' || order.status === 'refunded') {
          throw new BadRequestException({
            message: `Cannot pay for an order in status: ${order.status}`,
            code: 'ORDER_INVALID_STATUS',
          });
        }

        if (paymentBypassed) {
          if (!['pending', 'pending_payment'].includes(order.status)) {
            throw new BadRequestException({
              message: `Cannot bypass payment for an order in status: ${order.status}`,
              code: 'ORDER_INVALID_STATUS',
            });
          }

          const now = new Date();
          // Invalidate sessions created before bypass mode was enabled so a
          // late webhook cannot create a second financial event.
          await tx.payments.updateMany({
            where: { order_id: order.id, status: 'pending' },
            data: { status: 'failed', payment_date: now },
          });

          const transactionId = createPaymentBypassTransactionId();
          const payment = await tx.payments.create({
            data: {
              order_id: order.id,
              transaction_id: transactionId,
              payment_method: 'other',
              amount: 0,
              currency: 'AED',
              status: 'paid',
              payment_date: now,
              payment_response: createPaymentBypassResponse(
                Number(order.final_amount),
              ),
            },
          });

          const updatedOrder = await tx.orders.updateMany({
            where: {
              id: order.id,
              status: { in: ['pending', 'pending_payment'] },
            },
            data: { status: 'paid' },
          });
          if (updatedOrder.count !== 1) {
            throw new BadRequestException({
              message: 'Order status changed and cannot bypass payment',
              code: 'ORDER_STATUS_CONFLICT',
            });
          }

          await tx.order_status_history.create({
            data: {
              order_id: order.id,
              from_status: order.status,
              to_status: 'paid',
              changed_by: userId,
              note: `Payment temporarily bypassed (${transactionId})`,
            },
          });
          await tx.notifications.create({
            data: {
              user_id: userId,
              order_id: order.id,
              title_ar: 'تم تأكيد طلبك بنجاح',
              title_en: 'Order Confirmed Successfully',
              message_ar: `تم تأكيد طلبك رقم ${order.order_number} وسيبدأ فريق سند العمل عليه قريبًا.`,
              message_en: `Your order #${order.order_number} is confirmed and the SANAD team will begin work soon.`,
              notification_type: 'order_confirmed',
            },
          });
          await tx.email_queue.create({
            data: {
              recipient_email: order.customer_email,
              recipient_name: order.customer_name,
              subject: `تأكيد الطلب رقم ${order.order_number}`,
              body_html: `<p>تم تأكيد طلبك رقم <strong>${order.order_number}</strong> وسيبدأ فريق سند العمل عليه قريبًا.</p>`,
              body_text: `تم تأكيد طلبك رقم ${order.order_number} وسيبدأ فريق سند العمل عليه قريبًا.`,
              template_name: 'order_payment_bypassed',
              template_data: {
                order_number: order.order_number,
                order_amount: Number(order.final_amount),
                charged_amount: 0,
                currency: 'AED',
              },
              status: 'pending',
            },
          });

          this.logger.warn(
            `Payment bypass applied to order ${order.order_number}; charged amount is 0 AED`,
          );
          return this.formatBypassResult(
            payment,
            Number(order.final_amount),
            false,
          );
        }

        const pending = await tx.payments.findFirst({
          where: { order_id: order.id, status: 'pending' },
          orderBy: { created_at: 'desc' },
        });
        if (pending) {
          const response = pending.payment_response as Record<string, unknown>;
          const pendingProvider = response?.provider;
          const belongsToConfiguredProvider = paymentDemo
            ? pendingProvider === 'sanad_demo' &&
              pending.transaction_id.startsWith(PAYMENT_DEMO_TRANSACTION_PREFIX)
            : configuredProvider === 'xpay'
              ? pendingProvider === 'xpay' &&
                pending.transaction_id.startsWith('cs_')
              : configuredProvider === 'mock'
                ? pendingProvider === 'mock_gateway'
                : false;
          if (belongsToConfiguredProvider) {
            return {
              payment_id: pending.id,
              transaction_id: pending.transaction_id,
              payment_url: response?.paymentUrl,
              client_secret: response?.clientSecret,
              amount:
                paymentDemo && typeof response?.displayAmount === 'number'
                  ? response.displayAmount
                  : Number(pending.amount),
              charged_amount: Number(pending.amount),
              currency: pending.currency,
              status: pending.status,
              requires_payment: true,
              reused: true,
            };
          }

          // A checkout-mode switch must not revive a session created by a
          // different provider (especially a no-charge demo session).
          await tx.payments.updateMany({
            where: { id: pending.id, status: 'pending' },
            data: { status: 'failed', payment_date: new Date() },
          });
        }

        if (paymentDemo) {
          const transactionId = `${PAYMENT_DEMO_TRANSACTION_PREFIX}${crypto.randomUUID()}`;
          const paymentUrl = new URL(
            '/checkout/pay',
            this.configService.get<string>('FRONTEND_URL') ||
              'http://localhost:3001',
          );
          paymentUrl.searchParams.set('txn', transactionId);
          paymentUrl.searchParams.set('orderId', order.order_number);
          paymentUrl.searchParams.set(
            'amount',
            Number(order.final_amount).toFixed(2),
          );

          const payment = await tx.payments.create({
            data: {
              order_id: order.id,
              transaction_id: transactionId,
              payment_method: 'card',
              // Demo checkout never records collected revenue.
              amount: 0,
              currency: 'AED',
              status: 'pending',
              payment_response: {
                provider: 'sanad_demo',
                testMode: true,
                displayAmount: Number(order.final_amount),
                paymentUrl: paymentUrl.toString(),
              },
            },
          });
          if (order.status === 'pending') {
            await tx.orders.update({
              where: { id: order.id },
              data: { status: 'pending_payment' },
            });
          }

          return {
            payment_id: payment.id,
            transaction_id: transactionId,
            payment_url: paymentUrl.toString(),
            amount: Number(order.final_amount),
            charged_amount: 0,
            currency: 'AED',
            status: 'pending',
            requires_payment: true,
          };
        }

        const intent = await this.paymentProvider.createPaymentIntent({
          orderId: order.id,
          orderNumber: order.order_number,
          amount: Number(order.final_amount),
          currency: 'AED',
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          returnUrl: dto.return_url,
        });
        const payment = await tx.payments.create({
          data: {
            order_id: order.id,
            transaction_id: intent.transactionId,
            payment_method: dto.payment_method || 'card',
            amount: order.final_amount,
            currency: intent.currency,
            status: 'pending',
            payment_response: { ...intent },
          },
        });
        if (order.status === 'pending') {
          await tx.orders.update({
            where: { id: order.id },
            data: { status: 'pending_payment' },
          });
        }

        return {
          payment_id: payment.id,
          transaction_id: intent.transactionId,
          payment_url: intent.paymentUrl,
          client_secret: intent.clientSecret,
          amount: intent.amount,
          currency: intent.currency,
          status: 'pending',
        };
      },
      { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 15_000 },
    );
  }

  async confirmDemoPayment(userId: number, dto: ConfirmDemoPaymentDto) {
    if (
      this.configService.get<string>('PAYMENT_PROVIDER') !==
      PAYMENT_DEMO_PROVIDER
    ) {
      throw new BadRequestException({
        message: 'Test payment confirmation is disabled.',
        code: 'PAYMENT_DEMO_DISABLED',
      });
    }

    const validCard =
      normalizeDemoCardNumber(dto.card_number) === PAYMENT_DEMO_CARD.number &&
      dto.expiry.trim() === PAYMENT_DEMO_CARD.expiry &&
      dto.cvc.trim() === PAYMENT_DEMO_CARD.cvc &&
      dto.cardholder_name.trim().toUpperCase() ===
        PAYMENT_DEMO_CARD.cardholderName;
    if (!validCard) {
      throw new BadRequestException({
        message: 'The test card details are not valid.',
        code: 'PAYMENT_DEMO_CARD_INVALID',
      });
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.payments.findUnique({
          where: { transaction_id: dto.transaction_id },
          include: { order: true },
        });
        if (
          !payment ||
          !payment.transaction_id.startsWith(PAYMENT_DEMO_TRANSACTION_PREFIX)
        ) {
          throw new NotFoundException({
            message: 'Test payment session not found.',
            code: 'PAYMENT_DEMO_NOT_FOUND',
          });
        }
        if (payment.order.user_id !== userId) {
          throw new ForbiddenException({
            message: 'You do not have access to this payment session.',
            code: 'PAYMENT_FORBIDDEN',
          });
        }

        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.order_id} FOR UPDATE`;
        if (payment.status === 'paid') {
          return {
            orderId: payment.order.id,
            orderNumber: payment.order.order_number,
            amount: Number(payment.order.final_amount),
            idempotent: true,
            adminRecipientIds: [] as number[],
          };
        }
        if (payment.status !== 'pending') {
          throw new ConflictException({
            message: 'This test payment session is no longer active.',
            code: 'PAYMENT_DEMO_NOT_PENDING',
          });
        }
        if (!['pending', 'pending_payment'].includes(payment.order.status)) {
          throw new ConflictException({
            message: 'The order is no longer awaiting payment.',
            code: 'ORDER_STATUS_CONFLICT',
          });
        }

        const now = new Date();
        const updatedPayment = await tx.payments.updateMany({
          where: { id: payment.id, status: 'pending' },
          data: {
            status: 'paid',
            payment_date: now,
            payment_response: {
              provider: 'sanad_demo',
              testMode: true,
              displayAmount: Number(payment.order.final_amount),
              chargedAmount: 0,
              lastFour: '4242',
              confirmedAt: now.toISOString(),
            },
          },
        });
        if (updatedPayment.count !== 1) {
          throw new ConflictException({
            message: 'This test payment was already processed.',
            code: 'PAYMENT_STATUS_CONFLICT',
          });
        }

        const updatedOrder = await tx.orders.updateMany({
          where: {
            id: payment.order.id,
            status: { in: ['pending', 'pending_payment'] },
          },
          data: { status: 'paid' },
        });
        if (updatedOrder.count !== 1) {
          throw new ConflictException({
            message: 'Order status changed and cannot accept this payment.',
            code: 'ORDER_STATUS_CONFLICT',
          });
        }

        await tx.order_status_history.create({
          data: {
            order_id: payment.order.id,
            from_status: payment.order.status,
            to_status: 'paid',
            changed_by: userId,
            note: `TEST PAYMENT confirmed (${payment.transaction_id}); no funds collected`,
          },
        });
        await tx.notifications.create({
          data: {
            user_id: userId,
            order_id: payment.order.id,
            title_ar: 'تم تأكيد الدفع بنجاح',
            title_en: 'Payment confirmed successfully',
            message_ar: `تم تأكيد الدفع التجريبي للطلب رقم ${payment.order.order_number}. سيتواصل معك فريق خدمة العملاء قريبًا. لم يتم خصم أي مبلغ.`,
            message_en: `The test payment for order #${payment.order.order_number} was confirmed. Customer service will contact you soon. No money was charged.`,
            notification_type: 'payment_confirmed',
          },
        });

        const adminRecipientIds =
          await this.notificationsService.createAdminOrderNotification(tx, {
            orderId: payment.order.id,
            titleAr: 'طلب مدفوع يحتاج متابعة',
            titleEn: 'Paid order needs follow-up',
            messageAr: `أتم العميل ${payment.order.customer_name} الدفع التجريبي للطلب ${payment.order.order_number}. يرجى التواصل معه.`,
            messageEn: `${payment.order.customer_name} completed the test payment for order ${payment.order.order_number}. Please contact the customer.`,
            type: 'admin_order_paid',
          });

        await tx.email_queue.create({
          data: {
            recipient_email: payment.order.customer_email,
            recipient_name: payment.order.customer_name,
            subject: `تم تأكيد الدفع - طلب ${payment.order.order_number}`,
            body_html: `<p>تم تأكيد الدفع التجريبي لطلبك رقم <strong>${payment.order.order_number}</strong>.</p><p>سيتواصل معك فريق خدمة العملاء قريبًا. لم يتم خصم أي مبلغ حقيقي.</p>`,
            body_text: `تم تأكيد الدفع التجريبي لطلبك رقم ${payment.order.order_number}. سيتواصل معك فريق خدمة العملاء قريبًا. لم يتم خصم أي مبلغ حقيقي.`,
            template_name: 'demo_payment_confirmation',
            template_data: {
              order_number: payment.order.order_number,
              display_amount: Number(payment.order.final_amount),
              charged_amount: 0,
              currency: 'AED',
              test_mode: true,
            },
            status: 'pending',
          },
        });

        const supportSetting = await tx.settings.findUnique({
          where: { setting_key: 'support_email' },
          select: { setting_value: true },
        });
        const supportEmail = supportSetting?.setting_value?.trim();
        if (supportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
          await tx.email_queue.create({
            data: {
              recipient_email: supportEmail,
              recipient_name: 'SANAD Customer Service',
              subject: `متابعة طلب تجريبي مدفوع ${payment.order.order_number}`,
              body_html: `<p>أتم العميل <strong>${payment.order.customer_name}</strong> (${payment.order.customer_email}) الدفع التجريبي للطلب <strong>${payment.order.order_number}</strong>.</p><p>يرجى التواصل معه. لم يتم تحصيل أي مبلغ حقيقي.</p>`,
              body_text: `أتم العميل ${payment.order.customer_name} (${payment.order.customer_email}) الدفع التجريبي للطلب ${payment.order.order_number}. يرجى التواصل معه. لم يتم تحصيل أي مبلغ حقيقي.`,
              template_name: 'demo_payment_support_follow_up',
              template_data: {
                order_number: payment.order.order_number,
                customer_name: payment.order.customer_name,
                customer_email: payment.order.customer_email,
                customer_phone: payment.order.customer_phone,
                charged_amount: 0,
                test_mode: true,
              },
              status: 'pending',
            },
          });
        }

        return {
          orderId: payment.order.id,
          orderNumber: payment.order.order_number,
          amount: Number(payment.order.final_amount),
          idempotent: false,
          adminRecipientIds,
        };
      },
      { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 15_000 },
    );

    if (!result.idempotent) {
      this.notificationsService.publishAdminOrderEvent(
        result.adminRecipientIds,
        {
          kind: 'admin_order_paid',
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          createdAt: new Date().toISOString(),
          sound: 'strong',
        },
      );
    }

    this.logger.warn(
      `No-charge demo payment confirmed for order ${result.orderNumber}; charged amount is 0 AED`,
    );
    return {
      order_id: result.orderId,
      order_number: result.orderNumber,
      status: 'paid',
      amount: result.amount,
      charged_amount: 0,
      currency: 'AED',
      test_mode: true,
      idempotent: result.idempotent,
      redirect_url: '/my-orders?payment=success',
    };
  }

  // Admin confirms money collected outside the website (payment link, QR,
  // bank transfer, cash, or another reconciled channel).
  async confirmManualPayment(adminId: number, dto: ConfirmManualPaymentDto) {
    if (this.configService.get<string>('PAYMENT_PROVIDER') !== 'manual') {
      throw new BadRequestException({
        message: 'Manual payment confirmation is disabled.',
        code: 'MANUAL_PAYMENT_DISABLED',
      });
    }

    const paymentDate = dto.payment_date
      ? new Date(dto.payment_date)
      : new Date();
    if (paymentDate.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new BadRequestException({
        message: 'Payment date cannot be in the future',
        code: 'PAYMENT_DATE_IN_FUTURE',
      });
    }

    const payment = await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${dto.order_id} FOR UPDATE`;
        const order = await tx.orders.findUnique({
          where: { id: dto.order_id },
        });

        if (!order) {
          throw new NotFoundException({
            message: 'Order not found',
            code: 'ORDER_NOT_FOUND',
          });
        }
        if (!['pending', 'pending_payment'].includes(order.status)) {
          throw new BadRequestException({
            message: `Cannot confirm payment for an order in status: ${order.status}`,
            code: 'ORDER_INVALID_STATUS',
          });
        }

        const existingCollectedPayment = await tx.payments.findFirst({
          where: {
            order_id: order.id,
            status: { in: ['paid', 'success'] },
            amount: { gt: 0 },
          },
        });
        if (existingCollectedPayment) {
          throw new ConflictException({
            message: 'A collected payment is already recorded for this order',
            code: 'PAYMENT_ALREADY_CONFIRMED',
          });
        }

        const receivedMinorUnits = Math.round(dto.amount * 100);
        const expectedMinorUnits = Math.round(Number(order.final_amount) * 100);
        if (receivedMinorUnits !== expectedMinorUnits) {
          throw new BadRequestException({
            message: `Payment amount must exactly match the order total (${Number(order.final_amount).toFixed(2)} AED)`,
            code: 'PAYMENT_AMOUNT_MISMATCH',
          });
        }

        // A manual confirmation supersedes any online session that might have
        // been created before the checkout mode changed.
        await tx.payments.updateMany({
          where: { order_id: order.id, status: 'pending' },
          data: { status: 'failed', payment_date: paymentDate },
        });

        const transactionId = `manual_${crypto.randomUUID()}`;
        const created = await tx.payments.create({
          data: {
            order_id: order.id,
            transaction_id: transactionId,
            payment_method: dto.payment_method,
            amount: dto.amount,
            currency: 'AED',
            status: 'paid',
            payment_date: paymentDate,
            payment_response: {
              source: 'manual_admin_confirmation',
              confirmed_by: adminId,
              ...(dto.transaction_reference?.trim()
                ? { external_reference: dto.transaction_reference.trim() }
                : {}),
              ...(dto.note?.trim() ? { note: dto.note.trim() } : {}),
            },
          },
        });

        const updatedOrder = await tx.orders.updateMany({
          where: {
            id: order.id,
            status: { in: ['pending', 'pending_payment'] },
          },
          data: { status: 'paid' },
        });
        if (updatedOrder.count !== 1) {
          throw new ConflictException({
            message: 'Order status changed; reload before confirming payment',
            code: 'ORDER_STATUS_CONFLICT',
          });
        }

        await tx.order_status_history.create({
          data: {
            order_id: order.id,
            from_status: order.status,
            to_status: 'paid',
            changed_by: adminId,
            note: `External payment confirmed by admin (${transactionId})`,
          },
        });
        await tx.admin_activity_log.create({
          data: {
            admin_id: adminId,
            action: 'confirm_manual_payment',
            table_name: 'payments',
            record_id: created.id,
            description: `Confirmed ${dto.amount.toFixed(2)} AED for order #${order.order_number}`,
            changes: {
              order_id: order.id,
              payment_method: dto.payment_method,
              amount: dto.amount,
              transaction_reference: dto.transaction_reference?.trim() || null,
              payment_date: paymentDate.toISOString(),
            },
          },
        });

        if (order.user_id) {
          await tx.notifications.create({
            data: {
              user_id: order.user_id,
              order_id: order.id,
              title_ar: 'تم تأكيد استلام الدفع',
              title_en: 'Payment received',
              message_ar: `تم تأكيد استلام مبلغ ${dto.amount.toFixed(2)} AED للطلب رقم ${order.order_number}.`,
              message_en: `We confirmed receipt of ${dto.amount.toFixed(2)} AED for order #${order.order_number}.`,
              notification_type: 'payment_confirmed',
            },
          });
          await tx.email_queue.create({
            data: {
              recipient_email: order.customer_email,
              recipient_name: order.customer_name,
              subject: `Payment received for order ${order.order_number}`,
              body_html: `<p>We confirmed receipt of <strong>${dto.amount.toFixed(2)} AED</strong> for order <strong>${order.order_number}</strong>.</p>`,
              body_text: `We confirmed receipt of ${dto.amount.toFixed(2)} AED for order ${order.order_number}.`,
              template_name: 'manual_payment_confirmation',
              template_data: {
                order_number: order.order_number,
                amount: dto.amount,
                currency: 'AED',
                payment_method: dto.payment_method,
              },
              status: 'pending',
            },
          });
        }

        return created;
      },
      { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 15_000 },
    );

    this.logger.log(
      `Manual payment ${payment.transaction_id} confirmed for order ${dto.order_id} by admin ${adminId}`,
    );
    return payment;
  }

  // Customer or Admin gets payment status
  async getPayment(
    paymentId: number,
    userId: number,
    isAdmin: boolean = false,
  ) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            user_id: true,
            status: true,
            customer_name: true,
            customer_email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment record not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    if (!isAdmin && payment.order.user_id !== userId) {
      throw new ForbiddenException({
        message: 'Access denied to this payment record',
        code: 'PAYMENT_FORBIDDEN',
      });
    }

    if (!isAdmin) {
      const { payment_response: _privateReconciliation, ...customerPayment } =
        payment;
      return customerPayment;
    }

    return payment;
  }

  // Process a verified gateway callback idempotently.
  async handleWebhook(payload: unknown, signature: string, rawBody: Buffer) {
    this.logger.log('Processing payment webhook callback');

    const verified = await this.paymentProvider.verifyWebhook(
      payload,
      signature,
      rawBody,
    );
    const { transactionId, orderId, status, amount, currency, rawPayload } =
      verified;

    const existingPayment = await this.prisma.payments.findUnique({
      where: { transaction_id: transactionId },
    });
    if (!existingPayment) {
      throw new BadRequestException({
        message: 'Unknown payment transaction',
        code: 'UNKNOWN_PAYMENT_TRANSACTION',
      });
    }
    if (existingPayment.order_id !== orderId) {
      throw new BadRequestException({
        message: 'Transaction does not belong to the supplied order',
        code: 'PAYMENT_ORDER_MISMATCH',
      });
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);

    const amountInMinorUnits = Math.round(amount * 100);
    const expectedOrderAmount = Math.round(Number(order.final_amount) * 100);
    const expectedPaymentAmount = Math.round(
      Number(existingPayment.amount) * 100,
    );
    if (
      !Number.isFinite(amount) ||
      amountInMinorUnits !== expectedOrderAmount ||
      amountInMinorUnits !== expectedPaymentAmount
    ) {
      throw new BadRequestException({
        message: 'Payment amount does not match order amount',
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }

    const normalizedCurrency = currency.toUpperCase();
    const expectedCurrency = (existingPayment.currency || 'AED').toUpperCase();
    if (normalizedCurrency !== expectedCurrency) {
      throw new BadRequestException({
        message: 'Payment currency does not match payment intent',
        code: 'PAYMENT_CURRENCY_MISMATCH',
      });
    }

    if (existingPayment.status === 'paid') {
      return {
        received: true,
        idempotent: true,
        message: 'Payment already processed and verified',
      };
    }
    if (existingPayment.status !== 'pending') {
      return {
        received: true,
        idempotent: true,
        ignored: true,
        message: `Payment is already in terminal status: ${existingPayment.status}`,
      };
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payments.updateMany({
        where: { id: existingPayment.id, status: { not: 'paid' } },
        data: {
          status: status === 'paid' ? 'paid' : 'failed',
          payment_date: new Date(),
          payment_response: rawPayload,
        },
      });

      if (updatedPayment.count === 0) {
        return { idempotent: true, adminRecipientIds: [] as number[] };
      }

      let adminRecipientIds: number[] = [];

      if (status === 'paid') {
        if (['cancelled', 'refunded'].includes(order.status)) {
          throw new BadRequestException({
            message: `Cannot pay an order in status ${order.status}`,
            code: 'ORDER_INVALID_STATUS',
          });
        }

        const updatedOrder = await tx.orders.updateMany({
          where: {
            id: orderId,
            status: { notIn: ['cancelled', 'refunded'] },
          },
          data: { status: 'paid' },
        });
        if (updatedOrder.count !== 1) {
          throw new BadRequestException({
            message: 'Order status changed and cannot accept payment',
            code: 'ORDER_STATUS_CONFLICT',
          });
        }
        await tx.order_status_history.create({
          data: {
            order_id: orderId,
            from_status: order.status,
            to_status: 'paid',
            changed_by: order.user_id,
            note: `Payment confirmed via webhook (${transactionId})`,
          },
        });

        if (order.user_id) {
          await tx.notifications.create({
            data: {
              user_id: order.user_id,
              order_id: orderId,
              title_ar: 'تم تأكيد الدفع بنجاح',
              title_en: 'Payment Confirmed Successfully',
              message_ar: `تم استلام دفعتك بنجاح لطلبك رقم ${order.order_number}. فريق سند سيبدأ العمل على طلبك قريباً.`,
              message_en: `Your payment of ${amount} ${normalizedCurrency} for order #${order.order_number} has been confirmed.`,
              notification_type: 'payment_confirmed',
            },
          });
          await tx.email_queue.create({
            data: {
              recipient_email: order.customer_email,
              recipient_name: order.customer_name,
              subject: `تأكيد استلام الدفع - طلب رقم ${order.order_number}`,
              body_html: `<p>تم تأكيد دفع طلب رقم <strong>${order.order_number}</strong> بمبلغ ${amount} ${normalizedCurrency}.</p>`,
              body_text: `تم تأكيد دفع طلب رقم ${order.order_number} بمبلغ ${amount} ${normalizedCurrency}.`,
              template_name: 'payment_confirmation',
              template_data: {
                order_number: order.order_number,
                amount,
                currency: normalizedCurrency,
              },
              status: 'pending',
            },
          });
        }

        adminRecipientIds =
          await this.notificationsService.createAdminOrderNotification(tx, {
            orderId,
            titleAr: 'تم دفع طلب جديد',
            titleEn: 'New order payment received',
            messageAr: `أتم العميل ${order.customer_name} دفع الطلب ${order.order_number}.`,
            messageEn: `${order.customer_name} paid for order ${order.order_number}.`,
            type: 'admin_order_paid',
          });
      }

      return { idempotent: false, adminRecipientIds };
    });

    if (outcome.idempotent) {
      return {
        received: true,
        idempotent: true,
        message: 'Payment already processed and verified',
      };
    }

    if (status === 'paid') {
      this.notificationsService.publishAdminOrderEvent(
        outcome.adminRecipientIds,
        {
          kind: 'admin_order_paid',
          orderId,
          orderNumber: order.order_number,
          createdAt: new Date().toISOString(),
          sound: 'strong',
        },
      );
    }

    return {
      received: true,
      processed: true,
      transaction_id: transactionId,
      status,
    };
  }

  // --- Admin Queries ---

  async findAllAdmin(query: PaymentFilterDto) {
    const where: Record<string, any> = {};

    if (query.status) where.status = query.status;
    if (query.order_id) where.order_id = query.order_id;
    if (query.transaction_id) {
      where.transaction_id = {
        contains: query.transaction_id,
        mode: 'insensitive',
      };
    }
    if (query.search) {
      where.OR = [
        { transaction_id: { contains: query.search, mode: 'insensitive' } },
        {
          order: {
            order_number: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          order: {
            customer_name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          order: {
            customer_email: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.payments.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              order_number: true,
              customer_name: true,
              customer_email: true,
              status: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payments.count({ where }),
    ]);

    return createPaginatedResponse(items, total, query.page, query.limit);
  }

  async findOneAdmin(id: number) {
    const payment = await this.prisma.payments.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            package: { select: { id: true, name_ar: true, name_en: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    return payment;
  }

  private formatBypassResult(
    payment: {
      id: number;
      transaction_id: string;
      currency: string | null;
    },
    orderAmount: number,
    reused: boolean,
  ) {
    return {
      payment_id: payment.id,
      transaction_id: payment.transaction_id,
      payment_url: null,
      amount: orderAmount,
      charged_amount: 0,
      currency: payment.currency || 'AED',
      status: 'paid',
      bypassed: true,
      requires_payment: false,
      reused,
    };
  }
}
