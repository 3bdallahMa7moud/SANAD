import { render, screen, waitFor } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SecurePaymentPage } from './secure-payment-page';

const { confirmDemo, replace } = vi.hoisted(() => ({
  confirmDemo: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), replace }),
}));

vi.mock('@/lib/api', () => ({
  isApiError: () => false,
  paymentsApi: { confirmDemo },
}));

describe('SecurePaymentPage', () => {
  it('confirms the test card and shows payment success', async () => {
    const user = userEvent.setup();
    confirmDemo.mockResolvedValue({
      status: 'paid',
      redirectUrl: '/my-orders?payment=success',
    });

    render(
      <SecurePaymentPage
        amount={719.1}
        orderId="123"
        transactionId="demo_123"
      />,
    );

    expect(screen.getByText('#123')).toBeVisible();
    expect(screen.getByText('demo_123')).toBeVisible();
    expect(screen.getByTestId('card-payment')).toBeVisible();
    expect(screen.getByLabelText('Card number')).toHaveValue(
      '4242 4242 4242 4242',
    );
    expect(screen.getByLabelText('Card number')).toHaveClass('pr-24');

    await user.click(screen.getByRole('button', { name: /Pay AED.*719/i }));

    await waitFor(() =>
      expect(confirmDemo).toHaveBeenCalledWith({
        transactionId: 'demo_123',
        cardNumber: '4242 4242 4242 4242',
        expiry: '12/30',
        cvc: '123',
        cardholderName: 'SANAD TEST',
      }),
    );
    expect(screen.getByText('Payment successful')).toBeVisible();
  });
});
