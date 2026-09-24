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
  title: 'Terms & Conditions | SANAD',
  description:
    'Terms for SANAD professional career services, WhatsApp delivery, revisions, refunds, and job application support.',
  alternates: { canonical: '/pages/terms-and-conditions' },
};

export async function generateMetadata(): Promise<Metadata> {
  const _copy = await getCopy();
  const page = await getPublishedCmsPage('terms-and-conditions');
  if (!page) {
    return await getLocalizedMetadata({
      title: _copy('Terms & Conditions | SANAD', 'الشروط والأحكام | سند'),
      description: _copy(
        'Terms for SANAD professional career services, WhatsApp delivery, revisions, refunds, and job application support.',
        'شروط خدمات سند المهنية والتسليم عبر واتساب والتعديلات والاسترداد وخدمة التقديم على الوظائف.',
      ),
      alternates: fallbackMetadata.alternates,
    });
  }

  const title = _copy(
    page.title_en || 'Terms & Conditions',
    hasArabicTranslation(page.title_ar) ? page.title_ar : 'الشروط والأحكام',
  );
  const description = _copy(
    page.meta_description_en || (fallbackMetadata.description as string),
    hasArabicTranslation(page.meta_description_ar)
      ? page.meta_description_ar
      : 'شروط خدمات سند المهنية والتسليم عبر واتساب والتعديلات والاسترداد وخدمة التقديم على الوظائف.',
  );

  return await getLocalizedMetadata({
    title: `${title} | ${_copy('SANAD', 'سند')}`,
    description,
    alternates: fallbackMetadata.alternates,
  });
}

