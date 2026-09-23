import { useCopy } from '@/lib/i18n/use-copy';
import type { SecondaryExchangeRates } from '@/lib/packages/exchange-rates';

export function SecondaryPrices({
  amount,
  currency = 'AED',
  rates,
  onDark = false,
}: {
  amount: number;
  currency?: string;
  rates: SecondaryExchangeRates | null;
  onDark?: boolean;
}) {
  const _copy = useCopy();
  if (!rates || currency !== 'AED' || !Number.isFinite(amount)) return null;

  return (
    <p
      className={`mt-2 text-xs leading-5 ${onDark ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}
      title={_copy(
        `Reference exchange rates from ${rates.date}`,
        `أسعار صرف استرشادية بتاريخ ${rates.date}`,
      )}
    >
      <span dir="ltr" className="inline-block whitespace-nowrap">
        {_copy.money(amount * rates.EGP, 'EGP')}
      </span>
    </p>
  );
}
