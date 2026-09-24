# البدء السريع

نفّذ الأوامر التالية من مجلد `backend/`:

```bash
npm install
```

انسخ `.env.example` إلى `.env` واضبط `DATABASE_URL` والأسرار المطلوبة، ثم:

```bash
npm run db:migrate
npx prisma generate
npm run start:dev
```

شغّل PostgreSQL محليًا أو استخدم قاعدة PostgreSQL مُدارة، ثم اجعل
`DATABASE_URL` يشير إليها في ملف `.env`. لإنشاء أول مدير، اضبط
`ADMIN_EMAIL` و`ADMIN_PASSWORD` ثم شغّل `npm run db:seed-admin`.
