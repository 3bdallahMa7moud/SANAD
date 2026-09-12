import { describe, expect, it } from 'vitest';

import { localizeDocumentCopy, translateDocumentCopy } from './document-copy';

describe('instant document copy localization', () => {
  it('translates rendered interface copy in both directions', () => {
    expect(translateDocumentCopy('Home', 'ar')).toBe('الرئيسية');
    expect(translateDocumentCopy('الرئيسية', 'en')).toBe('Home');
  });

  it('preserves surrounding whitespace and interpolated values', () => {
    expect(
      translateDocumentCopy('  © 2026 SANAD. All rights reserved.\n', 'ar'),
    ).toBe('  © 2026 سند. جميع الحقوق محفوظة.\n');
  });

  it('updates text and accessible attributes without changing editable copy', () => {
    document.body.innerHTML = `
      <main>
        <h1>Choose your next career step.</h1>
        <img alt="SANAD home" />
        <textarea>Home</textarea>
      </main>
    `;

    localizeDocumentCopy(document.body, 'ar');

    expect(document.querySelector('h1')).toHaveTextContent(
      'اختر خطوتك المهنية التالية.',
    );
    expect(document.querySelector('img')).toHaveAttribute(
      'alt',
      'الصفحة الرئيسية لسند',
    );
    expect(document.querySelector('textarea')).toHaveValue('Home');
  });
});
