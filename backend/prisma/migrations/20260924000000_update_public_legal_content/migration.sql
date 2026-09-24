-- Update only the published CMS sources that override the legal-page fallback
-- content. Existing page IDs, Admin ownership, and page activation are kept.
UPDATE "pages"
SET
  "title_en" = 'Terms & Conditions',
  "title_ar" = 'الشروط والأحكام',
  "meta_description_en" = 'Terms for SANAD professional career services, WhatsApp delivery, revisions, refunds, and job application support.',
  "meta_description_ar" = 'شروط خدمات سند المهنية والتسليم عبر واتساب والتعديلات والاسترداد وخدمة التقديم على الوظائف.',
  "content_en" = $$
<h2>Acceptance of Terms</h2>
<p>By placing an order or using the SANAD platform you agree to these Terms &amp; Conditions and our Privacy Policy. If you do not agree with any provision, please do not proceed with an order.</p>
<h2>Services</h2>
<p>SANAD provides Professional CV writing, role-specific Cover Letters, LinkedIn Profile Optimization, the UAE Job Application Guide, and Job Application Service. The exact deliverables, language, price, delivery period, and revision allowance are displayed before the customer confirms the order.</p>
<h2>WhatsApp Communication and Delivery</h2>
<p>After the order and payment are confirmed, SANAD uses the official WhatsApp conversation to collect the required information and coordinate the service. Drafts, final files, revisions, and service reports are delivered through WhatsApp. The customer dashboard currently provides order tracking only.</p>
<h2>Delivery Timelines</h2>
<p>The delivery or service period begins after payment is confirmed and SANAD receives all information, documents, approvals, and verification steps required to begin. The timeline pauses while SANAD is waiting for information, documents, approval, OTP verification, email verification, or another required action from the customer.</p>
<h2>Revisions</h2>
<p>A revision round means one consolidated set of feedback submitted by the client after reviewing the delivered draft. Revisions apply only within the original agreed scope and do not include changing the service into a different document, language, target role, or career direction.</p>
<p>LinkedIn Profile Optimization includes revision support until final approval within the originally agreed profile scope. The Job Application Service does not include revision rounds.</p>
<h2>Job Application Service</h2>
<p>By purchasing the Job Application Service, the customer authorizes SANAD to use the supplied CV and relevant information to search for reasonably suitable opportunities and submit applications on the customer’s behalf. The service covers up to 60 suitable applications and ends when either 60 suitable applications have been submitted or 30 calendar days have passed, whichever occurs first.</p>
<p>Applications may be submitted through relevant UAE job platforms, recruitment websites, employer career portals, and other appropriate channels. LinkedIn, Bayt, Indeed UAE, Naukrigulf, and GulfTalent are examples and do not represent an exclusive platform list.</p>
<p>The customer is responsible for the accuracy of all supplied information and may need to complete OTP, email verification, account access, or another candidate-only step. SANAD is not responsible for platform outages, expired vacancies, employer decisions, delayed employer responses, or the availability of suitable opportunities. Irrelevant applications will not be submitted merely to reach the maximum number.</p>
<p>The application report is delivered through WhatsApp and records the company, job title, job URL, date applied, application status, platform or source, and relevant notes. It does not provide live employer tracking.</p>
<h2>Refund Policy</h2>
<p>A full refund may be requested before SANAD begins work. Work begins when SANAD starts reviewing customer materials, writing or editing documents, preparing LinkedIn content, searching for job opportunities, or submitting applications.</p>
<p>After work begins, a change of mind alone does not entitle the customer to a refund. Any included revision rights remain available within the original agreed scope. If SANAD cannot provide an agreed service, the amount relating to the undelivered service will be refunded. Duplicate or accidental duplicate payments will also be refunded.</p>
<p>Customer delays pause the delivery timeline while SANAD awaits required information, documents, approvals, or verification. For the Job Application Service, the absence of interviews, job offers, or employment does not create a refund entitlement after work has started.</p>
<h2>Employment Disclaimer</h2>
<p>SANAD does not guarantee interviews, job offers, or employment. Hiring decisions are made entirely by employers and recruiters.</p>
$$,
  "content_ar" = $$
