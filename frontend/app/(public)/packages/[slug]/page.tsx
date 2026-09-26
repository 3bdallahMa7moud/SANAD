import { getLocalizedMetadata } from '@/lib/i18n/metadata';

import { getCopy } from '@/lib/i18n/server-copy';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { PackageGallery } from '@/components/packages/package-gallery';
import { SecondaryPrices } from '@/components/packages/secondary-prices';
import { getSecondaryExchangeRates } from '@/lib/packages/exchange-rates';
import { PackageFeedbackUnavailable } from '@/components/packages/package-feedback-unavailable';
import { StarRating } from '@/components/feedback/star-rating';
import { getScopeQuestions } from '@/lib/packages/scope-questions';
import { whatsappHref } from '@/lib/orders/presentation';
import { VerifiedReviewCard } from '@/components/feedback/verified-review-card';
import { FeedbackSummary } from '@/components/feedback/feedback-summary';
import {
  getOrderDisplayPrice,
  PackageOrderCard,
} from '@/components/packages/package-order-card';
import { PackageOfferFlag } from '@/components/packages/package-offer-visual';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  checkoutApi,
  isApiError,
  packagesApi,
  reviewsApi,
  settingsApi,
} from '@/lib/api';
import { getPackageDetailContent } from '@/lib/packages/detail-content';
import {
  getBestPackageOffer,
  getPackageCurrentPrice,
  getPackageDiscountAmount,
  getPackageFeaturePairs,
  getPackageHref,
  getPackageOriginalPrice,
  getPackageIdFromSlug,
  getPackagePrimaryImage,
  getPackageSlug,
  formatDeliveryEstimate,
} from '@/lib/packages/presentation';
import type { CareerPackage, CheckoutPricing } from '@/types/domain';
import { getCheckoutMode } from '@/lib/env/public-env';

export const dynamic = 'force-dynamic';

interface PackageDetailPageProps {
  params: Promise<{ slug: string }>;
}

const getPackage = cache((id: number) => packagesApi.getById(id));
const getPricing = cache((packageId: number, offerId?: number) =>
  checkoutApi.preview({ packageId, offerId }),
);
const getFeedback = cache((packageId: number) =>
  reviewsApi.listPublic({ packageId, limit: 100 }),
);

async function resolvePackage(slug: string): Promise<CareerPackage> {
  const id = getPackageIdFromSlug(slug);
  if (id === null) notFound();

  try {
    return await getPackage(id);
  } catch (error) {
    if (isApiError(error) && error.kind === 'not-found') notFound();
    throw error;
  }
}

function toAbsoluteUrl(value: string): string | null {
  if (/^https?:\/\//i.test(value)) return value;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;

  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return null;
  }
}

async function getOptionalPageData(packageItem: CareerPackage): Promise<{
  feedback: Awaited<ReturnType<typeof reviewsApi.listPublic>> | null;
  pricing: CheckoutPricing | null;
  contactNumber: string | null;
}> {
  const bestOffer = getBestPackageOffer(packageItem);
  const [pricingResult, feedbackResult, settingsResult] =
    await Promise.allSettled([
      getPricing(packageItem.id, bestOffer?.id),
      getFeedback(packageItem.id),
      settingsApi.getPublic(),
    ]);

  return {
    feedback:
      feedbackResult.status === 'fulfilled' ? feedbackResult.value : null,
    pricing: pricingResult.status === 'fulfilled' ? pricingResult.value : null,
    contactNumber:
      settingsResult.status === 'fulfilled'
        ? (settingsResult.value.whatsapp_number ?? null)
        : null,
  };
}

