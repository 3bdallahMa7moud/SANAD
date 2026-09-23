import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useLocale } from 'next-intl';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { MotionHeading } from '@/components/motion/motion-reveal';
import {
  LocaleProvider,
  useLocaleSwitcher,
  type AppLocale,
} from '@/components/providers/locale-provider';
import arabicMessages from '@/messages/ar.json';
import englishMessages from '@/messages/en.json';

const mocks = vi.hoisted(() => ({ persistLocale: vi.fn() }));

vi.mock('@/app/actions/locale', () => ({
  persistLocale: mocks.persistLocale,
}));

const sections = [
  {
    id: 'hero-heading',
    enHeading: `${englishMessages.home.hero.headline1} ${englishMessages.home.hero.headline2}`,
    arHeading: `${arabicMessages.home.hero.headline1} ${arabicMessages.home.hero.headline2}`,
    enBody: englishMessages.home.hero.body,
    arBody: arabicMessages.home.hero.body,
  },
  {
    id: 'featured-packages-heading',
    enHeading: englishMessages.home.featuredPackages.heading,
    arHeading: arabicMessages.home.featuredPackages.heading,
    enBody: englishMessages.home.featuredPackages.body,
    arBody: arabicMessages.home.featuredPackages.body,
  },
  {
    id: 'career-story-heading',
    enHeading: englishMessages.home.careerStory.heading,
    arHeading: arabicMessages.home.careerStory.heading,
    enBody: englishMessages.home.careerStory.body,
    arBody: arabicMessages.home.careerStory.body,
  },
  {
    id: 'why-sanad-heading',
    enHeading: englishMessages.home.whySanad.heading,
    arHeading: arabicMessages.home.whySanad.heading,
    enBody: englishMessages.home.whySanad.body,
    arBody: arabicMessages.home.whySanad.body,
  },
  {
    id: 'uae-career-focus-heading',
    enHeading: englishMessages.home.uaeCareerFocus.heading,
    arHeading: arabicMessages.home.uaeCareerFocus.heading,
    enBody: englishMessages.home.uaeCareerFocus.body,
    arBody: arabicMessages.home.uaeCareerFocus.body,
  },
  {
    id: 'how-it-works-heading',
    enHeading: englishMessages.home.howItWorks.heading,
    arHeading: arabicMessages.home.howItWorks.heading,
    enBody: englishMessages.home.howItWorks.body,
    arBody: arabicMessages.home.howItWorks.body,
  },
  {
    id: 'premium-cta-heading',
    enHeading: englishMessages.home.premiumCta.heading,
    arHeading: arabicMessages.home.premiumCta.heading,
    enBody: englishMessages.home.premiumCta.body,
    arBody: arabicMessages.home.premiumCta.body,
  },
  {
    id: 'final-cta-heading',
    enHeading: englishMessages.home.finalCta.heading,
    arHeading: arabicMessages.home.finalCta.heading,
    enBody: englishMessages.home.finalCta.body,
    arBody: arabicMessages.home.finalCta.body,
  },
] as const;

function LocaleControl() {
  const locale = useLocale() as AppLocale;
  const { setLocale } = useLocaleSwitcher();

  return (
    <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
      switch
    </button>
  );
}

function home(locale: AppLocale) {
  return (
    <LocaleProvider
      initialLocale={locale}
      messagesByLocale={{ ar: arabicMessages, en: englishMessages }}
    >
      <LocaleControl />
      {sections.map((section) => {
        const heading = locale === 'ar' ? section.arHeading : section.enHeading;
        const lines =
          section.id === 'hero-heading'
            ? locale === 'ar'
              ? [
                  arabicMessages.home.hero.headline1,
                  arabicMessages.home.hero.headline2,
                ]
              : [
                  englishMessages.home.hero.headline1,
                  englishMessages.home.hero.headline2,
                ]
            : [heading];

        return (
          <section key={section.id}>
            <MotionHeading id={section.id} lines={lines} text={heading} />
            <p>{locale === 'ar' ? section.arBody : section.enBody}</p>
          </section>
        );
      })}
    </LocaleProvider>
  );
}

function headingText(id: string) {
  return document.getElementById(id)?.getAttribute('aria-label');
}

describe('home locale switching', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    document.documentElement.lang = '';
    document.documentElement.dir = '';
    mocks.persistLocale.mockReset();
  });

  it('keeps every section coherent while waiting for the server locale and preserves animated heading nodes', async () => {
    let finishLocaleUpdate: (() => void) | undefined;
    mocks.persistLocale.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishLocaleUpdate = resolve;
        }),
    );
    const view = render(home('en'));
    const originalHeadings = sections.map(({ enHeading, id }) => {
      const heading = document.getElementById(id);
      expect(headingText(id)).toBe(enHeading);
      return heading;
    });
    const originalHeadingLines = sections.map(({ id }) =>
      document.querySelector(`#${id} > span`),
    );

    fireEvent.click(screen.getByRole('button', { name: 'switch' }));

    await waitFor(() => expect(mocks.persistLocale).toHaveBeenCalledWith('ar'));

    // No section should switch independently while the Server Action/RSC
    // response is pending; that is what previously caused mixed languages.
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    sections.forEach(({ enBody, enHeading, id }, index) => {
      expect(document.getElementById(id)).toBe(originalHeadings[index]);
      expect(document.querySelector(`#${id} > span`)).toBe(
        originalHeadingLines[index],
      );
      expect(headingText(id)).toBe(enHeading);
      expect(screen.getByText(enBody)).toBeInTheDocument();
    });

    // Simulate the authoritative Arabic Server Component payload arriving.
    // Stable keys must keep Framer Motion from remounting a hidden line.
    view.rerender(home('ar'));

    sections.forEach(({ arHeading, id }, index) => {
      expect(document.getElementById(id)).toBe(originalHeadings[index]);
      expect(document.querySelector(`#${id} > span`)).toBe(
        originalHeadingLines[index],
      );
      expect(headingText(id)).toBe(arHeading);
    });

    await act(async () => finishLocaleUpdate?.());
  });
});
