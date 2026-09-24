import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

import { translateDocumentCopy } from './document-copy';

type Locale = 'ar' | 'en';

const skippedElementTypes = new Set([
  'code',
  'noscript',
  'pre',
  'script',
  'style',
  'textarea',
]);
const translatedAttributes = ['alt', 'aria-label', 'placeholder', 'title'];

/**
 * Localizes Server Component output before React reconciles it.
 *
 * The server refresh that follows a locale switch is authoritative, but it can
 * take a network round trip. Transforming the existing React tree keeps that
 * short optimistic state in the requested language without mutating React's
 * managed DOM nodes.
 */
export function localizeReactCopy(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === 'string') return translateDocumentCopy(node, locale);

  if (Array.isArray(node)) {
    let changed = false;
    const localized = node.map((child) => {
      const nextChild = localizeReactCopy(child, locale);
      changed ||= nextChild !== child;
      return nextChild;
    });
    return changed ? localized : node;
  }

  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const elementType =
    typeof element.type === 'string' ? element.type.toLowerCase() : null;
  const props = element.props;

  if (
    (elementType !== null && skippedElementTypes.has(elementType)) ||
    props.contentEditable === true ||
    props.contentEditable === 'true'
  ) {
    return element;
  }

  let changed = false;
  const localizedProps: Record<string, unknown> = {};

  if ('children' in props) {
    const children = props.children as ReactNode;
    const localizedChildren = localizeReactCopy(children, locale);
    if (localizedChildren !== children) {
      localizedProps.children = localizedChildren;
      changed = true;
    }
  }

  for (const attribute of translatedAttributes) {
    const value = props[attribute];
    if (typeof value !== 'string') continue;

    const localizedValue = translateDocumentCopy(value, locale);
    if (localizedValue !== value) {
      localizedProps[attribute] = localizedValue;
      changed = true;
    }
  }

  return changed ? cloneElement(element, localizedProps) : element;
}