const sections = [
  {
    id: 'acceptance',
    titleEn: 'Acceptance of Terms',
    titleAr: 'قبول الشروط',
    contentEn: [
      'By placing an order or using the SANAD platform you agree to these Terms & Conditions and our Privacy Policy. If you do not agree with any provision, please do not proceed with an order.',
    ],
    contentAr: [
      'بتقديم طلب أو استخدام منصة سند، فإنك توافق على هذه الشروط والأحكام وسياسة الخصوصية. إذا لم توافق على أي بند، يرجى عدم متابعة الطلب.',
    ],
  },
  {
    id: 'scope-of-services',
    titleEn: 'Services',
    titleAr: 'الخدمات',
    contentEn: [
      'SANAD provides professional career services including Professional CV writing, role-specific Cover Letters, LinkedIn Profile Optimization, the UAE Job Application Guide, and Job Application Service. The exact deliverables, language, price, delivery period, and revision allowance are displayed before the customer confirms the order.',
    ],
    contentAr: [
      'تقدم سند خدمات مهنية تشمل كتابة السيرة الذاتية الاحترافية، وخطابات التقديم المخصصة لوظائف مستهدفة، وتحسين ملف LinkedIn، ودليل التقديم على الوظائف في الإمارات، وخدمة التقديم على الوظائف. تظهر المخرجات واللغة والسعر ومدة التسليم وعدد التعديلات قبل تأكيد الطلب.',
    ],
  },
  {
    id: 'whatsapp-delivery',
    titleEn: 'WhatsApp Communication and Delivery',
    titleAr: 'التواصل والتسليم عبر واتساب',
    contentEn: [
      'After the order and payment are confirmed, SANAD uses the official WhatsApp conversation to collect the required information and coordinate the service. Drafts, final files, revisions, and service reports are delivered through WhatsApp. The customer dashboard currently provides order tracking only.',
    ],
    contentAr: [
      'بعد تأكيد الطلب والدفع، تستخدم سند محادثة واتساب الرسمية لجمع المعلومات المطلوبة وتنسيق تنفيذ الخدمة. يتم تسليم المسودات والملفات النهائية والتعديلات وتقارير الخدمة عبر واتساب. وتوفر لوحة حساب العميل حاليًا متابعة حالة الطلب فقط.',
    ],
  },
  {
    id: 'delivery',
    titleEn: 'Delivery Timelines',
    titleAr: 'مواعيد التسليم',
    contentEn: [
      'The delivery or service period begins after payment is confirmed and SANAD receives all information, documents, approvals, and verification steps required to begin. The timeline pauses while SANAD is waiting for information, documents, approval, OTP verification, email verification, or another required action from the customer.',
    ],
    contentAr: [
      'تبدأ مدة التسليم أو تنفيذ الخدمة بعد تأكيد الدفع واستلام سند لجميع المعلومات والمستندات والموافقات وخطوات التحقق المطلوبة للبدء. وتتوقف المدة مؤقتًا أثناء انتظار معلومات أو مستندات أو موافقة أو رمز OTP أو تأكيد بريد إلكتروني أو أي إجراء مطلوب من العميل.',
    ],
  },
  {
    id: 'revisions',
    titleEn: 'Revisions',
    titleAr: 'التعديلات',
    contentEn: [
      'A revision round means one consolidated set of feedback submitted by the client after reviewing the delivered draft. Revisions apply only within the original agreed scope and do not include changing the service into a different document, language, target role, or career direction.',
      'LinkedIn Profile Optimization includes revision support until final approval within the originally agreed profile scope. The Job Application Service does not include revision rounds.',
    ],
    contentAr: [
      'تعني جولة التعديل مجموعة موحدة من الملاحظات يرسلها العميل بعد مراجعة المسودة المستلمة. تنطبق التعديلات داخل النطاق المتفق عليه أصلًا، ولا تشمل تحويل الخدمة إلى مستند أو لغة أو وظيفة مستهدفة أو اتجاه مهني مختلف.',
      'تشمل خدمة تحسين ملف LinkedIn دعم التعديل حتى الاعتماد النهائي ضمن نطاق الملف المتفق عليه أصلًا. ولا تشمل خدمة التقديم على الوظائف جولات تعديل.',
    ],
  },
  {
    id: 'job-application-service',
    titleEn: 'Job Application Service',
    titleAr: 'خدمة التقديم على الوظائف',
    contentEn: [
      'By purchasing the Job Application Service, the customer authorizes SANAD to use the supplied CV and relevant information to search for reasonably suitable opportunities and submit applications on the customer’s behalf. The service covers up to 60 suitable applications and ends when either 60 suitable applications have been submitted or 30 calendar days have passed, whichever occurs first.',
      'Applications may be submitted through relevant UAE job platforms, recruitment websites, employer career portals, and other appropriate channels. LinkedIn, Bayt, Indeed UAE, Naukrigulf, and GulfTalent are examples and do not represent an exclusive platform list.',
      'The customer is responsible for the accuracy of all supplied information and may need to complete OTP, email verification, account access, or another candidate-only step. SANAD is not responsible for platform outages, expired vacancies, employer decisions, delayed employer responses, or the availability of suitable opportunities. Irrelevant applications will not be submitted merely to reach the maximum number.',
      'The application report is delivered through WhatsApp and records the company, job title, job URL, date applied, application status, platform or source, and relevant notes. It does not provide live employer tracking.',
    ],
    contentAr: [
      'بشراء خدمة التقديم على الوظائف، يفوض العميل سند باستخدام السيرة الذاتية والمعلومات ذات الصلة للبحث عن فرص مناسبة بصورة معقولة وتقديم الطلبات بالنيابة عنه. تشمل الخدمة حتى 60 طلب توظيف مناسبًا، وتنتهي عند إتمام 60 طلبًا مناسبًا أو مرور 30 يومًا تقويميًا، أيهما يحدث أولًا.',
      'يجوز تنفيذ الطلبات من خلال منصات التوظيف الإماراتية المناسبة، ومواقع التوظيف، وبوابات الشركات، وقنوات التقديم الملائمة الأخرى. وتُعد LinkedIn وBayt وIndeed UAE وNaukrigulf وGulfTalent أمثلة وليست قائمة حصرية.',
      'يتحمل العميل مسؤولية دقة المعلومات التي يقدمها، وقد يحتاج إلى إتمام رمز OTP أو تأكيد البريد الإلكتروني أو الدخول إلى حسابه أو أي خطوة شخصية أخرى. لا تتحمل سند مسؤولية أعطال المنصات أو انتهاء صلاحية الوظائف أو قرارات أصحاب العمل أو تأخر الردود أو عدم توفر عدد كافٍ من الفرص المناسبة. ولن يتم إرسال طلبات غير ملائمة لمجرد الوصول إلى الحد الأقصى.',
      'يُسلّم تقرير التقديم عبر واتساب ويتضمن الشركة والمسمى الوظيفي ورابط الوظيفة وتاريخ التقديم وحالة الطلب والمنصة أو المصدر والملاحظات ذات الصلة. ولا يمثل التقرير نظام متابعة مباشرًا مع جهة التوظيف.',
    ],
  },
  {
    id: 'refunds',
    titleEn: 'Refund Policy',
    titleAr: 'سياسة الاسترداد',
    contentEn: [
      'A full refund may be requested before SANAD begins work. Work begins when SANAD starts reviewing customer materials, writing or editing documents, preparing LinkedIn content, searching for job opportunities, or submitting applications.',
      'After work begins, a change of mind alone does not entitle the customer to a refund. Any included revision rights remain available within the original agreed scope. If SANAD cannot provide an agreed service, the amount relating to the undelivered service will be refunded. Duplicate or accidental duplicate payments will also be refunded.',
      'Customer delays pause the delivery timeline while SANAD awaits required information, documents, approvals, or verification. For the Job Application Service, the absence of interviews, job offers, or employment does not create a refund entitlement after work has started.',
    ],
    contentAr: [
      'يمكن طلب استرداد كامل للمبلغ قبل أن تبدأ سند العمل. يبدأ العمل عندما تبدأ سند في مراجعة مستندات العميل، أو كتابة المستندات أو تعديلها، أو إعداد محتوى LinkedIn، أو البحث عن فرص وظيفية، أو تقديم طلبات التوظيف.',
      'بعد بدء العمل، لا يمنح تغيير رأي العميل وحده حقًا في استرداد المبلغ. وتظل التعديلات المشمولة متاحة داخل النطاق المتفق عليه أصلًا. إذا تعذر على سند تقديم خدمة متفق عليها، يُسترد المبلغ الخاص بالجزء الذي لم يتم تنفيذه. كما تُسترد الدفعات المكررة أو التي تم دفعها بالخطأ مرتين.',
      'تؤدي تأخيرات العميل إلى إيقاف مدة التسليم مؤقتًا أثناء انتظار المعلومات أو المستندات أو الموافقات أو خطوات التحقق المطلوبة. وبالنسبة لخدمة التقديم على الوظائف، لا يؤدي عدم الحصول على مقابلات أو عروض وظيفية أو وظيفة إلى استحقاق استرداد المبلغ بعد بدء العمل.',
    ],
  },
  {
    id: 'employment-disclaimer',
    titleEn: 'Employment Disclaimer',
    titleAr: 'إخلاء مسؤولية التوظيف',
    contentEn: [
      'SANAD does not guarantee interviews, job offers, or employment. Hiring decisions are made entirely by employers and recruiters.',
    ],
    contentAr: [
      'لا تضمن سند الحصول على مقابلة أو عرض وظيفي أو وظيفة، حيث تخضع قرارات التوظيف بالكامل للشركات وجهات التوظيف.',
    ],
  },
];

export default async function TermsAndConditionsPage() {
  const _copy = await getCopy();

  const cmsPage = await getPublishedCmsPage('terms-and-conditions');
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
                {_copy('Terms & Conditions')}
              </li>
            </ol>
          </nav>

          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {_copy('Legal')}
          </p>
          <h1 className="type-h2 mt-5 max-w-[22ch]">
            {_copy(
              cmsPage?.title_en ?? 'Terms & Conditions',
              hasArabicTranslation(cmsPage?.title_ar)
                ? cmsPage.title_ar
                : 'الشروط والأحكام',
            )}
          </h1>
          <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {_copy(
              cmsPage?.meta_description_en ??
                'The terms that govern SANAD professional career services.',
              hasArabicTranslation(cmsPage?.meta_description_ar)
                ? cmsPage.meta_description_ar
                : 'الشروط التي تنظم خدمات سند المهنية.',
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
                      {_copy(contentEn, contentAr).map((paragraph) => (
                        <p
                          className="text-sm leading-7 text-foreground/80 sm:text-base sm:leading-8"
                          key={paragraph.slice(0, 40)}
                        >
                          {paragraph}
                        </p>
                      ))}
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
