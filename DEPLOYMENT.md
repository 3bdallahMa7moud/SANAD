# دليل نشر SANAD على استضافة عامة

هذا الدليل غير مرتبط بـ Vercel أو Railway. الطريقة الموصى بها هي تشغيل
المشروع على خادم Linux يدعم Node.js وsystemd.

## البنية

- `web`: واجهة Next.js تعمل كخادم Node.js كامل، وليست Static Export.
- `api`: واجهة NestJS الخلفية.
- `postgres`: قاعدة PostgreSQL تعمل كخدمة نظام أو قاعدة مُدارة.
- `uploads`: تخزين دائم للملفات عند عدم استخدام R2/S3.
- `database_backups`: مجلد نسخ احتياطية خارج مستودع المشروع.
- Nginx أو Reverse Proxy مشابه: إنهاء HTTPS وتوجيه الدومينات إلى خدمات Node.js المحلية.

خدمتا Node.js ترتبطان بالمضيف على `127.0.0.1` فقط؛ لا يتم كشفهما أو
PostgreSQL مباشرة للإنترنت.

## متطلبات الخادم

- Linux حديث بذاكرة 2 GB على الأقل، ويفضل 4 GB للبناء على نفس الخادم.
- Node.js 20 أو أحدث وnpm.
- PostgreSQL 14 أو أحدث يعمل محليًا.
- systemd وrsync وcurl وعميل PostgreSQL (`pg_dump` و`pg_restore`).
- دومين يشير إلى الخادم.
- Nginx ووسيلة إصدار شهادة TLS مثل Certbot، أو Reverse Proxy مُدار.
- مساحة خارج الخادم لنسخ احتياطية دورية.

## 1. إعداد متغيرات الإنتاج

على الخادم، أنشئ ملف البيئة خارج المشروع:

```bash
sudo install -d -m 750 /etc/sanad
sudo cp backend/.env.production.example /etc/sanad/sanad.env
sudo chmod 640 /etc/sanad/sanad.env
```

استبدل كل قيمة `replace-with-*` واضبط على الأقل:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `PAYMENT_PROVIDER=manual`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_BASE_URL`، ويجب أن ينتهي بـ `/api/v1`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MEDIA_BASE_URL`
- `NEXT_PUBLIC_CHECKOUT_MODE=manual`
- مزود بريد عبر `RESEND_API_KEY` أو إعدادات `SMTP_*`

لاستخدام Gmail SMTP، اضبط `SMTP_HOST=smtp.gmail.com` و`SMTP_PORT=465` و`SMTP_SECURE=true`، ثم ضع عنوان حساب Google الكامل في `SMTP_USER` و**كلمة مرور تطبيق Google** في `SMTP_PASSWORD` (وليست كلمة مرور الحساب). يتطلب إنشاء كلمة مرور التطبيق تفعيل التحقق بخطوتين في الحساب. يرسل التطبيق افتراضيًا من `SMTP_USER`؛ استخدم `SMTP_FROM_EMAIL` فقط إذا كان العنوان مفعّلًا كاسم إرسال بديل في Gmail. يمكن ترك `RESEND_API_KEY` فارغًا، أو ضبطه كمزوّد احتياطي تلقائي عند فشل SMTP. بعد أي تعديل لبيانات البريد، أعد تشغيل خدمة `sanad-api` وأرسل رسالة اختبار إلى صندوق تملكه للتحقق من التسليم.

ولّد الأسرار بقيم عشوائية مختلفة، طول كل منها 32 بايت على الأقل. لا تحفظ ملف
`/etc/sanad/sanad.env` الحقيقي داخل Git.

إذا كانت الملفات ستُحفظ محليًا، اترك جميع متغيرات `R2_*` فارغة وسيستخدم
النظام المجلد `backend/uploads`. أما عند استخدام R2/S3، فيجب إدخال إعداداته كاملة.

متغيرات `NEXT_PUBLIC_*` تُدمج داخل الواجهة أثناء `npm run build`. أي تغيير
فيها يحتاج إعادة بناء الواجهة ثم نشرها، وليس مجرد إعادة تشغيل الخدمة.

## 2. إعداد خدمات Node.js

انسخ وحدات systemd الموجودة في المشروع، ثم فعّلها. يجب إنشاء مستخدم نظام
غير تفاعلي باسم `sanad` أولًا، وضبط ملكية `/opt/SANAD` و`/var/backups/sanad`
له حسب سياسة الخادم.

```bash
sudo install -m 644 deploy/native/sanad-api.service /etc/systemd/system/
sudo install -m 644 deploy/native/sanad-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sanad-api sanad-web
```

ضع ملف البيئة المكتمل في `/etc/sanad/sanad.env` بصلاحية قراءة مستخدم الخدمة
فقط. ابدأ من `backend/.env.production.example` وأضف متغيرات الواجهة العامة
من `frontend/.env.production.example` في الملف نفسه. تُقرأ القيم العامة عند
بناء الواجهة، لذلك يجب وجود الملف قبل أول نشر.

## 3. فحص الإعدادات والنشر

يفحص سكربت النشر بيئة الإنتاج، ويبني الـAPI والواجهة، وينشئ نسخة من قاعدة
البيانات، ثم يطبق مهاجرات Prisma ويعيد تشغيل خدمتي systemd:

```bash
sudo INSTALL_DEPENDENCIES=1 ./deploy/deploy-prelaunch.sh
```

