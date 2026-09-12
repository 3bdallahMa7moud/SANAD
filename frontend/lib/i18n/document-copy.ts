import arabic from '@/messages/interface-ar.json';

type Locale = 'ar' | 'en';

const englishToArabic: Record<string, string> = Object.assign(
  Object.create(null),
  arabic,
);
const arabicToEnglish: Record<string, string> = Object.create(null);

for (const [english, arabicValue] of Object.entries(englishToArabic)) {
  // Keep the first canonical English value when Arabic copy is shared.
  arabicToEnglish[arabicValue] ??= english;
}

interface CopyTemplate {
  expression: RegExp;
  placeholders: string[];
  translation: string;
}

function createTemplates(dictionary: Record<string, string>): CopyTemplate[] {
  return Object.entries(dictionary)
    .filter(([key]) => /\{[a-zA-Z0-9_]+\}/.test(key))
    .map(([key, translation]) => {
      const placeholders = [...key.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(
        (match) => match[1],
      );
      const pattern = key
        .split(/\{[a-zA-Z0-9_]+\}/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('(.*?)');

      return {
        expression: new RegExp(`^${pattern}$`),
        placeholders,
        translation,
      };
    });
}

const templatesByLocale: Record<Locale, CopyTemplate[]> = {
  ar: createTemplates(englishToArabic),
  en: createTemplates(arabicToEnglish),
};

const dictionariesByLocale: Record<Locale, Record<string, string>> = {
  ar: englishToArabic,
  en: arabicToEnglish,
};

/** Translates already-rendered interface copy in either direction. */
export function translateDocumentCopy(value: string, locale: Locale): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return value;

  const dictionary = dictionariesByLocale[locale];
  let translated = dictionary[normalized];

  if (translated === undefined) {
    for (const template of templatesByLocale[locale]) {
      const match = template.expression.exec(normalized);
      if (!match) continue;

      translated = template.translation.replace(
        /\{([a-zA-Z0-9_]+)\}/g,
        (_, placeholder) => {
          const text =
            match[template.placeholders.indexOf(String(placeholder)) + 1];
          return dictionary[text] ?? text;
        },
      );
      break;
    }
  }

  if (translated === undefined || translated === normalized) return value;

  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';
  return `${leadingWhitespace}${translated}${trailingWhitespace}`;
}

const skippedElements = new Set([
  'CODE',
  'NOSCRIPT',
  'PRE',
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
]);
const translatedAttributes = ['alt', 'aria-label', 'placeholder', 'title'];

/**
 * Optimistically updates copy emitted by Server Components. The subsequent
 * router refresh replaces it with authoritative server-rendered content.
 */
export function localizeDocumentCopy(root: HTMLElement, locale: Locale): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (
      !parent ||
      skippedElements.has(parent.tagName) ||
      parent.closest('[contenteditable="true"]')
    ) {
      continue;
    }
    textNodes.push(node);
  }

  for (const node of textNodes) {
    const current = node.nodeValue;
    if (current !== null)
      node.nodeValue = translateDocumentCopy(current, locale);
  }

  for (const element of root.querySelectorAll<HTMLElement>('*')) {
    if (skippedElements.has(element.tagName)) continue;

    for (const attribute of translatedAttributes) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      element.setAttribute(attribute, translateDocumentCopy(current, locale));
    }
  }
}