<h2>قبول الشروط</h2>
<p>بتقديم طلب أو استخدام منصة سند، فإنك توافق على هذه الشروط والأحكام وسياسة الخصوصية. إذا لم توافق على أي بند، يرجى عدم متابعة الطلب.</p>
<h2>الخدمات</h2>
<p>تقدم سند خدمات مهنية تشمل كتابة السيرة الذاتية الاحترافية، وخطابات التقديم المخصصة لوظائف مستهدفة، وتحسين ملف LinkedIn، ودليل التقديم على الوظائف في الإمارات، وخدمة التقديم على الوظائف. تظهر المخرجات واللغة والسعر ومدة التسليم وعدد التعديلات قبل تأكيد الطلب.</p>
<h2>التواصل والتسليم عبر واتساب</h2>
<p>بعد تأكيد الطلب والدفع، تستخدم سند محادثة واتساب الرسمية لجمع المعلومات المطلوبة وتنسيق تنفيذ الخدمة. يتم تسليم المسودات والملفات النهائية والتعديلات وتقارير الخدمة عبر واتساب. وتوفر لوحة حساب العميل حاليًا متابعة حالة الطلب فقط.</p>
<h2>مواعيد التسليم</h2>
<p>تبدأ مدة التسليم أو تنفيذ الخدمة بعد تأكيد الدفع واستلام سند لجميع المعلومات والمستندات والموافقات وخطوات التحقق المطلوبة للبدء. وتتوقف المدة مؤقتًا أثناء انتظار معلومات أو مستندات أو موافقة أو رمز OTP أو تأكيد بريد إلكتروني أو أي إجراء مطلوب من العميل.</p>
<h2>التعديلات</h2>
<p>تعني جولة التعديل مجموعة موحدة من الملاحظات يرسلها العميل بعد مراجعة المسودة المستلمة. تنطبق التعديلات داخل النطاق المتفق عليه أصلًا، ولا تشمل تحويل الخدمة إلى مستند أو لغة أو وظيفة مستهدفة أو اتجاه مهني مختلف.</p>
<p>تشمل خدمة تحسين ملف LinkedIn دعم التعديل حتى الاعتماد النهائي ضمن نطاق الملف المتفق عليه أصلًا. ولا تشمل خدمة التقديم على الوظائف جولات تعديل.</p>
<h2>خدمة التقديم على الوظائف</h2>
<p>بشراء خدمة التقديم على الوظائف، يفوض العميل سند باستخدام السيرة الذاتية والمعلومات ذات الصلة للبحث عن فرص مناسبة بصورة معقولة وتقديم الطلبات بالنيابة عنه. تشمل الخدمة حتى 60 طلب توظيف مناسبًا، وتنتهي عند إتمام 60 طلبًا مناسبًا أو مرور 30 يومًا تقويميًا، أيهما يحدث أولًا.</p>
<p>يجوز تنفيذ الطلبات من خلال منصات التوظيف الإماراتية المناسبة، ومواقع التوظيف، وبوابات الشركات، وقنوات التقديم الملائمة الأخرى. وتُعد LinkedIn وBayt وIndeed UAE وNaukrigulf وGulfTalent أمثلة وليست قائمة حصرية.</p>
<p>يتحمل العميل مسؤولية دقة المعلومات التي يقدمها، وقد يحتاج إلى إتمام رمز OTP أو تأكيد البريد الإلكتروني أو الدخول إلى حسابه أو أي خطوة شخصية أخرى. لا تتحمل سند مسؤولية أعطال المنصات أو انتهاء صلاحية الوظائف أو قرارات أصحاب العمل أو تأخر الردود أو عدم توفر عدد كافٍ من الفرص المناسبة. ولن يتم إرسال طلبات غير ملائمة لمجرد الوصول إلى الحد الأقصى.</p>
<p>يُسلّم تقرير التقديم عبر واتساب ويتضمن الشركة والمسمى الوظيفي ورابط الوظيفة وتاريخ التقديم وحالة الطلب والمنصة أو المصدر والملاحظات ذات الصلة. ولا يمثل التقرير نظام متابعة مباشرًا مع جهة التوظيف.</p>
<h2>سياسة الاسترداد</h2>
<p>يمكن طلب استرداد كامل للمبلغ قبل أن تبدأ سند العمل. يبدأ العمل عندما تبدأ سند في مراجعة مستندات العميل، أو كتابة المستندات أو تعديلها، أو إعداد محتوى LinkedIn، أو البحث عن فرص وظيفية، أو تقديم طلبات التوظيف.</p>
<p>بعد بدء العمل، لا يمنح تغيير رأي العميل وحده حقًا في استرداد المبلغ. وتظل التعديلات المشمولة متاحة داخل النطاق المتفق عليه أصلًا. إذا تعذر على سند تقديم خدمة متفق عليها، يُسترد المبلغ الخاص بالجزء الذي لم يتم تنفيذه. كما تُسترد الدفعات المكررة أو التي تم دفعها بالخطأ مرتين.</p>
<p>تؤدي تأخيرات العميل إلى إيقاف مدة التسليم مؤقتًا أثناء انتظار المعلومات أو المستندات أو الموافقات أو خطوات التحقق المطلوبة. وبالنسبة لخدمة التقديم على الوظائف، لا يؤدي عدم الحصول على مقابلات أو عروض وظيفية أو وظيفة إلى استحقاق استرداد المبلغ بعد بدء العمل.</p>
<h2>إخلاء مسؤولية التوظيف</h2>
<p>لا تضمن سند الحصول على مقابلة أو عرض وظيفي أو وظيفة، حيث تخضع قرارات التوظيف بالكامل للشركات وجهات التوظيف.</p>
$$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" = 'terms-and-conditions';

