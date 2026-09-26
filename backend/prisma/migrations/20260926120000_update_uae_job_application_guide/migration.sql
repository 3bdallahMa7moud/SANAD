UPDATE "packages"
SET
  "description_ar" = 'دليل عملي متكامل يساعدك على البحث والتقديم على الوظائف في الإمارات بطريقة منظمة، من اختيار منصات التوظيف المناسبة وحتى متابعة طلباتك بعد التقديم.',
  "description_en" = 'A comprehensive practical guide that helps you search and apply for jobs in the UAE in a structured way, from choosing suitable recruitment platforms and sources to following up on your applications.',
  "features_ar" = jsonb_build_array(
    'شرح عملي لأهم منصات التوظيف في الإمارات وكيفية استخدامها',
    'حوالي 15 قناة ومصدر للتوظيف بين منصات، وشركات، ووكالات توظيف، وبوابات حكومية',
    'شرح تفصيلي لـ LinkedIn وBayt وGulfTalent وNaukrigulf وIndeed UAE',
    'طريقة التقديم المباشر عبر مواقع الشركات والبريد الإلكتروني',
    'دليل لأهم وكالات التوظيف والبوابات الحكومية',
    'كلمات وأساليب بحث تساعدك على الوصول إلى وظائف مناسبة لتخصصك',
    'كيفية معرفة ما إذا كانت الوظيفة مناسبة لك قبل التقديم',
    'طريقة المتابعة الصحيحة بعد إرسال الطلب',
    'علامات تحذيرية لتجنب عروض التوظيف الوهمية',
    'خطة أسبوعية عملية لتنظيم عملية البحث والتقديم',
    'نماذج جاهزة لبريد التقديم وبريد المتابعة',
    'جدول لتتبع طلبات التوظيف وروابط وصول سريع للمنصات'
  ),
  "features_en" = jsonb_build_array(
    'Practical guidance to the leading UAE job platforms and how to use them',
    'Around 15 recruitment channels and sources across platforms, companies, agencies, and government portals',
    'Detailed guidance for LinkedIn, Bayt, GulfTalent, Naukrigulf, and Indeed UAE',
    'Direct application methods through company career websites and email',
    'A guide to leading recruitment agencies and government employment portals',
    'Search terms and methods for finding roles relevant to your specialization',
    'How to assess whether a vacancy is suitable before applying',
    'The right way to follow up after submitting an application',
    'Job scam red flags for avoiding fraudulent employment offers',
    'A practical weekly plan for organizing your job search and applications',
    'Ready-to-use Application Email and Follow-up Email templates',
    'An application tracking table and quick-access links to recruitment platforms'
  ),
  "updated_at" = CURRENT_TIMESTAMP
WHERE LOWER("name_en") IN (
  'uae job application guide',
  'job application file'
)
OR "name_ar" IN (
  'دليل التقديم على الوظائف في الإمارات',
  'ملف التقديم على الوظائف'
);
