import { getLocalizedMetadata } from '@/lib/i18n/metadata';

import { hasArabicTranslation } from '@/lib/i18n/has-arabic-translation';
import { getCopy } from '@/lib/i18n/server-copy';
import type { Metadata } from 'next';
import Link from 'next/link';

import { CmsRichText } from '@/components/pages/cms-rich-text';
import { Separator } from '@/components/ui/separator';
import { getPublishedCmsPage } from '@/lib/pages/cms';

export const dynamic = 'force-dynamic';

const fallbackMetadata: Metadata = {
  title: 'Privacy Policy | SANAD',
  description:
    'How SANAD uses personal and professional information to deliver career and UAE job application services.',
  alternates: { canonical: '/pages/privacy-policy' },
};

export async function generateMetadata(): Promise<Metadata> {
  const _copy = await getCopy();
  const page = await getPublishedCmsPage('privacy-policy');
  if (!page) {
    return await getLocalizedMetadata({
      title: _copy('Privacy Policy | SANAD', 'سياسة الخصوصية | سند'),
      description: _copy(
        'How SANAD uses personal and professional information to deliver career and UAE job application services.',
        'كيف تستخدم سند المعلومات الشخصية والمهنية لتقديم الخدمات المهنية وخدمة التقديم على الوظائف في الإمارات.',
      ),
      alternates: fallbackMetadata.alternates,
    });
  }

  const title = _copy(
    page.title_en || 'Privacy Policy',
    hasArabicTranslation(page.title_ar) ? page.title_ar : 'سياسة الخصوصية',
  );
  const description = _copy(
    page.meta_description_en || (fallbackMetadata.description as string),
    hasArabicTranslation(page.meta_description_ar)
      ? page.meta_description_ar
      : 'كيف تستخدم سند المعلومات الشخصية والمهنية لتقديم الخدمات المهنية وخدمة التقديم على الوظائف في الإمارات.',
  );

  return await getLocalizedMetadata({
    title: `${title} | ${_copy('SANAD', 'سند')}`,
    description,
    alternates: fallbackMetadata.alternates,
  });
}

const sections = [
  {
    id: 'information-we-collect',
    titleEn: 'Information We Collect',
    titleAr: 'المعلومات التي نجمعها',
    contentEn: [
      'SANAD may collect the customer’s name, email address, phone number, CV, employment and education history, qualifications, skills, target roles, preferred language, LinkedIn profile information, order details, and other information supplied for the purchased service.',
    ],
    contentAr: [
      'قد تجمع سند اسم العميل وبريده الإلكتروني ورقم هاتفه وسيرته الذاتية وتاريخه الوظيفي والتعليمي ومؤهلاته ومهاراته والوظائف المستهدفة واللغة المختارة ومعلومات ملف LinkedIn وبيانات الطلب وأي معلومات أخرى يقدمها لتنفيذ الخدمة المشتراة.',
    ],
  },
  {
    id: 'how-we-use-your-data',
    titleEn: 'How We Use Your Data',
    titleAr: 'كيف نستخدم معلوماتك',
    contentEn: [
      'Information is used to manage orders, communicate through WhatsApp, prepare CVs and Cover Letters, optimize LinkedIn profiles, provide the UAE Job Application Guide, perform the Job Application Service when purchased, process payments, provide revisions, and deliver service reports.',
    ],
    contentAr: [
      'تُستخدم المعلومات لإدارة الطلبات والتواصل عبر واتساب وإعداد السير الذاتية وخطابات التقديم وتحسين ملفات LinkedIn وتوفير دليل التقديم على الوظائف في الإمارات وتنفيذ خدمة التقديم على الوظائف عند شرائها ومعالجة المدفوعات وتقديم التعديلات وتسليم تقارير الخدمة.',
    ],
  },
  {
    id: 'job-application-service-data',
    titleEn: 'Job Application Service Data Sharing',
    titleAr: 'مشاركة بيانات خدمة التقديم على الوظائف',
    contentEn: [
      'When the Job Application Service is purchased, SANAD may share the customer’s CV and relevant application information with employers, recruiters, recruitment websites, job platforms, and employer career portals solely to search for suitable opportunities and submit authorized applications.',
      'SANAD uses only the information reasonably required for the relevant application. The customer remains responsible for ensuring that the supplied information is complete and accurate.',
    ],
    contentAr: [
      'عند شراء خدمة التقديم على الوظائف، يجوز لسند مشاركة السيرة الذاتية ومعلومات التقديم ذات الصلة مع أصحاب العمل ومسؤولي التوظيف ومواقع ومنصات التوظيف وبوابات الشركات، وذلك فقط للبحث عن فرص مناسبة وتقديم الطلبات التي فوض العميل سند بتنفيذها.',
      'تستخدم سند المعلومات اللازمة بصورة معقولة لكل طلب، ويظل العميل مسؤولًا عن اكتمال ودقة المعلومات المقدمة.',
    ],
  },
  {
    id: 'whatsapp-and-service-providers',
    titleEn: 'WhatsApp and Service Providers',
    titleAr: 'واتساب ومزودو الخدمات',
    contentEn: [
      'SANAD uses WhatsApp as its primary communication and delivery channel. Information sent through WhatsApp is also subject to WhatsApp’s applicable privacy terms.',
      'SANAD may use service providers required for website hosting, email delivery, file storage, payment processing, technical support, and customer communication. Information is shared only as reasonably necessary for those services.',
    ],
    contentAr: [
      'تستخدم سند واتساب كقناة أساسية للتواصل والتسليم. وتخضع المعلومات المرسلة عبر واتساب كذلك لشروط الخصوصية المطبقة لدى واتساب.',
      'قد تستخدم سند مزودي خدمات للاستضافة وإرسال البريد الإلكتروني وتخزين الملفات ومعالجة المدفوعات والدعم التقني والتواصل مع العملاء. ولا تُشارك المعلومات إلا بالقدر اللازم بصورة معقولة لتقديم هذه الخدمات.',
    ],
  },
  {
    id: 'data-access-and-security',
    titleEn: 'Data Access and Security',
    titleAr: 'الوصول إلى البيانات وأمنها',
    contentEn: [
      'Access to customer information is limited to team members and service providers who need it to perform or support the purchased service. No method of online transmission or storage can be guaranteed to be completely secure.',
    ],
    contentAr: [
      'يقتصر الوصول إلى معلومات العملاء على أعضاء الفريق ومزودي الخدمات الذين يحتاجون إليها لتنفيذ الخدمة المشتراة أو دعمها. ولا يمكن ضمان الأمان الكامل لأي وسيلة نقل أو تخزين إلكتروني.',
    ],
  },
  {
    id: 'retention-and-deletion',
    titleEn: 'Retention and Deletion',
    titleAr: 'الاحتفاظ بالبيانات وحذفها',
    contentEn: [
      'SANAD retains order, communication, payment, and service records for as long as reasonably necessary to provide the service, resolve disputes, maintain business records, and meet applicable obligations.',
      'Customers may contact SANAD to request access to, correction of, or deletion of eligible personal information. Some information may need to be retained where reasonably required for payment, fraud prevention, recordkeeping, dispute resolution, or legal obligations.',
    ],
    contentAr: [
      'تحتفظ سند بسجلات الطلبات والتواصل والمدفوعات والخدمات للمدة اللازمة بصورة معقولة لتقديم الخدمة وحل النزاعات والاحتفاظ بسجلات الأعمال والوفاء بالالتزامات المطبقة.',
      'يمكن للعملاء التواصل مع سند لطلب الوصول إلى معلوماتهم الشخصية المؤهلة أو تصحيحها أو حذفها. وقد يلزم الاحتفاظ ببعض المعلومات لأغراض المدفوعات أو منع الاحتيال أو حفظ السجلات أو حل النزاعات أو الوفاء بالالتزامات القانونية.',
    ],
  },
  {
    id: 'contact',
    titleEn: 'Contact',
    titleAr: 'التواصل',
    contentEn: [
      'For privacy questions or requests, contact SANAD through the official WhatsApp number published on the website. The published support email may also be used as a secondary contact method.',
    ],
    contentAr: [
      'للأسئلة أو الطلبات المتعلقة بالخصوصية، تواصل مع سند عبر رقم واتساب الرسمي المنشور على الموقع. ويمكن استخدام بريد الدعم المنشور كوسيلة تواصل ثانوية.',
    ],
  },
];

