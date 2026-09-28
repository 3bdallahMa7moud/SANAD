import { z } from 'zod';

import { getAccessToken, refreshAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/env/public-env';

const adminRealtimeEventSchema = z.object({
  kind: z.enum(['admin_order_created', 'admin_order_paid']),
  orderId: z.number().int().positive(),
  orderNumber: z.string().min(1),
  createdAt: z.string().min(1),
  sound: z.enum(['soft', 'strong']),
});

export type AdminRealtimeEvent = z.infer<typeof adminRealtimeEventSchema>;

interface StreamOptions {
  signal: AbortSignal;
  onConnected: () => void;
  onEvent: (event: AdminRealtimeEvent) => void;
}

async function authorizedStreamRequest(
  signal: AbortSignal,
  refreshFirst = false,
): Promise<Response> {
  const token = refreshFirst
    ? await refreshAuthSession()
    : (getAccessToken() ?? (await refreshAuthSession()));

  return fetch(`${getApiBaseUrl()}/notifications/admin/stream`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    cache: 'no-store',
    signal,
  });
}

function readEventBlock(
  block: string,
  { onConnected, onEvent }: Omit<StreamOptions, 'signal'>,
) {
  let eventName = 'message';
  const data: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }

  if (eventName === 'connected') {
    onConnected();
    return;
  }
  if (eventName !== 'notification' || data.length === 0) return;

  try {
    const parsed = adminRealtimeEventSchema.safeParse(
      JSON.parse(data.join('\n')),
    );
    if (parsed.success) onEvent(parsed.data);
  } catch {
    // Ignore an isolated malformed event; the connection remains usable.
  }
}

export async function openAdminNotificationStream({
  signal,
  onConnected,
  onEvent,
}: StreamOptions): Promise<void> {
  let response = await authorizedStreamRequest(signal);
  if (response.status === 401) {
    await response.body?.cancel();
    response = await authorizedStreamRequest(signal, true);
  }
  if (!response.ok || !response.body) {
    throw new Error(`Notification stream unavailable (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (block) readEventBlock(block, { onConnected, onEvent });
      boundary = buffer.indexOf('\n\n');
    }
  }
}
