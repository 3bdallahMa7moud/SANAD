export interface SecondaryExchangeRates {
  date: string;
  EGP: number;
}

/** Reference rates only. The order total and payment remain in AED. */
export async function getSecondaryExchangeRates(): Promise<SecondaryExchangeRates | null> {
  try {
    const response = await fetch(
      'https://api.frankfurter.dev/v2/rates?base=AED&quotes=EGP',
      {
        next: { revalidate: 60 * 60 * 12 },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) return null;

    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return null;
    const egp = rows.find((row) => row?.quote === 'EGP');
    if (
      egp?.base !== 'AED' ||
      typeof egp.rate !== 'number' ||
      !Number.isFinite(egp.rate) ||
      egp.rate <= 0 ||
      typeof egp.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(egp.date)
    ) {
      return null;
    }

    const rateDate = Date.parse(`${egp.date}T00:00:00Z`);
    if (
      !Number.isFinite(rateDate) ||
      Math.abs(Date.now() - rateDate) > 7 * 86400000
    ) {
      return null;
    }

    return {
      date: egp.date,
      EGP: egp.rate,
    };
  } catch {
    return null;
  }
}
