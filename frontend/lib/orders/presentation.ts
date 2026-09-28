export const CUSTOMER_SERVICE_WHATSAPP_NUMBER = '201554968707';
export const CUSTOMER_SERVICE_WHATSAPP_DISPLAY = '01554968707';

function isArabicLocale(locale?: string): boolean {
  if (locale) return locale.startsWith('ar');
  if (typeof document !== 'undefined') {
    return document.documentElement.lang?.startsWith('ar') || false;
  }
  return false;
}

const statusTranslations: Record<string, string> = {
  pending: 'قيد الانتظار',
  pending_payment: 'في انتظار الدفع',
  paid: 'مدفوع',
  awaiting_information: 'بانتظار البيانات',
  received: 'تم استلام بيانات الطلب',
  in_progress: 'قيد التنفيذ',
  under_review: 'قيد المراجعة',
  ready: 'جاهز للتسليم',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
  active: 'نشط',
  inactive: 'غير نشط',
  published: 'منشور',
  draft: 'مسودة',
  hidden: 'مخفي',
  success: 'ناجح',
  failed: 'فاشل',
  locked: 'مقفل',
};

export function formatMoney(
  value: number | string,
  currency = 'AED',
  locale?: string,
): string {
  const isAr = isArabicLocale(locale);
  return new Intl.NumberFormat(isAr ? 'ar-AE' : 'en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/** Formats a UI number using the numeral system appropriate for the locale. */
export function formatNumber(
  value: number,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): string {
  const isAr = isArabicLocale(locale);
  return new Intl.NumberFormat(
    isAr ? 'ar-AE-u-nu-arab' : 'en-AE',
    options,
  ).format(value);
}

export function formatDate(
  value: string | null | undefined,
  locale?: string,
): string {
  if (!value) return '—';
  const isAr = isArabicLocale(locale);
  return new Intl.DateTimeFormat(isAr ? 'ar-AE' : 'en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatStatus(value: string, locale?: string): string {
  const isAr = isArabicLocale(locale);
  const normalizedKey = value.toLowerCase().replace(/\s+/g, '_');
  if (isAr && statusTranslations[normalizedKey]) {
    return statusTranslations[normalizedKey];
  }
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusIntent(
  value: string,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (['paid', 'success', 'completed', 'published', 'active'].includes(value))
    return 'success';
  if (['failed', 'cancelled', 'refunded', 'hidden', 'locked'].includes(value))
    return 'error';
  if (['pending', 'pending_payment', 'awaiting_information'].includes(value))
    return 'warning';
  if (['in_progress', 'under_review', 'ready', 'received'].includes(value))
    return 'info';
  return 'neutral';
}

export function whatsappHref(
  phone: string | null | undefined,
  message: string,
): string | null {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Returns the international digits-only format expected by wa.me links.
 *
 * New accounts store international numbers, but older Egyptian accounts may
 * still contain an 11-digit local mobile number (01x...). Keep those existing
 * customers contactable without rewriting their profile data.
 */
export function normalizeWhatsAppPhone(
  phone: string | null | undefined,
): string | null {
  const rawPhone = phone?.trim() ?? '';
  if (!rawPhone) return null;

  let digits = rawPhone.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (/^01[0125]\d{8}$/.test(digits)) {
    digits = `20${digits.slice(1)}`;
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function firstValidWhatsAppPhone(
  ...phones: Array<string | null | undefined>
): string | null {
  for (const phone of phones) {
    const normalized = normalizeWhatsAppPhone(phone);
    if (normalized) return normalized;
  }
  return null;
}

interface PaymentPresentation {
  amount: number | string;
  status: string;
  transaction_id?: string;
  payment_response?: {
    displayAmount?: number;
    testMode?: boolean;
  } | null;
}

export function isConfirmedDemoPayment(payment: PaymentPresentation): boolean {
  return (
    ['paid', 'success'].includes(payment.status) &&
    payment.transaction_id?.startsWith('demo_') === true &&
    payment.payment_response?.testMode === true
  );
}

export function getPaymentDisplayAmount(
  payment: PaymentPresentation,
  fallbackAmount: number | string,
): number {
  if (isConfirmedDemoPayment(payment)) {
    const displayAmount = Number(payment.payment_response?.displayAmount);
    if (Number.isFinite(displayAmount) && displayAmount > 0) {
      return displayAmount;
    }
    return Number(fallbackAmount);
  }

  return Number(payment.amount);
}
