-- Align the Job Application Service data and published legal copy with the
-- direct email-outreach workflow. Pricing, delivery days, and package images
-- are intentionally unchanged.
UPDATE "packages"
SET
  "description_ar" = 'تراجع سند سيرتك الذاتية، وتحدد الشركات والفرص الوظيفية المناسبة لخبرتك ومؤهلاتك، ثم تُعد رسالة تقديم احترافية باللغة الإنجليزية وترسل سيرتك الذاتية مباشرة إلى ما يصل إلى 60 شركة مناسبة باستخدام حساب بريدك الإلكتروني.',
  "description_en" = 'SANAD reviews your CV, identifies suitable companies and relevant job opportunities, prepares a professional English application email, and sends your CV directly to up to 60 suitable companies using your email account.',
  "features_ar" = jsonb_build_array(
    'مراجعة السيرة والملف المهني — نراجع سيرتك الذاتية لفهم خبرتك وتحديد الوظائف المستهدفة المناسبة',
    'البحث عن الفرص المناسبة — نبحث عن الشركات والوظائف المناسبة عبر مصادر التوظيف الرئيسية وصفحات التوظيف الرسمية للشركات',
    'حتى 60 شركة مناسبة — نحدد ما يصل إلى 60 شركة مناسبة وفقًا لخلفيتك المهنية والفرص المتاحة',
    'رسالة تقديم احترافية — نُعد رسالة بريد إلكتروني احترافية باللغة الإنجليزية للتقديم على الوظائف',
    'التواصل والتقديم — نرسل سيرتك الذاتية ورسالة التقديم مباشرة إلى الشركات المختارة باستخدام حساب بريدك الإلكتروني'
  ),
  "features_en" = jsonb_build_array(
    'CV & Profile Review — We review your CV to understand your experience and suitable target roles',
    'Relevant Opportunity Research — We research suitable companies and vacancies through major recruitment sources and official company career websites',
    'Up to 60 Suitable Companies — We identify up to 60 suitable companies based on your professional background and available opportunities',
    'Professional Application Email — We prepare a professional English email for job applications',
    'Application Outreach — We send your CV and application email directly to selected companies using your email account'
  ),
  "updated_at" = CURRENT_TIMESTAMP
WHERE LOWER("name_en") = 'job application service';

UPDATE "pages"
SET
  "content_en" = REPLACE(
    REPLACE(
      REPLACE(
        "content_en",
        $$<p>By purchasing the Job Application Service, the customer authorizes SANAD to use the supplied CV and relevant information to search for reasonably suitable opportunities and submit applications on the customer’s behalf. The service covers up to 60 suitable applications and ends when either 60 suitable applications have been submitted or 3 calendar days have passed, whichever occurs first.</p>$$,
        $$<p>By purchasing the Job Application Service, the customer authorizes SANAD to review the supplied CV and relevant information, identify suitable companies and available opportunities, prepare a professional English application email, and send the customer’s CV directly to up to 60 suitable companies using the customer’s email account. The service period is up to 3 calendar days.</p>$$
      ),
      $$<p>Applications may be submitted through relevant UAE job platforms, recruitment websites, employer career portals, and other appropriate channels. LinkedIn, Bayt, Indeed UAE, Naukrigulf, and GulfTalent are examples and do not represent an exclusive platform list.</p>$$,
      $$<p>LinkedIn, Bayt, Indeed, Naukrigulf, official company career websites, and other relevant recruitment sources may be used to research suitable companies and opportunities. SANAD does not submit applications directly through those platforms as part of this service; the application outreach is sent directly by email.</p>$$
    ),
    $$<p>The customer is responsible for the accuracy of all supplied information and may need to complete OTP, email verification, account access, or another candidate-only step. SANAD is not responsible for platform outages, expired vacancies, employer decisions, delayed employer responses, or the availability of suitable opportunities. Irrelevant applications will not be submitted merely to reach the maximum number.</p>$$,
    $$<p>Companies are selected according to the customer’s CV, experience, qualifications, preferences, and suitable available opportunities. Outreach is not sent randomly. The service deliverable is the outreach performed by SANAD and does not include a separate file, report, or downloadable document. SANAD does not guarantee interviews, responses, job offers, or employment.</p>$$
  ),
  "content_ar" = REPLACE(
    REPLACE(
      REPLACE(
        "content_ar",
        $$<p>بشراء خدمة التقديم على الوظائف، يفوض العميل سند باستخدام السيرة الذاتية والمعلومات ذات الصلة للبحث عن فرص مناسبة بصورة معقولة وتقديم الطلبات بالنيابة عنه. تشمل الخدمة حتى 60 طلب توظيف مناسبًا، وتنتهي عند إتمام 60 طلبًا مناسبًا أو مرور 3 أيام تقويمية، أيهما يحدث أولًا.</p>$$,
        $$<p>بشراء خدمة التقديم على الوظائف، يفوض العميل سند بمراجعة السيرة الذاتية والمعلومات ذات الصلة، وتحديد الشركات والفرص المتاحة المناسبة، وإعداد رسالة تقديم احترافية باللغة الإنجليزية، وإرسال سيرة العميل الذاتية مباشرة إلى ما يصل إلى 60 شركة مناسبة باستخدام حساب بريده الإلكتروني. وتصل مدة تنفيذ الخدمة إلى 3 أيام تقويمية.</p>$$
      ),
      $$<p>يجوز تنفيذ الطلبات من خلال منصات التوظيف الإماراتية المناسبة، ومواقع التوظيف، وبوابات الشركات، وقنوات التقديم الملائمة الأخرى. وتُعد LinkedIn وBayt وIndeed UAE وNaukrigulf وGulfTalent أمثلة وليست قائمة حصرية.</p>$$,
      $$<p>قد تُستخدم LinkedIn وBayt وIndeed وNaukrigulf وصفحات التوظيف الرسمية للشركات وغيرها من مصادر التوظيف المناسبة للبحث عن الشركات والفرص الملائمة. ولا تقدم سند الطلبات مباشرة عبر هذه المنصات ضمن هذه الخدمة؛ بل يُرسل التواصل والتقديم مباشرة عبر البريد الإلكتروني.</p>$$
    ),
    $$<p>يتحمل العميل مسؤولية دقة المعلومات التي يقدمها، وقد يحتاج إلى إتمام رمز OTP أو تأكيد البريد الإلكتروني أو الدخول إلى حسابه أو أي خطوة شخصية أخرى. لا تتحمل سند مسؤولية أعطال المنصات أو انتهاء صلاحية الوظائف أو قرارات أصحاب العمل أو تأخر الردود أو عدم توفر عدد كافٍ من الفرص المناسبة. ولن يتم إرسال طلبات غير ملائمة لمجرد الوصول إلى الحد الأقصى.</p>$$,
    $$<p>تُختار الشركات وفق سيرة العميل الذاتية وخبرته ومؤهلاته وتفضيلاته والفرص المناسبة المتاحة، ولا يُرسل التواصل عشوائيًا. مخرج الخدمة هو التواصل والتقديم الذي تنفذه سند، ولا يشمل ملفًا أو تقريرًا أو مستندًا منفصلًا قابلًا للتنزيل. ولا تضمن سند مقابلات أو ردودًا أو عروض عمل أو توظيفًا.</p>$$
  ),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" = 'terms-and-conditions';

