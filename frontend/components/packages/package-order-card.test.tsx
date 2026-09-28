import { render, screen, waitFor } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CareerPackage, CheckoutPricing } from '@/types/domain';

import { PackageOrderCard } from './package-order-card';

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  createPayment: vi.fn(),
  openAuthModal: vi.fn(),
  preview: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/packages/professional-cv-4',
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/components/auth/auth-modal', () => ({
  useAuthModal: () => mocks.openAuthModal,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { phone: '+971501234567' },
  }),
}));

vi.mock('@/lib/api', () => ({
  checkoutApi: { preview: mocks.preview },
  isApiError: () => false,
  ordersApi: { create: mocks.createOrder },
  paymentsApi: { create: mocks.createPayment },
}));

const packageItem: CareerPackage = {
  id: 4,
  name: 'Professional CV',
  nameAr: 'السيرة الذاتية الاحترافية',
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

describe('PackageOrderCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves an applied coupon and opens Visa payment without the review page', async () => {
    mocks.preview.mockResolvedValue({
      ...pricing,
      couponCode: 'SAVE10',
      couponDiscountAmount: 40,
      totalAmount: 360,
      finalAmount: 360,
    });
    mocks.createOrder.mockResolvedValue({
      id: 21,
      orderNumber: 'SANAD-2026-0021',
      finalAmount: 360,
    });
    mocks.createPayment.mockResolvedValue({
      paymentUrl:
        'http://localhost:3000/checkout/pay?amount=360.00&orderId=SANAD-2026-0021&txn=demo_21',
      status: 'pending',
    });
    const user = userEvent.setup();

    render(
      <PackageOrderCard
        checkoutHref="/checkout/professional-cv-4"
        checkoutMode="demo"
        packageItem={packageItem}
        pricing={pricing}
      />,
    );

    await user.type(screen.getByLabelText('Coupon code'), 'SAVE10');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText(/Coupon applied/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Complete order' }));

    await waitFor(() => {
      expect(mocks.createOrder).toHaveBeenCalledWith({
        packageId: 4,
        offerId: 9,
        couponCode: 'SAVE10',
        customerPhone: '+971501234567',
      });
      expect(mocks.createPayment).toHaveBeenCalledWith({
        orderId: 21,
        paymentMethod: 'card',
      });
      expect(mocks.push).toHaveBeenCalledWith(
        '/checkout/pay?amount=360.00&orderId=SANAD-2026-0021&txn=demo_21',
      );
    });
  });
});
