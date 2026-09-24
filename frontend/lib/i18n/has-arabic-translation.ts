const arabicCharacter = /[\u0600-\u06ff]/gu;
const latinCharacter = /[A-Za-z]/g;

/**
 * CMS records can have an Arabic field that is empty or has Arabic headings
 * with English body copy. Only use it as an Arabic translation when its
 * readable text is predominantly Arabic.
 */
export function hasArabicTranslation(
  value: string | null | undefined,
): value is string {
  if (typeof value !== 'string') return false;

  const readableText = value.replace(/<[^>]*>/g, '');
  const arabicCount = readableText.match(arabicCharacter)?.length ?? 0;
  const latinCount = readableText.match(latinCharacter)?.length ?? 0;

  return arabicCount > 0 && arabicCount >= latinCount;
}