UPDATE "pages"
SET
  "content_en" = REPLACE(
    REPLACE(
      "content_en",
      $$<p>Information is used to manage orders, communicate through WhatsApp, prepare CVs and Cover Letters, optimize LinkedIn profiles, provide the UAE Job Application Guide, perform the Job Application Service when purchased, process payments, provide revisions, and deliver service reports.</p>$$,
      $$<p>Information is used to manage orders, communicate through WhatsApp, prepare CVs and Cover Letters, optimize LinkedIn profiles, provide the UAE Job Application Guide, perform the Job Application Service when purchased, process payments, provide revisions, and coordinate service updates.</p>$$
    ),
    $$<p>When the Job Application Service is purchased, SANAD may share the customer’s CV and relevant application information with employers, recruiters, recruitment websites, job platforms, and employer career portals solely to search for suitable opportunities and submit authorized applications.</p>$$,
    $$<p>When the Job Application Service is purchased, SANAD uses the customer’s email account to send the CV and the application information reasonably required directly to selected companies, employers, or recruiters.</p><p>Recruitment platforms, official company career websites, and other relevant sources may be used to research suitable opportunities and companies. SANAD does not submit applications directly through those platforms as part of this service.</p>$$
  ),
  "content_ar" = REPLACE(
    REPLACE(
      "content_ar",
      $$<p>تُستخدم المعلومات لإدارة الطلبات والتواصل عبر واتساب وإعداد السير الذاتية وخطابات التقديم وتحسين ملفات LinkedIn وتوفير دليل التقديم على الوظائف في الإمارات وتنفيذ خدمة التقديم على الوظائف عند شرائها ومعالجة المدفوعات وتقديم التعديلات وتسليم تقارير الخدمة.</p>$$,
      $$<p>تُستخدم المعلومات لإدارة الطلبات والتواصل عبر واتساب وإعداد السير الذاتية وخطابات التقديم وتحسين ملفات LinkedIn وتوفير دليل التقديم على الوظائف في الإمارات وتنفيذ خدمة التقديم على الوظائف عند شرائها ومعالجة المدفوعات وتقديم التعديلات وتنسيق تحديثات الخدمة.</p>$$
    ),
    $$<p>عند شراء خدمة التقديم على الوظائف، يجوز لسند مشاركة السيرة الذاتية ومعلومات التقديم ذات الصلة مع أصحاب العمل ومسؤولي التوظيف ومواقع ومنصات التوظيف وبوابات الشركات، وذلك فقط للبحث عن فرص مناسبة وتقديم الطلبات التي فوض العميل سند بتنفيذها.</p>$$,
    $$<p>عند شراء خدمة التقديم على الوظائف، تستخدم سند حساب البريد الإلكتروني الخاص بالعميل لإرسال سيرته الذاتية ومعلومات التقديم اللازمة بصورة معقولة مباشرة إلى الشركات أو أصحاب العمل أو مسؤولي التوظيف المختارين.</p><p>قد تُستخدم منصات التوظيف وصفحات التوظيف الرسمية للشركات وغيرها من المصادر المناسبة للبحث عن الفرص والشركات الملائمة. ولا تقدم سند الطلبات مباشرة عبر تلك المنصات ضمن هذه الخدمة.</p>$$
  ),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" = 'privacy-policy';
