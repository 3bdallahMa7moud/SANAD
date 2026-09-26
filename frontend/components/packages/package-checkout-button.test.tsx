import { cleanup, render, screen, waitFor } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CareerPackage, CheckoutPricing } from '@/types/domain';

import { PackageCheckoutButton } from './package-checkout-button';

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  openAuthModal: vi.fn(),
  push: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/packages/professional-cv-4',
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/components/auth/auth-modal', () => ({
  useAuthModal: () => mocks.openAuthModal,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('@/lib/api', () => ({
  isApiError: () => false,
  ordersApi: { create: mocks.createOrder },
}));

const packageItem: CareerPackage = {
  id: 4,
  name: 'Professional CV',
  description: 'Professional CV service',
  price: 400,
  features: [],
  deliveryDays: 5,
  sortOrder: 4,
  images: [],
  offers: [],
  buyerCount: 0,
  ratingAverage: null,
  ratingCount: 0,
};

const pricing: CheckoutPricing = {
  packageId: 4,
  packageName: 'Professional CV',
  deliveryDays: 5,
  originalPrice: 500,
  secondaryPackageId: null,
  secondaryPackageName: null,
  secondaryOriginalPrice: 0,
  secondaryDiscountAmount: 0,
  offerId: 9,
  offerDiscountPercentage: 20,
  offerDiscountAmount: 100,
  couponCode: null,
  couponDiscountAmount: 0,
  subtotalAfterDiscounts: 400,
  totalAmount: 400,
  finalAmount: 400,
  currency: 'AED',
};

describe('PackageCheckoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { phone: '+971501234567' },
    });
  });

  afterEach(cleanup);

  it('creates the manual order and opens its payment page directly', async () => {
    mocks.createOrder.mockResolvedValue({
      id: 19,
      orderNumber: 'SANAD-2026-0019',
      finalAmount: 400,
    });
    const user = userEvent.setup();

    render(
      <PackageCheckoutButton
        checkoutHref="/checkout/professional-cv-4"
        checkoutMode="manual"
        label="Order this service now"
        labelAr="اطلب الخدمة الآن"
        packageItem={packageItem}
        pricing={pricing}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /Order this service now/i }),
    );

    expect(mocks.createOrder).toHaveBeenCalledWith({
      packageId: 4,
      offerId: 9,
      couponCode: undefined,
      customerPhone: '+971501234567',
    });
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith(
        '/checkout/pay?amount=400.00&orderId=SANAD-2026-0019&txn=preview-19',
      );
    });
  });

  it('requests sign-in before creating an order for an anonymous visitor', async () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    const user = userEvent.setup();

    render(
      <PackageCheckoutButton
        checkoutHref="/checkout/professional-cv-4"
        checkoutMode="manual"
        label="Order this service now"
        labelAr="اطلب الخدمة الآن"
        packageItem={packageItem}
        pricing={pricing}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /Order this service now/i }),
    );

    expect(mocks.openAuthModal).toHaveBeenCalledWith(
      '/packages/professional-cv-4',
    );
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
