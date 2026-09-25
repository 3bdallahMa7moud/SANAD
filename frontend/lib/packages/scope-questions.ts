import type { CareerPackage } from '@/types/domain';

export interface ScopeQuestion {
  ar: string;
  answerAr: string;
  answerEn: string;
  en: string;
}

const questions: Record<string, ScopeQuestion[]> = {
  'professional cv': [
    {
      en: 'Which language, file formats, and page count are included?',
      ar: 'ما اللغة وصيغ الملفات وعدد الصفحات المشمولة؟',
      answerEn:
        'The CV is prepared in one selected language and delivered in the agreed Word and PDF formats. The appropriate page count depends on your experience and is confirmed before work begins.',
      answerAr:
        'تُجهز السيرة الذاتية بلغة واحدة تختارها، وتُسلَّم بصيغتي Word وPDF المتفق عليهما. ويُحدد عدد الصفحات المناسب حسب خبرتك قبل بدء العمل.',
    },
    {
      en: 'Does the scope cover writing from scratch, updating an existing CV, or both?',
      ar: 'هل يشمل النطاق كتابة سيرة جديدة أو تحديث سيرة قائمة أو كليهما؟',
      answerEn:
        'Both are supported. SANAD can improve an existing CV or build one from complete career information when no current CV is available.',
      answerAr:
        'يشمل الخيارين. يمكن لسند تطوير سيرة ذاتية موجودة أو إعداد سيرة جديدة عند تزويدها بمعلومات مهنية كاملة.',
    },
  ],
  'professional package': [
    {
      en: 'Is the Cover Letter tailored to one vacancy or provided as a reusable template?',
      ar: 'هل يُخصص خطاب التقديم لوظيفة واحدة أم يُسلَّم كنموذج قابل لإعادة الاستخدام؟',
      answerEn:
        'The Cover Letter is tailored to one agreed target role or representative vacancy. Any reusable-template requirement should be confirmed with SANAD before work begins.',
      answerAr:
        'يُخصص خطاب التقديم لمسمى وظيفي مستهدف أو وظيفة ممثلة يتم الاتفاق عليها. وإذا كنت تحتاج نموذجًا عامًا قابلًا لإعادة الاستخدام، فأكد ذلك مع سند قبل بدء العمل.',
    },
    {
      en: 'Which language applies to the CV and Cover Letter?',
      ar: 'ما اللغة التي ستُستخدم للسيرة الذاتية وخطاب التقديم؟',
      answerEn:
        'Both documents are prepared in one selected language. SANAD confirms the chosen language with you before starting the service.',
      answerAr:
        'يُجهز المستندان بلغة واحدة تختارها، وتؤكد سند معك اللغة المطلوبة قبل بدء الخدمة.',
    },
  ],
  'full package': [
    {
      en: 'How does the scope differ from ordering the CV, Cover Letter, and LinkedIn service separately?',
      ar: 'كيف يختلف نطاق الباقة عن طلب السيرة الذاتية وخطاب التقديم وخدمة LinkedIn بشكل منفصل؟',
      answerEn:
        'The package develops the included documents and LinkedIn content around one coordinated career direction. The exact bundled deliverables are the items published above.',
      answerAr:
        'تُعد الباقة المستندات ومحتوى LinkedIn المشمولين وفق توجه مهني واحد ومتناسق. والمخرجات الدقيقة للباقة هي العناصر المنشورة أعلاه.',
    },
    {
      en: 'Do you receive LinkedIn text to add yourself, or is implementation included?',
      ar: 'هل تستلم نصًا جاهزًا لإضافته إلى LinkedIn بنفسك أم يشمل النطاق التنفيذ؟',
      answerEn:
        'You receive ready-to-use profile content and guidance. Any direct account access or implementation by SANAD must be agreed separately before work begins.',
      answerAr:
        'تستلم محتوى جاهزًا للاستخدام مع الإرشادات. أما الدخول المباشر إلى الحساب أو تنفيذ التعديلات بواسطة سند فيجب الاتفاق عليه بشكل منفصل قبل البدء.',
    },
  ],
  'premium full package': [
    {
      en: 'Which documents and profile improvements are included?',
      ar: 'ما المستندات وتحسينات الملف الشخصي المشمولة؟',
      answerEn:
        'The package includes only the documents and profile improvements listed in the “What is included” section above. Actual job-application submission is not included unless it is explicitly published and confirmed as part of the service.',
      answerAr:
        'تشمل الباقة فقط المستندات وتحسينات الملف المذكورة في قسم «ما الذي تتضمنه الخدمة» أعلاه. ولا تشمل التقديم الفعلي على الوظائف إلا إذا كان منشورًا بوضوح ومؤكدًا ضمن الخدمة.',
    },
    {
      en: 'Which languages and file formats are included?',
      ar: 'ما اللغات وصيغ الملفات المشمولة؟',
      answerEn:
        'The languages are the ones displayed beside each published deliverable. SANAD confirms the final editable and PDF file formats with you before work begins.',
      answerAr:
        'اللغات المشمولة هي الظاهرة بجوار كل مخرج منشور، وتؤكد سند معك صيغ الملفات النهائية القابلة للتعديل وPDF قبل بدء العمل.',
    },
  ],
  'linkedin profile optimization': [
    {
      en: 'Which profile sections and languages are included?',
      ar: 'ما أقسام ملف LinkedIn واللغات المشمولة؟',
      answerEn:
        'The service focuses on the profile sections listed in the published scope, such as the headline, About section, and experience content. The selected language is confirmed before work begins.',
      answerAr:
        'تركز الخدمة على أقسام الملف المذكورة في النطاق المنشور، مثل العنوان والنبذة ومحتوى الخبرات. وتُؤكد اللغة المختارة قبل بدء العمل.',
    },
    {
      en: 'Will you receive ready-to-use text and guidance, or is implementation included?',
      ar: 'هل تستلم نصًا وإرشادات جاهزة للاستخدام أم يشمل النطاق التنفيذ؟',
      answerEn:
        'You receive ready-to-use text and practical guidance. Direct implementation or account access is included only when it has been separately agreed with SANAD.',
      answerAr:
        'تستلم نصًا جاهزًا للاستخدام وإرشادات عملية. ولا يشمل التنفيذ المباشر أو الدخول إلى الحساب إلا عند الاتفاق عليه بشكل منفصل مع سند.',
    },
  ],
  'job application service': [
    {
      en: 'What information is needed before suitable applications can begin?',
      ar: 'ما المعلومات المطلوبة قبل بدء التقديم على الفرص المناسبة؟',
      answerEn:
        'Provide your current CV, target roles, preferred industries and locations, work authorization, notice period, salary expectations, and access to any verification steps you control.',
      answerAr:
        'قدّم سيرتك الحالية والوظائف والقطاعات والمواقع المستهدفة وحالة تصريح العمل وفترة الإشعار والتوقعات المالية، مع الاستعداد لإكمال خطوات التحقق التي تخصك.',
    },
    {
      en: 'How are suitable opportunities and submitted applications reported?',
      ar: 'كيف يتم توثيق الفرص المناسبة والطلبات المقدمة؟',
      answerEn:
        'SANAD shares updates and the application report through WhatsApp during the agreed period of up to 3 calendar days. The service focuses on suitable opportunities and does not guarantee interviews or employment.',
      answerAr:
        'ترسل سند التحديثات وتقرير التقديم عبر واتساب خلال المدة المتفق عليها التي تصل إلى 3 أيام تقويمية. وتركز الخدمة على الفرص المناسبة ولا تضمن مقابلات أو توظيفًا.',
    },
  ],
};

