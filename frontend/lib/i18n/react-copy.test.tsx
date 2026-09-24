import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { localizeReactCopy } from './react-copy';

describe('React tree localization', () => {
  it('localizes nested copy and accessible attributes declaratively', () => {
    render(
      localizeReactCopy(
        <main>
          <h1>Choose your next career step.</h1>
          {/* eslint-disable-next-line @next/next/no-img-element -- verifies raw alt localization */}
          <img alt="SANAD home" />
        </main>,
        'ar',
      ),
    );

    expect(screen.getByRole('heading')).toHaveTextContent(
      'اختر خطوتك المهنية التالية.',
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'alt',
      'الصفحة الرئيسية لسند',
    );
  });

  it('preserves editable and code content', () => {
    render(
      localizeReactCopy(
        <main>
          <div contentEditable suppressContentEditableWarning>
            Home
          </div>
          <code>Home</code>
          <textarea defaultValue="Home" />
        </main>,
        'ar',
      ),
    );

    expect(screen.getByText('Home', { selector: 'div' })).toBeVisible();
    expect(screen.getByText('Home', { selector: 'code' })).toBeVisible();
    expect(screen.getByRole('textbox')).toHaveValue('Home');
  });

  it('preserves keyed element identity while copy changes', () => {
    const tree = [
      <section key="career-profile">
        <h2>Build a Career Profile</h2>
      </section>,
    ];
    const view = render(localizeReactCopy(tree, 'en'));
    const originalHeading = view.container.querySelector('h2');
    expect(originalHeading).not.toBeNull();

    view.rerender(localizeReactCopy(tree, 'ar'));

    expect(view.container.querySelector('h2')).toBe(originalHeading);
    expect(originalHeading).toHaveTextContent('ابنِ ملفاً مهنياً');
  });
});
