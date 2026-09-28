import { describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AdminNotificationStreamService } from './admin-notification-stream.service';

describe('AdminNotificationStreamService', () => {
  it('only delivers an order event to its intended recipients', async () => {
    const service = new AdminNotificationStreamService();
    const delivered = firstValueFrom(
      service.streamFor(7).pipe(
        filter(({ type }) => type === 'notification'),
        take(1),
      ),
    );

    service.publish([7, 9], {
      kind: 'admin_order_paid',
      orderId: 42,
      orderNumber: 'SANAD-42',
      createdAt: '2026-09-27T12:00:00.000Z',
      sound: 'strong',
    });

    await expect(delivered).resolves.toMatchObject({
      type: 'notification',
      data: { orderId: 42, sound: 'strong' },
    });
  });
});
