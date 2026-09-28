import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSecondaryExchangeRates } from './exchange-rates';

afterEach(() => vi.unstubAllGlobals());

describe('secondary exchange rates', () => {
  it('returns the current intraday AED to EGP rate', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const today = new Date(timestamp * 1000).toISOString().slice(0, 10);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          base: 'AED',
          timestamp,
          rates: { EGP: 14.19 },
        }),
      }),
    );

    await expect(getSecondaryExchangeRates()).resolves.toEqual({
      date: today,
      EGP: 14.19,
    });
  });

  it('falls back to the daily reference rate when the intraday source fails', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { date: today, base: 'AED', quote: 'EGP', rate: 14.1 },
          ],
        }),
    );

    await expect(getSecondaryExchangeRates()).resolves.toEqual({
      date: today,
      EGP: 14.1,
    });
  });

  it('hides estimates when both available rates are stale', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            base: 'AED',
            timestamp: Date.parse('2020-01-01T00:00:00Z') / 1000,
            rates: { EGP: 13.5 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { date: '2020-01-01', base: 'AED', quote: 'EGP', rate: 13.5 },
          ],
        }),
    );
    await expect(getSecondaryExchangeRates()).resolves.toBeNull();
  });
});