export async function generateMetadata({
  params,
}: PackageDetailPageProps): Promise<Metadata> {
  const _copy = await getCopy();
  const { slug } = await params;
  const id = getPackageIdFromSlug(slug);

  if (id === null) notFound();

  let packageItem: CareerPackage;
  try {
    packageItem = await getPackage(id);
  } catch (error) {
    if (isApiError(error) && error.kind === 'not-found') notFound();
    return await getLocalizedMetadata({
      title: _copy('Career Service | SANAD', 'خدمة مهنية | سند'),
    });
  }

  if (slug !== getPackageSlug(packageItem)) {
    redirect(getPackageHref(packageItem));
  }

  const localizedName = _copy(packageItem.name, packageItem.nameAr);
  const description =
    _copy(packageItem.description, packageItem.descriptionAr) ??
    _copy(
      `Review the scope, pricing, and delivery estimate for ${packageItem.name}.`,
      `تعرف على نطاق العمل والأسعار والمدة التقديرية في ${localizedName}.`,
    );
  const packageHref = getPackageHref(packageItem);
  const canonicalUrl = toAbsoluteUrl(packageHref) ?? packageHref;
  const primaryImage = getPackagePrimaryImage(packageItem);
  const imageUrl = primaryImage?.url ? toAbsoluteUrl(primaryImage.url) : null;

  return await getLocalizedMetadata({
    title: `${localizedName} | ${_copy('SANAD Career Services', 'سند للخدمات المهنية')}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      title: `${localizedName} | ${_copy('SANAD', 'سند')}`,
      description,
      url: canonicalUrl,
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt:
                  primaryImage?.altText ??
                  `${localizedName} ${_copy('service preview', 'معاينة الخدمة')}`,
              },
            ],
          }
        : {}),
    },
  });
}

export default async function PackageDetailPage({
  params,
}: PackageDetailPageProps) {
  const _copy = await getCopy();

  const { slug } = await params;
  const packageItem = await resolvePackage(slug);

  if (slug !== getPackageSlug(packageItem)) {
    redirect(getPackageHref(packageItem));
  }

  const [{ feedback, pricing, contactNumber }, rates] = await Promise.all([
    getOptionalPageData(packageItem),
    getSecondaryExchangeRates(),
  ]);
  const feedbackItems = feedback?.items ?? [];
  const feedbackRating = feedback?.summary.averageRating ?? 0;
  const content = getPackageDetailContent(packageItem);
  const featurePairs = getPackageFeaturePairs(packageItem);
  const scopeQuestions = getScopeQuestions(packageItem);
  const contactHref = whatsappHref(
    contactNumber,
    `Hello, I would like to confirm the scope and delivery timing for ${packageItem.name} before ordering.`,
  );
  const bestOffer = getBestPackageOffer(packageItem);
  const displayPrice = getOrderDisplayPrice(packageItem, pricing, _copy.locale);
  const fallbackCurrentPrice = getPackageCurrentPrice(packageItem);
  const fallbackOriginalPrice = getPackageOriginalPrice(packageItem);
  const fallbackDiscountAmount = getPackageDiscountAmount(packageItem);
  const hasRating =
    packageItem.ratingAverage !== null && packageItem.ratingCount > 0;
  const checkoutHref = `/checkout/${getPackageSlug(packageItem)}`;
  const packageHref = getPackageHref(packageItem);
  const canonicalUrl = toAbsoluteUrl(packageHref) ?? packageHref;
  const primaryImage = getPackagePrimaryImage(packageItem);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: packageItem.name,
    description:
      packageItem.description ??
      `Professional career support from SANAD: ${packageItem.name}.`,
    image: primaryImage?.url
      ? (toAbsoluteUrl(primaryImage.url) ?? undefined)
      : undefined,
    provider: {
      '@type': 'Organization',
      name: 'SANAD',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: pricing?.currency ?? 'AED',
      price: Math.round(
        pricing?.finalAmount ?? getPackageCurrentPrice(packageItem),
      ),
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="package-detail-page pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />

      <section className="relative overflow-hidden border-b border-primary-foreground/10 bg-primary text-primary-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 size-[34rem] translate-x-1/3 -translate-y-1/2 rounded-full border border-primary-foreground/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] bottom-[-12rem] size-[30rem] rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 left-[3%] size-80 rounded-full bg-accent/5 blur-3xl"
        />

        <div className="layout-container-wide relative py-6 sm:py-8 lg:py-10 xl:py-12">
          <nav
            aria-label={_copy('Breadcrumb', 'مسار التنقل')}
            className="sanad-detail-enter mb-6"
          >
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-primary-foreground/70">
              <li>
                <Link
                  className="transition-colors hover:text-primary-foreground"
                  href="/"
                >
                  {_copy('Home')}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-4 rtl:rotate-180" />
              </li>
              <li>
                <Link
                  className="transition-colors hover:text-primary-foreground"
                  href="/packages"
                >
                  {_copy('Services')}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-4 rtl:rotate-180" />
              </li>
              <li
                aria-current="page"
                className="max-w-52 truncate font-semibold text-primary-foreground sm:max-w-none"
              >
                {_copy(packageItem.name, packageItem.nameAr)}
              </li>
            </ol>
          </nav>

          <div className="grid items-start gap-7 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-6 xl:gap-x-16">
            <div className="sanad-detail-enter sanad-detail-enter-delay-1 lg:col-span-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                  {_copy('Career service', 'خدمة مهنية')}
                </Badge>
                {bestOffer ? (
                  <PackageOfferFlag
                    className="min-h-8 px-2.5 py-1 text-xs shadow-none"
                    discountPercentage={bestOffer.discountPercentage}
                  />
                ) : null}
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  <CircleCheckBig aria-hidden="true" className="size-3.5" />
                  {_copy('Available to order', 'متوفر للطلب')}
                </span>
              </div>

              <h1 className="type-h1 mt-5 max-w-2xl text-primary-foreground">
                {_copy(packageItem.name, packageItem.nameAr)}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-primary-foreground/80 sm:text-lg sm:leading-8">
                {_copy(
                  packageItem.description ??
                    'A focused service for presenting your professional experience with greater clarity.',
                  packageItem.descriptionAr,
                )}
              </p>

              {hasRating ? (
                <div className="mt-5 inline-flex flex-wrap items-center gap-2 text-sm text-primary-foreground">
                  <StarRating
                    rating={packageItem.ratingAverage ?? 0}
                    size="sm"
                  />
                  <strong className="font-semibold">
                    {_copy(packageItem.ratingAverage?.toFixed(1))}
                  </strong>
                  <span className="text-primary-foreground/65">
                    ({_copy(packageItem.ratingCount)}{' '}
                    {_copy(
                      packageItem.ratingCount === 1 ? 'review' : 'reviews',
                      packageItem.ratingCount === 1 ? 'تقييم' : 'تقييمات',
                    )}
                    )
                  </span>
                </div>
              ) : null}
            </div>

            <div className="sanad-detail-enter sanad-detail-enter-delay-2 lg:col-span-6 lg:row-span-2 lg:self-center">
              <PackageGallery
                className="drop-shadow-[0_24px_48px_rgb(0_0_0_/_0.22)]"
                images={packageItem.images}
                packageName={_copy(packageItem.name, packageItem.nameAr)}
                variant="hero"
              />
            </div>

            <div className="sanad-detail-enter sanad-detail-enter-delay-2 rounded-2xl border border-primary-foreground/15 bg-linear-to-br from-primary-foreground/10 to-primary-foreground/[0.035] p-5 shadow-[0_18px_42px_rgb(0_0_0_/_0.16)] backdrop-blur-sm sm:p-6 lg:col-span-6">
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,1.15fr)] sm:items-end sm:gap-6">
                <div>
                  {pricing ? (
                    <>
                      <span className="block text-xs font-semibold tracking-wider text-primary-foreground/65 uppercase">
                        {_copy(
                          pricing.offerDiscountAmount > 0
                            ? 'Offer price'
                            : 'Total price',
                          pricing.offerDiscountAmount > 0
                            ? 'السعر بعد الخصم'
                            : 'السعر الإجمالي',
                        )}
                      </span>
                      <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                        <span className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                          {_copy(
                            _copy.money(pricing.finalAmount, pricing.currency),
                          )}
                        </span>
                        {pricing.offerDiscountAmount > 0 ? (
                          <div>
                            <span className="block text-[0.68rem] font-semibold text-primary-foreground/55">
                              {_copy('Original price', 'السعر قبل الخصم')}
                            </span>
                            <span className="block text-sm text-primary-foreground/55 line-through">
                              {_copy(
                                _copy.money(
                                  pricing.originalPrice,
                                  pricing.currency,
                                ),
                              )}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <SecondaryPrices
                        amount={pricing.finalAmount}
                        currency={pricing.currency}
                        rates={rates}
                        onDark
                      />
                      {pricing.offerDiscountAmount > 0 ? (
                        <p className="mt-1.5 text-xs font-semibold text-accent">
                          {_copy('Save', 'توفير')}{' '}
                          {_copy(
                            _copy.money(
                              pricing.offerDiscountAmount,
                              pricing.currency,
                            ),
                          )}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="block text-xs font-semibold tracking-wider text-primary-foreground/65 uppercase">
                        {_copy(
                          bestOffer && fallbackDiscountAmount > 0
                            ? 'Offer price'
                            : 'Price',
                          bestOffer && fallbackDiscountAmount > 0
                            ? 'السعر بعد الخصم'
                            : 'السعر',
                        )}
                      </span>
                      <span className="mt-1.5 block font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                        {displayPrice}
                      </span>
                      {bestOffer && fallbackDiscountAmount > 0 ? (
                        <>
                          <span className="mt-2 block text-[0.68rem] font-semibold text-primary-foreground/55">
                            {_copy('Original price', 'السعر قبل الخصم')}
                          </span>
                          <span className="block text-sm text-primary-foreground/55 line-through">
                            {_copy(_copy.money(fallbackOriginalPrice))}
                          </span>
                          <p className="mt-1.5 text-xs font-semibold text-accent">
                            {_copy('Save', 'توفير')}{' '}
                            {_copy(_copy.money(fallbackDiscountAmount))}
                          </p>
                        </>
                      ) : null}
                      <SecondaryPrices
                        amount={fallbackCurrentPrice}
                        rates={rates}
                        onDark
                      />
                    </>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-primary-foreground/10 bg-primary/20 p-3">
                    <dt className="flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.06em] text-primary-foreground/60 uppercase">
                      <Clock3
                        aria-hidden="true"
                        className="size-3.5 text-accent"
                      />
                      {_copy('Delivery', 'التسليم')}
                    </dt>
                    <dd className="mt-1.5 text-sm font-semibold text-primary-foreground">
                      {formatDeliveryEstimate(
                        packageItem.deliveryDays,
                        _copy.locale,
                      )}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-primary-foreground/10 bg-primary/20 p-3">
                    <dt className="flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.06em] text-primary-foreground/60 uppercase">
                      <MessageCircle
                        aria-hidden="true"
                        className="size-3.5 text-accent"
                      />
                      {_copy('Follow-up', 'المتابعة')}
                    </dt>
                    <dd className="mt-1.5 text-sm font-semibold text-primary-foreground">
                      {_copy('WhatsApp', 'واتساب')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="group min-h-14 bg-accent px-6 text-base font-bold text-accent-foreground shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90"
                  size="lg"
                >
                  <Link href={checkoutHref}>
                    {_copy('Order this service now', 'اطلب الخدمة الآن')}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1 rtl:rotate-180 rtl:motion-safe:group-hover:-translate-x-1"
                    />
                  </Link>
                </Button>
                {contactHref ? (
                  <Button
                    asChild
                    className="min-h-14 border-primary-foreground/25 bg-transparent text-primary-foreground hover:border-accent hover:bg-primary-foreground/10"
                    size="lg"
                    variant="outline"
                  >
                    <a
                      href={contactHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <MessageCircle aria-hidden="true" className="size-4" />
                      {_copy('Ask on WhatsApp', 'استفسر عبر واتساب')}
                    </a>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="min-h-14 border-primary-foreground/25 bg-transparent text-primary-foreground hover:border-accent hover:bg-primary-foreground/10"
                    size="lg"
                    variant="outline"
                  >
                    <a href="#included-heading">
                      {_copy('Review the service scope', 'راجع نطاق الخدمة')}
                    </a>
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-primary-foreground/10 pt-4 text-xs leading-5 text-primary-foreground/70">
                <p className="flex items-center gap-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="size-4 shrink-0 text-accent"
                  />
                  {_copy(
                    'Review the final total before confirmation',
                    'راجع الإجمالي النهائي قبل التأكيد',
                  )}
                </p>
                <a
                  className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
                  href="#included-heading"
                >
                  {_copy('See what is included', 'اعرض محتويات الخدمة')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="best-for-heading"
        className="border-b border-border bg-surface"
      >
        <div className="layout-container-wide grid gap-6 py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:items-center md:gap-10 lg:py-7">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-lg border border-accent/35 bg-accent/10 text-secondary"
            >
              <Target className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-secondary uppercase">
                {_copy('Package fit', 'مدى ملاءمة الخدمة')}
              </p>
              <h2
                className="mt-1.5 text-lg font-semibold text-primary"
                id="best-for-heading"
              >
                {_copy('Who this service is for', 'لمن تناسب هذه الخدمة؟')}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {_copy(content.bestFor, content.bestForAr)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-t border-border pt-6 md:border-t-0 md:border-s md:pt-0 md:ps-8">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
            >
              <ListChecks className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-primary">
                {_copy('Clear published scope', 'نطاق خدمة واضح')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {_copy(
                  'Review every published inclusion before you place the order.',
                  'راجع جميع المخرجات المنشورة قبل إتمام الطلب.',
                )}
              </p>
              <a
                className="mt-2 inline-flex min-h-8 items-center text-sm font-semibold text-secondary underline-offset-4 hover:underline"
                href="#included-heading"
              >
                {_copy('View the full scope', 'عرض النطاق الكامل')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label={_copy('On this service page')}
        className="border-b border-border bg-surface"
      >
        <div className="layout-container flex flex-wrap gap-x-5 gap-y-1 py-3 text-sm font-semibold text-primary">
          {[
            ['included-heading', 'What is included'],
            ['process-heading', 'How it works'],
            ['preparation-heading', 'What to prepare'],
            ['service-feedback', 'Reviews'],
            ['service-faq', 'FAQ'],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {_copy(label)}
            </a>
          ))}
        </div>
      </nav>
      <section className="bg-background" id="service-details">
        <div className="layout-container layout-section">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-16 xl:gap-20">
            <div className="min-w-0">
              <section
                aria-labelledby="included-heading"
                className="scroll-mt-24"
              >
                <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                  {_copy('Deliverables')}
                </p>
                <h2
                  className="type-h2 mt-3 text-primary"
                  id="included-heading"
                  style={{ scrollMarginTop: '6rem' }}
                >
                  {_copy('What’s Included')}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {_copy(
                    'Every item below is part of the published scope for this service.',
                  )}
                </p>

                {featurePairs.length > 0 ? (
                  <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-x-8">
                    {featurePairs.map((feature, featureIndex) => (
                      <li
                        className="flex items-start gap-3 border-b border-border/70 pb-4 text-sm leading-6 text-foreground"
                        key={`${feature.en}-${featureIndex}`}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-secondary"
                        >
                          <Check className="size-4" strokeWidth={2.2} />
                        </span>
                        <span>{_copy(feature.en, feature.ar)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-8 rounded-lg border border-border bg-surface-muted p-6">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {_copy(
                        'The detailed deliverables for this service are confirmed with SANAD before the order begins.',
                      )}
                    </p>
                  </div>
                )}
              </section>

              <section
                className="mt-10 rounded-lg border border-border bg-surface-muted p-6"
                aria-labelledby="scope-heading"
              >
                <h2
                  id="scope-heading"
                  className="text-lg font-semibold text-primary"
                >
                  {_copy('Confirm the details before ordering')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {_copy(
                    'The published scope is listed above. Ask SANAD about these details if they matter to your decision.',
                  )}
                </p>
                <Accordion
                  className="mt-4 border-t border-border"
                  collapsible
                  defaultValue="scope-0"
                  type="single"
                >
                  {scopeQuestions.map((question, index) => (
                    <AccordionItem key={question.en} value={`scope-${index}`}>
                      <AccordionTrigger className="py-4 text-sm text-primary">
                        {_copy(question.en, question.ar)}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-7">
                        {_copy(question.answerEn, question.answerAr)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {_copy(
                    'The delivery estimate uses calendar days and begins after payment is confirmed and SANAD receives the information required to start. Time waiting for required information or verification is not counted.',
                    'تُحسب مدة التسليم بالأيام التقويمية، وتبدأ بعد تأكيد الدفع واستلام سند المعلومات المطلوبة للبدء. ولا تُحتسب مدة انتظار المعلومات أو خطوات التحقق المطلوبة.',
                  )}
                </p>
                {contactHref ? (
                  <Button asChild className="mt-5" variant="outline">
                    <a
                      href={contactHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {_copy('Ask SANAD before ordering')}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="mt-5" variant="outline">
                    <Link href="#service-faq">
                      {_copy('View all service FAQs', 'عرض جميع أسئلة الخدمة')}
                    </Link>
                  </Button>
                )}
              </section>

              <section
                aria-labelledby="preparation-heading"
                className="mt-14 border-t border-border pt-14"
              >
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-muted text-primary"
                  >
                    <ListChecks className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      className="type-h3 text-primary"
                      id="preparation-heading"
                      style={{ scrollMarginTop: '6rem' }}
                    >
                      {_copy('What to prepare')}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {_copy(
                        'Having these details ready helps SANAD confirm the scope and begin efficiently.',
                      )}
                    </p>
                  </div>
                </div>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {content.preparation.map((item) => (
                    <li
                      className="flex items-start gap-3 rounded-md border border-border bg-surface p-4 text-sm leading-6"
                      key={item}
                    >
                      <CircleCheckBig
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-accent"
                      />
                      <span>{_copy(item)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="process-heading"
                className="mt-14 border-t border-border pt-14"
              >
                <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                  {_copy('Simple process')}
                </p>
                <h2 className="type-h2 mt-3 text-primary" id="process-heading">
                  {_copy('How the service works')}
                </h2>
                <ol className="mt-8 grid gap-4 md:grid-cols-3">
                  {content.process.map((step, index) => (
                    <li
                      className="relative rounded-lg border border-border bg-surface p-5 shadow-xs"
                      key={step.title}
                    >
                      <span className="font-display text-3xl text-accent/80">
                        {_copy.number(index + 1, {
                          minimumIntegerDigits: 2,
                          useGrouping: false,
                        })}
                      </span>
                      <h3 className="mt-5 font-semibold text-primary">
                        {_copy(step.title)}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {_copy(step.description)}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              <section
                aria-labelledby="service-feedback-heading"
                className="mt-14 border-t border-border pt-14 scroll-mt-24"
                id="service-feedback"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                      {_copy('Client feedback')}
                    </p>
                    <h2
                      className="type-h2 mt-3 text-primary"
                      id="service-feedback-heading"
                    >
                      {_copy('What clients say about this service')}
                    </h2>
                  </div>
                  {feedbackItems.length > 0 ? (
                    <FeedbackSummary
                      count={
                        feedback?.summary.totalReviews ?? feedbackItems.length
                      }
                      rating={feedbackRating}
                    />
                  ) : null}
                </div>
                {feedback === null ? (
                  <PackageFeedbackUnavailable />
                ) : feedbackItems.length > 0 ? (
                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {feedbackItems.map((review) => (
                      <VerifiedReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 border border-dashed border-border bg-surface-muted p-6 sm:p-8">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {_copy('No published reviews for this service yet.')}
                    </p>
                  </div>
                )}
              </section>

              {content.importantNote ? (
                <div className="mt-10 flex items-start gap-4 rounded-lg border border-warning/30 bg-warning/5 p-5">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-warning"
                  />
                  <div>
                    <h2 className="font-semibold text-primary">
                      {_copy('Important before you continue')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {_copy(content.importantNote, content.importantNoteAr)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <aside
              className="scroll-mt-24 lg:sticky lg:top-24"
              id="service-order"
              aria-label={_copy('Order summary', 'ملخص الطلب')}
            >
              <PackageOrderCard
                checkoutHref={checkoutHref}
                checkoutMode={getCheckoutMode()}
                packageItem={packageItem}
                pricing={pricing}
                rates={rates}
              />
            </aside>
          </div>
        </div>
      </section>

      <section
        className="scroll-mt-24 border-y border-border bg-surface-muted"
        id="service-faq"
      >
        <div className="layout-container py-14 sm:py-18">
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                {_copy('Before you order')}
              </p>
              <h2 className="type-h2 mt-3 text-primary">
                {_copy('Frequently asked questions')}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                {_copy(
                  'Clear answers about starting the service and the outcome you can expect.',
                )}
              </p>
            </div>
            <Accordion
              className="border-t border-border"
              collapsible
              defaultValue="faq-0"
              type="single"
            >
              {content.faqs.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`}>
                  <AccordionTrigger className="py-5 text-base text-primary">
                    {_copy(item.question, item.questionAr)}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-5 text-sm leading-7">
                    {_copy(item.answer, item.answerAr)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-muted">
        <div className="layout-container py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-1 lg:items-center">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
              >
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="type-h4 text-primary">
                  {_copy('A clear, honest scope')}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {_copy(
                    'SANAD provides professional career-document services. These services can strengthen how your experience is presented, but they cannot guarantee interviews, offers, or employment.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(11_39_68_/_0.1)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                {_copy(packageItem.name, packageItem.nameAr)}
              </p>
              {bestOffer ? (
                <PackageOfferFlag
                  className="min-h-0 shrink-0 px-2 py-0.5 text-xs shadow-none"
                  discountPercentage={bestOffer.discountPercentage}
                />
              ) : null}
            </div>
            <p className="mt-0.5 font-display text-xl leading-none text-primary">
              {_copy(displayPrice)}
            </p>
          </div>
          <Button asChild className="group min-w-0 shrink-0" size="lg">
            <Link href={checkoutHref}>
              {_copy('Order now', 'اطلب الآن')}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
