'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, CheckCheck, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  adminKeys,
  notificationKeys,
  notificationsApi,
  type AdminNotification,
} from '@/lib/api';
import {
  openAdminNotificationStream,
  type AdminRealtimeEvent,
} from '@/lib/api/notification-stream';
import { useCopy } from '@/lib/i18n/use-copy';
import { cn } from '@/lib/utils/cn';

const SOUND_SETTING_KEY = 'sanad-admin-notification-sound';
const LAST_SOUND_KEY = 'sanad-admin-last-notification-sound';

function abortableDelay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

export function AdminNotificationCenter() {
  const _copy = useCopy();
  const locale = _copy.locale;
  const router = useRouter();
  const queryClient = useQueryClient();
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastEventRef = useRef('');
  const soundEnabledRef = useRef(true);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] =
    useState(false);

  const notificationQuery = useQuery({
    queryKey: notificationKeys.admin,
    queryFn: ({ signal }) => notificationsApi.listAdmin({ signal }),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const refreshAdminData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.admin });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
  }, [queryClient]);

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: refreshAdminData,
  });
  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: refreshAdminData,
  });

  const ensureAudio = useCallback(async (force = false) => {
    if (!force && !soundEnabledRef.current) return null;
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextConstructor) return null;

    audioContextRef.current ??= new AudioContextConstructor();
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setAudioReady(audioContextRef.current.state === 'running');
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(
    async (strength: 'soft' | 'strong') => {
      if (!soundEnabledRef.current) return;
      const context = await ensureAudio();
      if (!context || context.state !== 'running') return;

      const pattern =
        strength === 'strong'
          ? [
              { offset: 0, frequency: 880, duration: 0.18 },
              { offset: 0.22, frequency: 660, duration: 0.18 },
              { offset: 0.44, frequency: 990, duration: 0.32 },
            ]
          : [{ offset: 0, frequency: 720, duration: 0.16 }];

      for (const note of pattern) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + note.offset;
        const end = start + note.duration;
        oscillator.type = strength === 'strong' ? 'square' : 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          strength === 'strong' ? 0.2 : 0.07,
          start + 0.02,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
      }
    },
    [ensureAudio],
  );

  const handleRealtimeEvent = useCallback(
    (event: AdminRealtimeEvent) => {
      const eventKey = `${event.kind}:${event.orderId}:${event.createdAt}`;
      if (lastEventRef.current === eventKey) return;
      lastEventRef.current = eventKey;
      refreshAdminData();

      let shouldSound = true;
      try {
        const previous = JSON.parse(
          window.localStorage.getItem(LAST_SOUND_KEY) ?? 'null',
        ) as { key?: string; at?: number } | null;
        shouldSound =
          previous?.key !== eventKey ||
          Date.now() - (previous.at ?? 0) > 15_000;
        if (shouldSound) {
          window.localStorage.setItem(
            LAST_SOUND_KEY,
            JSON.stringify({ key: eventKey, at: Date.now() }),
          );
        }
      } catch {
        // Storage can be unavailable in privacy mode; in-tab deduplication remains.
      }
      if (shouldSound) void playSound(event.sound);

      if (
        shouldSound &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const paid = event.kind === 'admin_order_paid';
        const desktopNotification = new Notification(
          locale === 'ar'
            ? paid
              ? 'تم دفع طلب — يحتاج متابعة'
              : 'تم استلام طلب جديد'
            : paid
              ? 'Order paid — action required'
              : 'New order received',
          {
            body:
              locale === 'ar'
                ? `افتح الطلب ${event.orderNumber}`
                : `Open order ${event.orderNumber}`,
            tag: eventKey,
          },
        );
        desktopNotification.onclick = () => {
          window.focus();
          router.push(`/admin/orders/${event.orderId}`);
          desktopNotification.close();
        };
      }
    },
    [locale, playSound, refreshAdminData, router],
  );

  useEffect(() => {
    let storedSoundEnabled = true;
    try {
      storedSoundEnabled =
        window.localStorage.getItem(SOUND_SETTING_KEY) !== 'off';
    } catch {
      // Keep the safe default when storage is unavailable.
    }
    const desktopEnabled =
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted';
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      soundEnabledRef.current = storedSoundEnabled;
      setSoundEnabled(storedSoundEnabled);
      setDesktopNotificationsEnabled(desktopEnabled);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unlock = () => void ensureAudio();
    document.addEventListener('pointerdown', unlock, { once: true });
    return () => document.removeEventListener('pointerdown', unlock);
  }, [ensureAudio]);

  useEffect(() => {
    const controller = new AbortController();
    let retryDelay = 1_000;

    const connect = async () => {
      while (!controller.signal.aborted) {
        try {
          await openAdminNotificationStream({
            signal: controller.signal,
            onConnected: () => {
              retryDelay = 1_000;
              setConnected(true);
              refreshAdminData();
            },
            onEvent: handleRealtimeEvent,
          });
        } catch {
          if (controller.signal.aborted) return;
        }
        setConnected(false);
        await abortableDelay(retryDelay, controller.signal);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      }
    };

    void connect();
    return () => controller.abort();
  }, [handleRealtimeEvent, refreshAdminData]);

  const toggleSound = async () => {
    const enabled = !soundEnabled;
    soundEnabledRef.current = enabled;
    setSoundEnabled(enabled);
    try {
      window.localStorage.setItem(SOUND_SETTING_KEY, enabled ? 'on' : 'off');
    } catch {
      // The preference remains active for this tab.
    }
    if (enabled) {
      await ensureAudio(true);
      void playSound('strong');
    }
  };

  const handleSoundButton = async () => {
    if (soundEnabled && !audioReady) {
      await ensureAudio(true);
      void playSound('strong');
      return;
    }
    await toggleSound();
  };

  const enableDesktopNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setDesktopNotificationsEnabled(permission === 'granted');
  };

  const openNotification = (notification: AdminNotification) => {
    if (!notification.is_read) markRead.mutate(notification.id);
    if (notification.order_id) {
      router.push(`/admin/orders/${notification.order_id}`);
    }
  };

  const notifications = notificationQuery.data?.items ?? [];
  const unreadCount = notificationQuery.data?.unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={_copy(
            `Notifications, ${unreadCount} unread`,
            `الإشعارات، ${_copy.number(unreadCount)} غير مقروء`,
          )}
          className="relative"
          onPointerDown={() => void ensureAudio()}
          size="icon"
          variant="ghost"
        >
          {unreadCount > 0 ? (
            <BellRing aria-hidden="true" className="size-5" />
          ) : (
            <Bell aria-hidden="true" className="size-5" />
          )}
          {unreadCount > 0 ? (
            <span className="absolute -end-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-5 text-white">
              {unreadCount > 99 ? '99+' : _copy.number(unreadCount)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(34rem,var(--radix-dropdown-menu-content-available-height))] w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <div>
            <p className="font-semibold text-primary">
              {_copy('Order notifications', 'إشعارات الطلبات')}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 rounded-full',
                  connected ? 'bg-success' : 'bg-warning',
                )}
              />
              {_copy(
                connected ? 'Live updates connected' : 'Reconnecting…',
                connected ? 'التحديث اللحظي متصل' : 'جارٍ إعادة الاتصال…',
              )}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              size="sm"
              variant="ghost"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              {_copy('Read all', 'قراءة الكل')}
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="flex gap-2 px-3 py-2">
          <Button
            className="flex-1"
            onClick={() => void handleSoundButton()}
            size="sm"
            variant="outline"
          >
            {soundEnabled ? (
              <Volume2 aria-hidden="true" className="size-4" />
            ) : (
              <VolumeX aria-hidden="true" className="size-4" />
            )}
            {_copy(
              soundEnabled
                ? audioReady
                  ? 'Sound on'
                  : 'Enable sound'
                : 'Sound off',
              soundEnabled
                ? audioReady
                  ? 'الصوت مفعّل'
                  : 'تفعيل الصوت'
                : 'الصوت متوقف',
            )}
          </Button>
          {typeof Notification !== 'undefined' &&
          !desktopNotificationsEnabled ? (
            <Button
              className="flex-1"
              onClick={() => void enableDesktopNotifications()}
              size="sm"
              variant="outline"
            >
              {_copy('Desktop alerts', 'تنبيهات الجهاز')}
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto p-1">
          {notificationQuery.isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {_copy('Loading notifications…', 'جارٍ تحميل الإشعارات…')}
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {_copy(
                'No order notifications yet.',
                'لا توجد إشعارات طلبات بعد.',
              )}
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                className={cn(
                  'block cursor-pointer rounded-md px-3 py-3',
                  !notification.is_read && 'bg-accent/10',
                )}
                key={notification.id}
                onSelect={() => openNotification(notification)}
              >
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      notification.is_read ? 'bg-border' : 'bg-accent',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary">
                      {_copy(notification.title_en, notification.title_ar)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {_copy(notification.message_en, notification.message_ar)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {_copy.date(notification.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
