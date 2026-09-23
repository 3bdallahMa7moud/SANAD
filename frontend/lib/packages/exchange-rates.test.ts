import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSecondaryExchangeRates } from './exchange-rates';

afterEach(() => vi.unstubAllGlobals());

describe('secondary exchange rates', () => {
  it('returns both AED reference rates from the provider', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { date: today, base: 'AED', quote: 'EGP', rate: 13.5 },
      ],
    }));

    await expect(getSecondaryExchangeRates()).resolves.toEqual({
      date: today,
      EGP: 13.5,
    });
  });

  it('hides estimates when either rate is unavailable or stale', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { date: '2020-01-01', base: 'AED', quote: 'EGP', rate: 13.5 },
      ],
    }));
    await expect(getSecondaryExchangeRates()).resolves.toBeNull();
  });
});
