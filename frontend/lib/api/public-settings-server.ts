import 'server-only';

import { cache } from 'react';

import { settingsApi, type PublicSettings } from './index';

const INITIAL_SETTINGS_TIMEOUT_MS = 5_000;

/**
 * Supplies the first public render with the same settings the browser will use.
 * A short timeout keeps an unavailable API from delaying every public page;
 * callers render no configurable promotion/contact links until the client can
 * retrieve them rather than flashing stale hard-coded values.
 */
export const getInitialPublicSettings = cache(
  async (): Promise<PublicSettings | null> => {
    try {
      return await settingsApi.getPublic({
        timeout: INITIAL_SETTINGS_TIMEOUT_MS,
      });
    } catch {
      return null;
    }
  },
);
