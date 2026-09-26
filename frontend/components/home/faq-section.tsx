import { useCopy } from '@/lib/i18n/use-copy';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { PUBLIC_SERVICES_HREF } from '@/constants/public-navigation';
import {
  MotionAccentLine,
  MotionHeading,
  MotionReveal,
  MotionStaggerItem,
  MotionStaggerList,
} from '@/components/motion/motion-reveal';

interface FaqItem {
  answerAr: string;
  answerEn: string;
  link?: {
    href: string;
    labelAr: string;
    labelEn: string;
  };
  questionAr: string;
  questionEn: string;
}

const faqItems: readonly FaqItem[] = [
  {
    questionEn: 'Is SANAD only for customers in the UAE?',
    questionAr: 'هل تقتصر خدمات سند على العملاء في الإمارات؟',
    answerEn:
      'SANAD primarily supports professionals targeting opportunities in the UAE. Professional CV, Cover Letter, LinkedIn Profile Optimization, and Professional Package services may also be suitable for customers outside the UAE. The UAE Job Application Guide and Job Application Service are specifically designed for the UAE job market.',
    answerAr:
      'تركز سند بشكل أساسي على دعم الباحثين عن فرص عمل في دولة الإمارات. ويمكن أن تناسب خدمات السيرة الذاتية وخطاب التقديم وتحسين ملف LinkedIn والباقة الاحترافية عملاء من خارج الإمارات أيضًا. أما دليل التقديم على الوظائف وخدمة التقديم على الوظائف فهما مخصصان لسوق العمل الإماراتي.',
    link: {
      href: PUBLIC_SERVICES_HREF,
      labelEn: 'View career services',
      labelAr: 'استعرض الخدمات المهنية',
    },
  },
  {
    questionEn: 'How will I receive my files?',
    questionAr: 'كيف سأستلم ملفاتي؟',
    answerEn:
      'After your order and payment are confirmed, SANAD contacts you through the official WhatsApp number to collect the required information. Drafts, final files, revision updates, and service updates are coordinated through the agreed WhatsApp conversation. The account dashboard is used for order tracking and does not currently store completed files.',
    answerAr:
      'بعد تأكيد الطلب والدفع، يتواصل معك فريق سند عبر رقم واتساب الرسمي لجمع المعلومات المطلوبة. يتم تنسيق المسودات والملفات النهائية والتعديلات وتحديثات الخدمة من خلال محادثة واتساب المتفق عليها. تُستخدم لوحة الحساب لمتابعة حالة الطلب فقط، ولا تُخزّن فيها الملفات النهائية حاليًا.',
  },
  {
    questionEn: 'Which language can I choose for the Professional CV?',
    questionAr: 'أي لغة يمكنني اختيارها للسيرة الذاتية الاحترافية؟',
    answerEn:
      'The Professional CV service includes one CV in either Arabic or English. You select your preferred language during checkout. The completed CV is delivered in Word and PDF formats.',
    answerAr:
      'تشمل خدمة السيرة الذاتية الاحترافية سيرة ذاتية واحدة باللغة العربية أو الإنجليزية. تختار اللغة المطلوبة أثناء إتمام الطلب، ويتم تسليم السيرة بصيغتي Word وPDF.',
  },
  {
    questionEn: 'Does the Professional Package include both languages?',
    questionAr: 'هل تشمل الباقة الاحترافية اللغتين؟',
    answerEn:
      'No. The Professional Package is provided in one selected language. It includes a Professional CV, a role-specific Cover Letter in the same language, and LinkedIn Profile Optimization.',
    answerAr:
      'لا. تُقدم الباقة الاحترافية بلغة واحدة يختارها العميل، وتشمل سيرة ذاتية احترافية، وخطاب تقديم مخصصًا لوظيفة مستهدفة باللغة نفسها، وتحسين ملف LinkedIn.',
  },
  {
    questionEn: 'Does the Premium Full Package include job applications?',
    questionAr: 'هل تشمل الباقة الكاملة المميزة التقديم الفعلي على الوظائف؟',
    answerEn:
      'No. The Premium Full Package includes Arabic and English CVs, Arabic and English Cover Letters, LinkedIn Profile Optimization, and the UAE Job Application Guide. Done-for-you job applications are available only through the separate Job Application Service.',
    answerAr:
      'لا. تشمل الباقة الكاملة المميزة سيرة ذاتية بالعربية والإنجليزية، وخطاب تقديم بالعربية والإنجليزية، وتحسين ملف LinkedIn، ودليل التقديم على الوظائف في الإمارات. أما التقديم الفعلي على الوظائف بالنيابة عن العميل فهو خدمة مستقلة.',
  },
  {
    questionEn: 'How does the Job Application Service work?',
    questionAr: 'كيف تعمل خدمة التقديم على الوظائف؟',
    answerEn:
      'SANAD identifies suitable companies and job opportunities based on your experience, then sends your CV with a professional English application email to up to 60 suitable companies using your email account.',
    answerAr:
      'تحدد سند الشركات والفرص الوظيفية المناسبة لخبرتك، ثم ترسل سيرتك الذاتية مع رسالة تقديم احترافية باللغة الإنجليزية مباشرة إلى ما يصل إلى 60 شركة مناسبة باستخدام حساب بريدك الإلكتروني.',
  },
  {
    questionEn: 'Does SANAD guarantee a job?',
    questionAr: 'هل تضمن سند الحصول على وظيفة؟',
    answerEn:
      'No. SANAD does not guarantee interviews, job offers, or employment. Hiring decisions are made entirely by employers and recruiters.',
    answerAr:
      'لا. لا تضمن سند الحصول على مقابلة أو عرض وظيفي أو وظيفة، حيث تخضع قرارات التوظيف بالكامل للشركات وجهات التوظيف.',
  },
  {
    questionEn: 'How can I contact SANAD about my order?',
    questionAr: 'كيف أتواصل مع سند بخصوص طلبي؟',
    answerEn:
      'Use the official WhatsApp contact shared with you after ordering. For general questions before ordering, use the contact option on the services page.',
    answerAr:
      'استخدم وسيلة التواصل الرسمية عبر واتساب التي تُشارك معك بعد الطلب. وللاستفسارات العامة قبل الطلب، استخدم خيار التواصل في صفحة الخدمات.',
    link: {
      href: PUBLIC_SERVICES_HREF,
      labelEn: 'View services and contact options',
      labelAr: 'استعرض الخدمات ووسائل التواصل',
    },
  },
];

