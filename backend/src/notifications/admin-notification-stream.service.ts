import { Injectable, type MessageEvent } from '@nestjs/common';
import { interval, merge, Observable, of, Subject, timer } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

export type AdminNotificationEventKind =
  'admin_order_created' | 'admin_order_paid';

export interface AdminNotificationRealtimeEvent {
  kind: AdminNotificationEventKind;
  orderId: number;
  orderNumber: string;
  createdAt: string;
  sound: 'soft' | 'strong';
}

interface TargetedEvent {
  recipientIds: Set<number>;
  event: AdminNotificationRealtimeEvent;
}

@Injectable()
export class AdminNotificationStreamService {
  private readonly events = new Subject<TargetedEvent>();

  streamFor(userId: number): Observable<MessageEvent> {
    const connected = of<MessageEvent>({
      type: 'connected',
      retry: 3_000,
      data: { connectedAt: new Date().toISOString() },
    });
    const heartbeats = interval(20_000).pipe(
      map((): MessageEvent => ({
        type: 'heartbeat',
        data: { at: new Date().toISOString() },
      })),
    );
    const notifications = this.events.pipe(
      filter(({ recipientIds }) => recipientIds.has(userId)),
      map(({ event }): MessageEvent => ({
        type: 'notification',
        id: `${event.kind}:${event.orderId}:${event.createdAt}`,
        data: event,
      })),
    );

    // Force a periodic authenticated reconnect so a revoked or locked admin
    // cannot keep an already-open stream indefinitely.
    return merge(connected, heartbeats, notifications).pipe(
      takeUntil(timer(5 * 60_000)),
    );
  }

  publish(recipientIds: number[], event: AdminNotificationRealtimeEvent) {
    const recipients = new Set(recipientIds);
    if (recipients.size === 0) return;
    this.events.next({ recipientIds: recipients, event });
  }
}