تُشغّل خدمة الـAPI فحص بيئة الإنتاج و`prisma migrate deploy` كذلك قبل بدء
التطبيق. إذا كانت قيمة ناقصة أو غير آمنة فسيتوقف النشر بدل تشغيل إعداد غير صالح.

تحقق من الخدمات:

```bash
sudo systemctl status sanad-api sanad-web --no-pager
```

تحقق محليًا على الخادم:

```bash
curl --fail http://127.0.0.1:3001/api/v1/health/live
curl --fail http://127.0.0.1:3001/api/v1/health/ready
curl --fail http://127.0.0.1:3000/
```

## 4. إعداد Nginx وHTTPS

يوجد نموذج في `deploy/nginx/sanad.conf.example`. انسخه إلى إعدادات Nginx، واستبدل `example.com` بالدومين الحقيقي، ثم اختبر الإعداد قبل إعادة التحميل:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

بعدها فعّل شهادة TLS بالطريقة المناسبة للاستضافة. لا تفتح الموقع للمستخدمين قبل عمل HTTPS وإعادة توجيه HTTP إلى HTTPS.

نموذج Nginx يعطّل buffering للواجهة لدعم Streaming في Next.js، ويحدد حجم الطلب بما يناسب حد رفع الملفات الحالي.

## 5. البيانات الأولية وحساب الإدارة

المهاجرات تعمل تلقائيًا، لكن يجب التأكد مرة واحدة من وجود الباقات المطلوبة وحساب `super_admin`. نفّذ أوامر الـseed فقط بعد مراجعة أنها لن تستبدل بيانات موجودة:

شغّل أوامر الـseed من مجلد `backend/` باستخدام مستخدم الخدمة وبيئة الإنتاج
التي تتضمن `DATABASE_URL` الصحيح.

## 6. النسخ الاحتياطي

لإنشاء نسخة في مجلد النسخ الاحتياطي الدائم (`/var/backups/sanad` افتراضيًا):

```bash
sudo -u sanad sh -c 'cd /opt/SANAD/backend && npm run db:backup'
```

النسخة وحدها على نفس الخادم لا تكفي. انسخ ملفات `.dump` و`.sha256` دوريًا إلى Object Storage أو خادم آخر، وفعّل Cron أو أداة النسخ الخاصة بمزوّد الاستضافة.

اختبر الاستعادة دوريًا على قاعدة منفصلة فقط:

```bash
cd /opt/SANAD/backend
RESTORE_CONFIRM=restore-test-database \
RESTORE_DATABASE_URL=postgresql://user:password@test-db:5432/sanad_restore \
npm run db:restore:check -- /var/backups/sanad/backup-file.dump
```

السكريبت يرفض الاستعادة إذا كانت قاعدة الاختبار هي نفس قاعدة الإنتاج.

## 7. تحديث نسخة منشورة

```bash
git pull --ff-only
sudo ./deploy/deploy-prelaunch.sh
```

راجع حالة الخدمات والـlogs بعد كل تحديث:

```bash
sudo systemctl status sanad-api sanad-web --no-pager
sudo journalctl -u sanad-api -u sanad-web -n 200 --no-pager
```

## 8. بوابة القبول قبل فتح الموقع

- كل اختبارات Backend وFrontend ناجحة.
- `npm audit --omit=dev` لا يعرض ثغرات عالية أو حرجة.
- `/health/live` و`/health/ready` يعملان من الدومين النهائي.
- التسجيل وتسجيل الدخول والتحقق بالبريد تعمل برسائل حقيقية.
- CORS يسمح للدومين النهائي فقط.
- رفع ملف وتنزيله ينجحان، ويظل الملف موجودًا بعد إعادة تشغيل الخدمات.
- حساب العميل لا يستطيع الوصول إلى لوحة الإدارة.
- إنشاء طلب جديد ينتهي بحالة `pending_payment` ويعرض زر واتساب، ولا ينشئ دفعة صفرية أو يفتح صفحة البطاقة/Apple Pay.
- صفحة `/checkout/pay` تعيد 404 في وضع `manual` مع بقاء كودها محفوظًا لإعادة تفعيل بوابة الدفع لاحقًا.
- تأكيد الدفع من تفاصيل الطلب في لوحة الإدارة لا ينجح إلا بعد إدخال مبلغ يطابق إجمالي الطلب، ويظهر بعدها في الإيرادات والعملاء المشترين وسجل النشاط.
- لا يمكن تحويل الطلب يدويًا إلى `paid` من قائمة الحالات، ولا إكماله أو فتح التقييم دون دفعة موجبة مؤكدة.
- النسخ الاحتياطي يعمل وتم اختبار الاستعادة على قاعدة منفصلة.
- `SWAGGER_ENABLED=false` و`TRUST_PROXY=1` خلف الـReverse Proxy.
- لا توجد متغيرات Demo أو أسرار افتراضية.
- Sentry أو نظام مراقبة بديل يستقبل الأخطاء، مع مراقبة دورية للـhealth endpoint.

## ملاحظات التوسع

الإعداد الحالي مناسب لخادم واحد. عند تشغيل أكثر من نسخة من Next.js أو الـAPI خلف Load Balancer، أضف Cache مشتركًا مثل Redis، واضبط `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` وDeployment ID موحدين، ونسّق عمليات background workers حتى لا تعمل المهمة نفسها في أكثر من نسخة.
