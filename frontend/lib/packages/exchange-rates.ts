export interface SecondaryExchangeRates {
  date: string;
  EGP: number;
  USD: number;
}

/** Reference rates only. The order total and payment remain in AED. */
export async function getSecondaryExchangeRates(): Promise<SecondaryExchangeRates | null> {
  try {
    const response = await fetch(
      'https://api.frankfurter.dev/v2/rates?base=AED&quotes=EGP,USD',
      {
        next: { revalidate: 60 * 60 * 12 },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) return null;

    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return null;
    const egp = rows.find((row) => row?.quote === 'EGP');
    const usd = rows.find((row) => row?.quote === 'USD');
    if (
      egp?.base !== 'AED' ||
      usd?.base !== 'AED' ||
      typeof egp.rate !== 'number' ||
      typeof usd.rate !== 'number' ||
      !Number.isFinite(egp.rate) ||
      !Number.isFinite(usd.rate) ||
      egp.rate <= 0 ||
      usd.rate <= 0 ||
      typeof egp.date !== 'string' ||
      typeof usd.date !== 'string'
    ) {
      return null;
    }

    for (const date of [egp.date, usd.date]) {
      const rateDate = Date.parse(`${date}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(rateDate) ||
        Math.abs(Date.now() - rateDate) > 7 * 86400000
      ) {
        return null;
      }
    }

    return {
      date: egp.date < usd.date ? egp.date : usd.date,
      EGP: egp.rate,
      USD: usd.rate,
    };
  } catch {
    return null;
  }
}
