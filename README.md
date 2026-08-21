# أرمناز | ArmNaz 2.0

منصة خدمات مدينة أرمناز، مبنية Mobile First ومهيأة للعمل والتطوير من الهاتف فقط.

## ماذا أصبح في النسخة 2.0؟
- Frontend حديث متجاوب وPWA.
- Backend Express REST API.
- PostgreSQL schema منظم.
- Authentication ولوحة إدارة أولية فعلية.
- Rate limiting / Helmet / CORS.
- بحث حقيقي عبر API.
- عداد تسبيح يحفظ حالته على الهاتف.
- واجهات الطوارئ والمناوبات والطقس والأسعار والصلاة والأذكار.
- GitHub Actions للتحقق من البناء.
- توثيق واضح لمسار الهاتف فقط.

## تشغيل محلي/سحابي
انسخ `.env.example` إلى `.env` ثم شغّل قاعدة PostgreSQL، وبعدها:

```bash
npm install
npm run db:seed
npm run dev
```

للواجهة: `npm run --workspace frontend dev`.

## الإنتاج
يفضل استخدام PostgreSQL سحابية واستضافة سحابية للـAPI والواجهة. لا تعتمد على تشغيل قاعدة بيانات محلية على الهاتف.

## الحساب الإداري الأول
القيم الافتراضية في `.env.example` للتجربة فقط. غيّر `ADMIN_EMAIL` و`ADMIN_PASSWORD` و`JWT_SECRET` قبل النشر.