export function FaqSection() {
  const _copy = useCopy();

  return (
    <section
      aria-labelledby="faq-heading"
      className="scroll-mt-24 border-b border-border bg-background"
      id="faq"
    >
      <div className="layout-container layout-section">
        <div className="mb-12 max-w-3xl lg:mb-16">
          <MotionReveal direction="none">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
              <MotionAccentLine className="h-px w-8 origin-left bg-accent" />
              {_copy('FAQ')}
            </p>
          </MotionReveal>
          <MotionHeading
            className="type-h2 mt-5 max-w-[14ch]"
            id="faq-heading"
            text={_copy('Common Questions')}
          />
          <MotionReveal delay={0.12} distance={14}>
            <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {_copy(
                'Answers to the questions visitors most often ask before choosing a career service.',
              )}
            </p>
          </MotionReveal>
        </div>

        <MotionStaggerList className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {faqItems.map(
            ({ answerAr, answerEn, link, questionAr, questionEn }) => (
              <MotionStaggerItem key={questionEn}>
                <div className="border-t-2 border-accent pt-5">
                  <h3 className="type-h5 text-primary">
                    {_copy(questionEn, questionAr)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {_copy(answerEn, answerAr)}
                  </p>
                  {link ? (
                    <Link
                      className="group mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline decoration-accent underline-offset-4 transition-colors duration-200 hover:text-secondary"
                      href={link.href}
                    >
                      {_copy(link.labelEn, link.labelAr)}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-3.5 transition-transform duration-200 ease-[var(--ease-standard)] motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </Link>
                  ) : null}
                </div>
              </MotionStaggerItem>
            ),
          )}
        </MotionStaggerList>
      </div>
    </section>
  );
}
