export interface SecondaryExchangeRates {
  date: string;
  EGP: number;
}

const RATE_REVALIDATE_SECONDS = 60 * 60;
const MAX_RATE_AGE_MS = 7 * 86400000;

async function fetchRatePayload(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: RATE_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(3000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function isFreshRateTimestamp(timestamp: number): boolean {
  return (
    Number.isFinite(timestamp) &&
    Math.abs(Date.now() - timestamp) <= MAX_RATE_AGE_MS
  );
}

/** Reference rates only. The order total and payment remain in AED. */
export async function getSecondaryExchangeRates(): Promise<SecondaryExchangeRates | null> {
  const livePayload = (await fetchRatePayload(
    'https://api.fxratesapi.com/latest?base=AED&currencies=EGP&resolution=1h',
  )) as {
    success?: unknown;
    base?: unknown;
    timestamp?: unknown;
    rates?: { EGP?: unknown };
  } | null;
  const liveRate = livePayload?.rates?.EGP;
  const liveTimestamp =
    typeof livePayload?.timestamp === 'number'
      ? livePayload.timestamp * 1000
      : Number.NaN;
  if (
    livePayload?.success === true &&
    livePayload.base === 'AED' &&
    typeof liveRate === 'number' &&
    Number.isFinite(liveRate) &&
    liveRate > 0 &&
    isFreshRateTimestamp(liveTimestamp)
  ) {
    return {
      date: new Date(liveTimestamp).toISOString().slice(0, 10),
      EGP: liveRate,
    };
  }

  const fallbackRows = await fetchRatePayload(
    'https://api.frankfurter.dev/v2/rates?base=AED&quotes=EGP',
  );
  if (!Array.isArray(fallbackRows)) return null;
  const egp = fallbackRows.find((row) => row?.quote === 'EGP');
  const fallbackTimestamp =
    typeof egp?.date === 'string'
      ? Date.parse(`${egp.date}T00:00:00Z`)
      : Number.NaN;
  if (
    egp?.base !== 'AED' ||
    typeof egp.rate !== 'number' ||
    !Number.isFinite(egp.rate) ||
    egp.rate <= 0 ||
    typeof egp.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(egp.date) ||
    !isFreshRateTimestamp(fallbackTimestamp)
  ) {
    return null;
  }

  return { date: egp.date, EGP: egp.rate };
}
