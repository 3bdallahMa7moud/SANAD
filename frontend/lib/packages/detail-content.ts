import type { CareerPackage } from '@/types/domain';

export interface PackageProcessStep {
  title: string;
  description: string;
}

export interface PackageFaqItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

export interface PackageDetailContent {
  bestFor: string;
  bestForAr?: string;
  preparation: string[];
  process: PackageProcessStep[];
  importantNote?: string;
  importantNoteAr?: string;
  faqs: PackageFaqItem[];
}

type PackageSpecificContent = Omit<PackageDetailContent, 'faqs'> & {
  faqs?: PackageFaqItem[];
};

const PACKAGE_CONTENT: Record<string, PackageSpecificContent> = {
  'premium full package': {
    bestFor:
      'Professionals who want their CV, Cover Letter, and LinkedIn profile to present one coordinated career story.',
    bestForAr:
      'للمهنيين الذين يريدون أن تعكس سيرتهم الذاتية وخطاب التقديم وملف LinkedIn قصة مهنية واحدة ومتسقة.',
    preparation: [
      'Your current CV or a complete employment history',
      'The roles, industries, and locations you are targeting',
      'Key achievements, projects, qualifications, and certifications',
      'Your LinkedIn profile link and examples of relevant vacancies',
    ],
    process: [
      {
        title: 'Career direction review',
        description:
          'We review your experience, goals, and target opportunities before shaping the content direction.',
      },
      {
        title: 'Coordinated document development',
        description:
          'The included documents and profile content are developed around one consistent professional position.',
      },
      {
        title: 'Review and final delivery',
        description:
          'You review the completed work and confirm that the agreed scope has been delivered.',
      },
    ],
    faqs: [
      {
        question: 'What does the Premium Full Package include?',
        questionAr: 'ماذا تشمل الباقة المتكاملة المميزة؟',
        answer:
          'The deliverables displayed in the “What is included” section define the package scope. Review that list before ordering, especially the language and application-support items.',
        answerAr:
          'تحدد المخرجات المعروضة في قسم «ما الذي تتضمنه الخدمة» نطاق الباقة. راجع هذه القائمة قبل الطلب، وبالأخص عناصر اللغة ودعم التقديم على الوظائف.',
      },
      {
        question: 'Are the documents prepared in both Arabic and English?',
        questionAr: 'هل تُجهز المستندات بالعربية والإنجليزية؟',
        answer:
          'Check the language stated beside each published deliverable. SANAD confirms the selected language and final files through WhatsApp before work begins.',
        answerAr:
          'تحقق من اللغة المذكورة بجوار كل مخرج منشور. تؤكد سند اللغة المختارة والملفات النهائية عبر واتساب قبل بدء العمل.',
      },
    ],
  },
  'full package': {
    bestFor:
      'Professionals who need a coordinated CV, cover letter, and LinkedIn profile.',
    bestForAr:
      'للمهنيين الذين يحتاجون سيرة ذاتية وخطاب تقديم وملف LinkedIn متسقة معًا.',
    preparation: [
      'Your current CV or complete career history',
      'Your target roles and preferred industries',
      'Measurable achievements, projects, and qualifications',
      'Your LinkedIn profile link and a relevant job description if available',
    ],
    process: [
      {
        title: 'Positioning review',
        description:
          'We identify the experience and strengths that should lead your professional story.',
      },
      {
        title: 'Content alignment',
        description:
          'Your CV, cover letter, and LinkedIn content are aligned for a consistent presentation.',
      },
      {
        title: 'Review and delivery',
        description:
          'You review the work and confirm that the agreed scope has been delivered.',
      },
    ],
    faqs: [
      {
        question: 'How are the CV, Cover Letter, and LinkedIn profile aligned?',
        questionAr: 'كيف يتم توحيد السيرة الذاتية وخطاب التقديم وملف LinkedIn؟',
        answer:
          'SANAD uses one agreed professional direction so that the included documents and profile content present consistent priorities, achievements, and target roles.',
        answerAr:
          'تستخدم سند توجهًا مهنيًا متفقًا عليه حتى تعرض المستندات ومحتوى الملف المشمولان الأولويات والإنجازات والوظائف المستهدفة بصورة متسقة.',
      },
      {
        question: 'What should I provide before work begins?',
        questionAr: 'ماذا أحتاج إلى تقديمه قبل بدء العمل؟',
        answer:
          'Share your current CV or career history, target roles, key achievements, and your LinkedIn link if available. SANAD confirms any additional details through WhatsApp.',
        answerAr:
          'شارك سيرتك الذاتية الحالية أو تاريخك المهني والوظائف المستهدفة وأهم إنجازاتك ورابط LinkedIn إن توفر. وتؤكد سند أي تفاصيل إضافية عبر واتساب.',
      },
    ],
  },
  'professional package': {
    bestFor:
      'Professionals who want a focused CV and matching cover letter for a clear, consistent application.',
    bestForAr:
      'للمهنيين الذين يريدون سيرة ذاتية مركزة وخطاب تقديم متناسقًا لطلب توظيف واضح.',
    preparation: [
      'Your current CV or employment and education history',
      'The target role or a representative vacancy',
      'Important achievements, skills, and qualifications',
      'Any context that should be reflected in the cover letter',
    ],
    process: [
      {
        title: 'Career direction review',
        description:
          'We review your background and the type of opportunity you plan to pursue.',
      },
      {
        title: 'CV and letter development',
        description:
          'Both documents are shaped around the same professional message and priorities.',
      },
      {
        title: 'Final review',
        description:
          'You review the paired documents and confirm that the agreed content has been delivered.',
      },
    ],
    faqs: [
      {
        question: 'Is the Cover Letter tailored to a target role?',
        questionAr: 'هل يُخصص خطاب التقديم لوظيفة مستهدفة؟',
        answer:
          'Provide a representative vacancy or target role so the Cover Letter can reflect the most relevant experience and priorities within the published scope.',
        answerAr:
          'قدّم وظيفة ممثلة أو مسمى وظيفيًا مستهدفًا حتى يعكس خطاب التقديم الخبرات والأولويات الأكثر صلة ضمن النطاق المنشور.',
      },
      {
        question: 'Can I choose the document language?',
        questionAr: 'هل يمكنني اختيار لغة المستندات؟',
        answer:
          'Yes. Confirm the language stated for your selected package during checkout or through WhatsApp before work begins.',
        answerAr:
          'نعم. أكد اللغة المذكورة لباقة الخدمة المختارة أثناء الطلب أو عبر واتساب قبل بدء العمل.',
      },
    ],
  },
  'professional cv': {
    bestFor:
      'Professionals who need a standalone CV with clearer structure, stronger achievement positioning, and ATS-conscious content.',
    bestForAr:
      'للمهنيين الذين يحتاجون سيرة ذاتية مستقلة ببنية أوضح وعرض أقوى للإنجازات ومحتوى يراعي أنظمة تتبع المتقدمين.',
    preparation: [
      'Your existing CV, if available',
      'Employment, education, project, and certification details',
      'Examples of results and measurable achievements',
      'Your target role or a representative job description',
    ],
    process: [
      {
        title: 'Information review',
        description:
          'We review your career history, goals, and the information available for the CV.',
      },
      {
        title: 'Writing and structure',
        description:
          'Your experience is rewritten and organized for clarity, relevance, and easier scanning.',
      },
      {
        title: 'Review and delivery',
        description:
          'You review the completed CV and confirm that the agreed scope has been delivered.',
      },
    ],
    faqs: [
      {
        question: 'Can SANAD create a CV from my employment history?',
        questionAr: 'هل يمكن لسند إعداد سيرة ذاتية من تاريخي الوظيفي؟',
        answer:
          'Yes. Share your employment, education, achievements, and target role details. An existing CV is helpful but not required when complete information is available.',
        answerAr:
          'نعم. شارك تفاصيل الخبرات والتعليم والإنجازات والوظيفة المستهدفة. وجود سيرة حالية مفيد لكنه ليس ضروريًا عند توفر المعلومات الكاملة.',
      },
      {
        question: 'Which file formats will I receive?',
        questionAr: 'ما صيغ الملفات التي سأستلمها؟',
        answer:
          'The final file formats are confirmed with SANAD before work begins and delivered through the agreed WhatsApp conversation.',
        answerAr:
          'تؤكد سند صيغ الملفات النهائية قبل بدء العمل، ويتم التسليم عبر محادثة واتساب المتفق عليها.',
      },
    ],
  },
  'linkedin profile optimization': {
    bestFor:
      'Professionals who want a clearer LinkedIn headline, About section, experience narrative, and overall profile direction.',
    bestForAr:
      'للمهنيين الذين يريدون عنوانًا أوضح وملخصًا أقوى وسردًا أفضل للخبرات وتوجهًا مهنيًا متسقًا على LinkedIn.',
    preparation: [
      'Your LinkedIn profile link or current profile text',
      'Your target roles, industries, and professional direction',
      'Your current CV or a summary of your experience',
      'Key projects, results, strengths, and qualifications',
    ],
    process: [
      {
        title: 'Profile review',
        description:
          'We assess the current profile against your target professional direction.',
      },
      {
        title: 'Content optimization',
        description:
          'Core profile sections are refined to improve clarity, consistency, and career relevance.',
      },
      {
        title: 'Guidance and handover',
        description:
          'You receive the optimized content and practical guidance for improving the overall profile.',
      },
    ],
    importantNote:
      'The service covers the profile sections listed in the package scope. Any direct access or implementation arrangement must be confirmed separately with SANAD.',
    importantNoteAr:
      'تشمل الخدمة أقسام الملف المذكورة في نطاق الباقة. يجب تأكيد أي ترتيبات للوصول المباشر أو التنفيذ مع سند بشكل منفصل.',
    faqs: [
      {
        question: 'Which LinkedIn sections are improved?',
        questionAr: 'ما أقسام LinkedIn التي يتم تحسينها؟',
        answer:
          'The exact sections are the ones listed in the published package scope. SANAD reviews your current profile and target direction before preparing the content.',
        answerAr:
          'الأقسام المشمولة هي المذكورة في نطاق الباقة المنشور. تراجع سند ملفك الحالي واتجاهك المستهدف قبل إعداد المحتوى.',
      },
      {
        question: 'Do I receive ready-to-use profile text?',
        questionAr: 'هل سأستلم نصًا جاهزًا للاستخدام في الملف؟',
        answer:
          'SANAD confirms the delivery and implementation arrangement before work begins. Do not share account passwords unless direct access is separately agreed.',
        answerAr:
          'تؤكد سند آلية التسليم والتنفيذ قبل بدء العمل. لا تشارك كلمات مرور الحساب إلا إذا تم الاتفاق على الوصول المباشر بشكل منفصل.',
      },
    ],
  },
  'job application service': {
    bestFor:
      'Professionals who want structured support applying to suitable opportunities that match their agreed profile and goals.',
    bestForAr:
      'للمهنيين الذين يريدون دعمًا منظمًا للتقديم على فرص مناسبة تتوافق مع ملفهم المهني وأهدافهم المتفق عليها.',
    preparation: [
      'Your current CV and the target roles, industries, and locations you prefer',
      'Your work authorization, notice period, salary expectations, and other relevant preferences',
      'A reachable WhatsApp number and access to the email or verification steps you control',
      'Any job boards, companies, or opportunities you want SANAD to prioritise or avoid',
    ],
    process: [
      {
        title: 'Profile and preferences review',
        description:
          'We confirm your target profile and the details needed to identify suitable opportunities.',
      },
      {
        title: 'Suitable application support',
        description:
          'SANAD focuses on suitable opportunities and does not submit random applications simply to reach a number.',
      },
      {
        title: 'Updates and report',
        description:
          'You receive updates and a report of the suitable opportunities and applications handled during the agreed period.',
      },
    ],
    importantNote:
      'This service supports applications to suitable opportunities for up to 3 calendar days. It does not guarantee an interview, an offer, or employment, and you may need to complete OTP or email verification steps yourself.',
    importantNoteAr:
      'تدعم هذه الخدمة التقديم على الفرص المناسبة لمدة تصل إلى 3 أيام تقويمية. ولا تضمن مقابلة أو عرض عمل أو توظيفًا، وقد تحتاج إلى إكمال خطوات رمز التحقق لمرة واحدة أو التحقق عبر البريد بنفسك.',
    faqs: [
      {
        question: 'How long does the Job Application Service run?',
        questionAr: 'كم تستغرق خدمة التقديم على الوظائف؟',
        answer:
          'The service runs for up to 3 calendar days after SANAD receives the information and confirmations needed to begin. The timeline pauses while required information or verification is pending.',
        answerAr:
          'تستمر الخدمة لمدة تصل إلى 3 أيام تقويمية بعد أن تتلقى سند المعلومات والتأكيدات اللازمة للبدء. ويتوقف احتساب المدة عند انتظار معلومات أو تحقق مطلوب.',
      },
      {
        question: 'Will SANAD apply to every vacancy it finds?',
        questionAr: 'هل ستتقدم سند إلى كل وظيفة تجدها؟',
        answer:
          'No. SANAD focuses on suitable opportunities that match your agreed profile and preferences, rather than submitting random applications. The service does not guarantee a job, interview, or response from an employer.',
        answerAr:
          'لا. تركز سند على الفرص المناسبة لملفك وتفضيلاتك المتفق عليها بدلًا من إرسال طلبات عشوائية. ولا تضمن الخدمة وظيفة أو مقابلة أو ردًا من صاحب العمل.',
      },
      {
        question: 'Why might I need to complete an OTP or email verification?',
        questionAr: 'لماذا قد أحتاج إلى إكمال رمز تحقق أو تأكيد عبر البريد؟',
        answer:
          'Some job platforms require the candidate to verify a one-time code, email link, or account prompt. SANAD will contact you through WhatsApp when your action is needed.',
        answerAr:
          'تطلب بعض منصات التوظيف من المرشح تأكيد رمز لمرة واحدة أو رابط بريد إلكتروني أو تنبيه حساب. تتواصل سند معك عبر واتساب عندما تكون هناك خطوة مطلوبة منك.',
      },
    ],
  },
};