UPDATE "pages"
SET
  "title_en" = 'Privacy Policy',
  "title_ar" = 'سياسة الخصوصية',
  "meta_description_en" = 'How SANAD uses personal and professional information to deliver career and UAE job application services.',
  "meta_description_ar" = 'كيف تستخدم سند المعلومات الشخصية والمهنية لتقديم الخدمات المهنية وخدمة التقديم على الوظائف في الإمارات.',
  "content_en" = $$
<h2>Information We Collect</h2>
<p>SANAD may collect the customer’s name, email address, phone number, CV, employment and education history, qualifications, skills, target roles, preferred language, LinkedIn profile information, order details, and other information supplied for the purchased service.</p>
<h2>How We Use Your Data</h2>
<p>Information is used to manage orders, communicate through WhatsApp, prepare CVs and Cover Letters, optimize LinkedIn profiles, provide the UAE Job Application Guide, perform the Job Application Service when purchased, process payments, provide revisions, and deliver service reports.</p>
<h2>Job Application Service Data Sharing</h2>
<p>When the Job Application Service is purchased, SANAD may share the customer’s CV and relevant application information with employers, recruiters, recruitment websites, job platforms, and employer career portals solely to search for suitable opportunities and submit authorized applications.</p>
<p>SANAD uses only the information reasonably required for the relevant application. The customer remains responsible for ensuring that the supplied information is complete and accurate.</p>
<h2>WhatsApp and Service Providers</h2>
<p>SANAD uses WhatsApp as its primary communication and delivery channel. Information sent through WhatsApp is also subject to WhatsApp’s applicable privacy terms.</p>
<p>SANAD may use service providers required for website hosting, email delivery, file storage, payment processing, technical support, and customer communication. Information is shared only as reasonably necessary for those services.</p>
<h2>Data Access and Security</h2>
<p>Access to customer information is limited to team members and service providers who need it to perform or support the purchased service. No method of online transmission or storage can be guaranteed to be completely secure.</p>
<h2>Retention and Deletion</h2>
<p>SANAD retains order, communication, payment, and service records for as long as reasonably necessary to provide the service, resolve disputes, maintain business records, and meet applicable obligations.</p>
<p>Customers may contact SANAD to request access to, correction of, or deletion of eligible personal information. Some information may need to be retained where reasonably required for payment, fraud prevention, recordkeeping, dispute resolution, or legal obligations.</p>
<h2>Contact</h2>
<p>For privacy questions or requests, contact SANAD through the official WhatsApp number published on the website. The published support email may also be used as a secondary contact method.</p>
$$,
  "content_ar" = $$
