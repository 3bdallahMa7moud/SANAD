'use client';

import * as React from 'react';
import Script from 'next/script';

import type { CustomerAuthFlow } from '@/types/domain';
import { useCopy } from '@/lib/i18n/use-copy';
import { Button } from '@/components/ui/button';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback(response: GoogleCredentialResponse): void;
        ux_mode?: 'popup';
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          locale: 'ar' | 'en';
          logo_alignment: 'left';
          shape: 'rectangular';
          size: 'large';
          text: 'signin_with' | 'signup_with';
          theme: 'outline';
          type: 'standard';
          width: number;
        },
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

interface GoogleAuthButtonProps {
  flow: CustomerAuthFlow;
  loading?: boolean;
  onCredential(credential: string): void;
  onError(message: string): void;
}

export function GoogleAuthButton({
  flow,
  loading = false,
  onCredential,
  onError,
}: GoogleAuthButtonProps) {
  const _copy = useCopy();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const callbackRef = React.useRef(onCredential);
  const errorRef = React.useRef(onError);
  const initializedRef = React.useRef(false);
  const renderedWidthRef = React.useRef(0);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  React.useEffect(() => {
    callbackRef.current = onCredential;
    errorRef.current = onError;
  }, [onCredential, onError]);

  const renderGoogleButton = React.useCallback(() => {
    if (!clientId || !containerRef.current || !window.google) return;

    const width = Math.min(
      400,
      Math.max(240, Math.floor(containerRef.current.clientWidth)),
    );

    if (renderedWidthRef.current === width) return;

    renderedWidthRef.current = width;
    const renderTarget = document.createElement('div');
    renderTarget.dir = 'ltr';
    renderTarget.style.height = '44px';
    renderTarget.style.width = `${width}px`;
    containerRef.current.replaceChildren(renderTarget);
    try {
      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => {
            if (!response.credential) {
              errorRef.current(
                'Google authentication failed. Please try again.',
              );
              return;
            }
            callbackRef.current(response.credential);
          },
        });
        initializedRef.current = true;
      }
      window.google.accounts.id.renderButton(renderTarget, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        logo_alignment: 'left',
        locale: 'en',
        text: flow === 'sign_up' ? 'signup_with' : 'signin_with',
        width,
      });
    } catch {
      renderedWidthRef.current = 0;
      errorRef.current(
        'Could not initialize Google authentication. Please try again.',
      );
    }
  }, [clientId, flow]);

  React.useEffect(() => {
    renderGoogleButton();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(() => renderGoogleButton());
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [renderGoogleButton]);

  if (!clientId) {
    return (
      <Button
        className="h-11 w-full border-[var(--control-border)] bg-surface-muted"
        disabled
        type="button"
        variant="outline"
      >
        {_copy('Google authentication is not configured')}
      </Button>
    );
  }

  return (
    <div className="relative mx-auto h-11 w-full max-w-[400px] overflow-hidden rounded-md bg-white">
      <Script
        id="google-identity-services"
        onError={() =>
          errorRef.current(
            'Could not load Google authentication. Please try again.',
          )
        }
        onReady={renderGoogleButton}
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div
        aria-hidden={loading}
        className={
          loading
            ? 'pointer-events-none flex h-11 w-full items-center justify-center opacity-50'
            : 'flex h-11 w-full items-center justify-center'
        }
        dir="ltr"
        ref={containerRef}
      />
      {loading ? (
        <div className="absolute inset-0 grid place-items-center rounded-md border border-[var(--control-border)] bg-white text-sm font-semibold text-[#102337]">
          {_copy('Connecting to Google...')}
        </div>
      ) : null}
    </div>
  );
}
