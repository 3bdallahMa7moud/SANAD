import { getApiBaseUrl } from '@/lib/env/public-env';

/**
 * Resolves signed local-storage URLs against the API origin. The API returns
 * `/api/v1/storage/local?...` for local files, which a browser would otherwise
 * incorrectly request from the web application's origin.
 */
export function resolveMediaUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith('/images/')) return value;
  if (!value.startsWith('/')) return null;

  return new URL(value, getApiBaseUrl()).toString();
}