<h2>المعلومات التي نجمعها</h2>
<p>قد تجمع سند اسم العميل وبريده الإلكتروني ورقم هاتفه وسيرته الذاتية وتاريخه الوظيفي والتعليمي ومؤهلاته ومهاراته والوظائف المستهدفة واللغة المختارة ومعلومات ملف LinkedIn وبيانات الطلب وأي معلومات أخرى يقدمها لتنفيذ الخدمة المشتراة.</p>
<h2>كيف نستخدم معلوماتك</h2>
<p>تُستخدم المعلومات لإدارة الطلبات والتواصل عبر واتساب وإعداد السير الذاتية وخطابات التقديم وتحسين ملفات LinkedIn وتوفير دليل التقديم على الوظائف في الإمارات وتنفيذ خدمة التقديم على الوظائف عند شرائها ومعالجة المدفوعات وتقديم التعديلات وتسليم تقارير الخدمة.</p>
<h2>مشاركة بيانات خدمة التقديم على الوظائف</h2>
<p>عند شراء خدمة التقديم على الوظائف، يجوز لسند مشاركة السيرة الذاتية ومعلومات التقديم ذات الصلة مع أصحاب العمل ومسؤولي التوظيف ومواقع ومنصات التوظيف وبوابات الشركات، وذلك فقط للبحث عن فرص مناسبة وتقديم الطلبات التي فوض العميل سند بتنفيذها.</p>
<p>تستخدم سند المعلومات اللازمة بصورة معقولة لكل طلب، ويظل العميل مسؤولًا عن اكتمال ودقة المعلومات المقدمة.</p>
<h2>واتساب ومزودو الخدمات</h2>
<p>تستخدم سند واتساب كقناة أساسية للتواصل والتسليم. وتخضع المعلومات المرسلة عبر واتساب كذلك لشروط الخصوصية المطبقة لدى واتساب.</p>
<p>قد تستخدم سند مزودي خدمات للاستضافة وإرسال البريد الإلكتروني وتخزين الملفات ومعالجة المدفوعات والدعم التقني والتواصل مع العملاء. ولا تُشارك المعلومات إلا بالقدر اللازم بصورة معقولة لتقديم هذه الخدمات.</p>
<h2>الوصول إلى البيانات وأمنها</h2>
<p>يقتصر الوصول إلى معلومات العملاء على أعضاء الفريق ومزودي الخدمات الذين يحتاجون إليها لتنفيذ الخدمة المشتراة أو دعمها. ولا يمكن ضمان الأمان الكامل لأي وسيلة نقل أو تخزين إلكتروني.</p>
<h2>الاحتفاظ بالبيانات وحذفها</h2>
<p>تحتفظ سند بسجلات الطلبات والتواصل والمدفوعات والخدمات للمدة اللازمة بصورة معقولة لتقديم الخدمة وحل النزاعات والاحتفاظ بسجلات الأعمال والوفاء بالالتزامات المطبقة.</p>
<p>يمكن للعملاء التواصل مع سند لطلب الوصول إلى معلوماتهم الشخصية المؤهلة أو تصحيحها أو حذفها. وقد يلزم الاحتفاظ ببعض المعلومات لأغراض المدفوعات أو منع الاحتيال أو حفظ السجلات أو حل النزاعات أو الوفاء بالالتزامات القانونية.</p>
<h2>التواصل</h2>
<p>للأسئلة أو الطلبات المتعلقة بالخصوصية، تواصل مع سند عبر رقم واتساب الرسمي المنشور على الموقع. ويمكن استخدام بريد الدعم المنشور كوسيلة تواصل ثانوية.</p>
$$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" = 'privacy-policy';