// Keep detail content available during deployments where the database still
// contains one of the previous catalog names.
PACKAGE_CONTENT['golden signature package'] =
  PACKAGE_CONTENT['premium full package'];
PACKAGE_CONTENT['career excellence package'] = PACKAGE_CONTENT['full package'];
PACKAGE_CONTENT['professional distinction package'] =
  PACKAGE_CONTENT['professional package'];

function getCommonFaqs(): PackageFaqItem[] {
  return [
    {
      question: 'What do you need from me to begin?',
      questionAr: 'ما المعلومات المطلوبة مني للبدء؟',
      answer:
        'Start with the preparation list on this page. SANAD will confirm any additional information required for your specific background and target role before work begins.',
      answerAr:
        'ابدأ بقائمة التحضير في هذه الصفحة. وتؤكد سند أي معلومات إضافية مطلوبة لخلفيتك المهنية ووظيفتك المستهدفة قبل بدء العمل.',
    },
    {
      question: 'Does this service guarantee interviews or employment?',
      questionAr: 'هل تضمن هذه الخدمة الحصول على مقابلات أو وظيفة؟',
      answer:
        'No. The service improves the clarity and presentation of your professional materials, but hiring decisions remain with employers and cannot be guaranteed.',
      answerAr:
        'لا. تحسن الخدمة وضوح وعرض مستنداتك المهنية، لكن قرارات التوظيف تبقى لدى أصحاب العمل ولا يمكن ضمانها.',
    },
  ];
}

export function getPackageDetailContent(
  packageItem: CareerPackage,
): PackageDetailContent {
  const specific = PACKAGE_CONTENT[packageItem.name.trim().toLowerCase()];

  if (specific) {
    return {
      ...specific,
      faqs: [...(specific.faqs ?? []), ...getCommonFaqs()],
    };
  }

  return {
    bestFor:
      'Professionals looking for focused support with the career-service deliverables listed in this package.',
    bestForAr:
      'للمهنيين الذين يبحثون عن دعم مركز في مخرجات الخدمات المهنية المذكورة في هذه الباقة.',
    preparation: [
      'Your current professional documents, if available',
      'Your employment, education, and qualification details',
      'Your target role, industry, or a representative vacancy',
      'Relevant achievements, projects, and priorities',
    ],
    process: [
      {
        title: 'Requirements review',
        description:
          'SANAD confirms your goals, available information, and the package scope.',
      },
      {
        title: 'Service development',
        description:
          'The included deliverables are prepared around the agreed professional direction.',
      },
      {
        title: 'Review and completion',
        description:
          'You review the work and confirm that the agreed scope has been delivered.',
      },
    ],
    faqs: getCommonFaqs(),
  };
}