// Preserve the questions while an existing database is being updated from
// the previous package names.
questions['professional distinction package'] =
  questions['professional package'];
questions['career excellence package'] = questions['full package'];
questions['golden signature package'] = questions['premium full package'];

export function getScopeQuestions(packageItem: CareerPackage): ScopeQuestion[] {
  return (
    questions[packageItem.name.trim().toLowerCase()] ?? [
      {
        en: 'Which deliverables, formats, and languages are included?',
        ar: 'ما المخرجات والصيغ واللغات المشمولة؟',
        answerEn:
          'The included deliverables are the items published on this page. SANAD confirms the selected formats and languages before work begins.',
        answerAr:
          'المخرجات المشمولة هي العناصر المنشورة في هذه الصفحة، وتؤكد سند الصيغ واللغات المختارة قبل بدء العمل.',
      },
      {
        en: 'What is outside the published scope?',
        ar: 'ما الذي لا يشمله النطاق المنشور؟',
        answerEn:
          'Anything not listed in the published deliverables is outside the package unless SANAD confirms it separately in writing before the service begins.',
        answerAr:
          'أي عنصر غير مذكور ضمن المخرجات المنشورة لا يدخل في الباقة إلا إذا أكدته سند كتابةً بشكل منفصل قبل بدء الخدمة.',
      },
    ]
  );
}
