const arabicCharacter = /[\u0600-\u06ff]/u;

/**
 * CMS records can have an Arabic field that is empty or accidentally filled
 * with English. Only use it as an Arabic translation when it contains Arabic.
 */
export function hasArabicTranslation(
  value: string | null | undefined,
): value is string {
  return typeof value === 'string' && arabicCharacter.test(value);
}
