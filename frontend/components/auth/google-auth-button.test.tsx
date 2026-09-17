import { render, waitFor } from '@/test/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleAuthButton } from './google-auth-button';

vi.mock('next/script', () => ({
  default: () => null,
}));

describe('GoogleAuthButton', () => {
  const initialize = vi.fn();
  const renderButton = vi.fn((parent: HTMLElement) => {
    parent.append(document.createElement('iframe'));
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID =
      '123456789-example.apps.googleusercontent.com';
    initialize.mockReset();
    renderButton.mockReset();
    renderButton.mockImplementation((parent: HTMLElement) => {
      parent.append(document.createElement('iframe'));
    });
    document.documentElement.dataset.theme = 'light';
    window.google = { accounts: { id: { initialize, renderButton } } };
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('initializes Google once and forwards the returned credential', () => {
    const onCredential = vi.fn();

    render(
      <GoogleAuthButton
        flow="sign_in"
        onCredential={onCredential}
        onError={vi.fn()}
      />,
    );

    expect(initialize).toHaveBeenCalledOnce();
    expect(renderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        locale: 'en',
        logo_alignment: 'left',
        shape: 'rectangular',
        text: 'signin_with',
        theme: 'outline',
        width: 360,
      }),
    );
    expect((renderButton.mock.calls[0][0] as HTMLElement).dir).toBe('ltr');
    const callback = initialize.mock.calls[0][0].callback;
    callback({ credential: 'google-id-token' });
    expect(onCredential).toHaveBeenCalledWith('google-id-token');
  });

  it('keeps one white Google button when the site theme changes', () => {
    render(
      <GoogleAuthButton
        flow="sign_in"
        onCredential={vi.fn()}
        onError={vi.fn()}
      />,
    );

    document.documentElement.dataset.theme = 'dark';
    window.dispatchEvent(new Event('sanad-theme-change'));

    expect(renderButton).toHaveBeenCalledOnce();
    expect(renderButton).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ theme: 'outline' }),
    );
  });

  it('uses the same field-shaped Google design for sign-up', () => {
    render(
      <GoogleAuthButton
        flow="sign_up"
        onCredential={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(initialize).toHaveBeenCalledOnce();
    expect(renderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        locale: 'en',
        shape: 'rectangular',
        text: 'signin_with',
      }),
    );
  });

  it('does not queue a duplicate button while Google is still rendering', async () => {
    let notifyResize: () => void = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          notifyResize = () => callback([], this as unknown as ResizeObserver);
        }

        disconnect() {}
        observe() {}
        unobserve() {}
      },
    );
    renderButton.mockImplementation((parent: HTMLElement) => {
      queueMicrotask(() => parent.append(document.createElement('iframe')));
    });

    const { container } = render(
      <GoogleAuthButton
        flow="sign_in"
        onCredential={vi.fn()}
        onError={vi.fn()}
      />,
    );

    notifyResize();

    await waitFor(() => {
      expect(renderButton).toHaveBeenCalledOnce();
      expect(container.querySelectorAll('iframe')).toHaveLength(1);
    });
  });

  it('shows initialization failures through the form error callback', () => {
    const onError = vi.fn();
    renderButton.mockImplementation(() => {
      throw new Error('Google iframe failed');
    });

    render(
      <GoogleAuthButton
        flow="sign_in"
        onCredential={vi.fn()}
        onError={onError}
      />,
    );

    expect(onError).toHaveBeenCalledWith(
      'Could not initialize Google authentication. Please try again.',
    );
  });
});