export default async function PrivacyPolicyPage() {
  const _copy = await getCopy();

  const cmsPage = await getPublishedCmsPage('privacy-policy');
  const cmsHasBilingualContent =
    Boolean(cmsPage?.content_en?.trim()) &&
    hasArabicTranslation(cmsPage?.content_ar);

  return (
    <div className="bg-background">
      <div className="border-b border-border bg-surface-muted">
        <div className="layout-container py-16 sm:py-20">
          <nav aria-label={_copy('Breadcrumb')} className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link className="transition-colors hover:text-primary" href="/">
                  {_copy('Home')}
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">
                {_copy('/')}
              </li>
              <li className="font-medium text-primary">
                {_copy('Privacy Policy')}
              </li>
            </ol>
          </nav>

          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {_copy('Legal')}
          </p>
          <h1 className="type-h2 mt-5 max-w-[20ch]">
            {_copy(
              cmsPage?.title_en ?? 'Privacy Policy',
              hasArabicTranslation(cmsPage?.title_ar)
                ? cmsPage.title_ar
                : 'سياسة الخصوصية',
            )}
          </h1>
          <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {_copy(
              cmsPage?.meta_description_en ??
                'How SANAD handles information used to deliver professional career services.',
              hasArabicTranslation(cmsPage?.meta_description_ar)
                ? cmsPage.meta_description_ar
                : 'كيف تتعامل سند مع المعلومات المستخدمة لتقديم الخدمات المهنية.',
            )}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {_copy(
              'Last updated September 24, 2026',
              'آخر تحديث: 24 سبتمبر 2026',
            )}
          </p>
        </div>
      </div>

      <div className="layout-container layout-section">
        <div className="mx-auto max-w-3xl">
          {cmsHasBilingualContent ? (
            <CmsRichText
              content={_copy(
                cmsPage?.content_en ?? '',
                cmsPage?.content_ar ?? '',
              )}
            />
          ) : (
            <div className="space-y-12">
              {sections.map(
                ({ contentAr, contentEn, id, titleAr, titleEn }, index) => (
                  <section id={id} key={id}>
                    <h2 className="type-h4 text-primary">
                      {_copy.number(index + 1, { useGrouping: false })}
                      {_copy('.')}
                      {_copy(titleEn, titleAr)}
                    </h2>
                    <div className="mt-4 space-y-4">
                      {(_copy.locale === 'ar' ? contentAr : contentEn).map(
                        (paragraph) => (
                          <p
                            className="text-sm leading-7 text-foreground/80 sm:text-base sm:leading-8"
                            key={paragraph.slice(0, 40)}
                          >
                            {paragraph}
                          </p>
                        ),
                      )}
                    </div>
                    {index < sections.length - 1 && (
                      <Separator className="mt-12" />
                    )}
                  </section>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
