# أرمناز الخدمي — Firebase + البيانات الحقيقية

هذه النسخة تحافظ على واجهة 3D نفسها، وتضيف Firebase Firestore + Firebase Authentication + Offline cache.

## 1) إنشاء Firebase
1. افتح Firebase Console وأنشئ Project.
2. أضف Web App.
3. انسخ إعدادات Web App إلى `firebase-config.js`.
4. من Authentication فعّل **Email/Password**.
5. أنشئ مستخدم المدير من Authentication.

## 2) إعطاء المدير صلاحية admin
قواعد Firestore في `firestore.rules` تستخدم Custom Claim اسمها `admin`.
يجب تعيين claim للمستخدم من بيئة آمنة باستخدام Firebase Admin SDK:
`admin: true`

لا تضع Service Account Key داخل GitHub.

## 3) Firestore
أنشئ البيانات التالية (أو دع لوحة الإدارة تنشئها):
- `settings/rates`
  - `usdSyp`
  - `trySyp`
  - `usdTry`
  - `updatedAt`
- `settings/pharmacy`
  - `name`
  - `pharmacist`
  - `phone`
- `settings/emergency`
  - `الشرطة`
  - `الإسعاف`
  - `الدفاع المدني`
  - `الكهرباء`
  - `المستشفى`
- `clinics/{id}`
  - `name`, `openTime`, `closeTime`, `phone`
- `deaths/{id}`
  - `name`, `family`, `funeralTime`, `condolencePlace`, `phone`, `createdAt`, `expiresAt`

## 4) الأسعار والوفيات
المدير يدخل من ⚙ ثم يسجل الدخول. أي تعديل يحفظ مباشرة في Firestore ويصل للمستخدمين عبر `onSnapshot`.

إعلان الوفاة يحدد مدة افتراضية 3 أيام ويحتوي `expiresAt`؛ الواجهة تخفي الإعلان بعد انتهاء المدة.

## 5) Offline
Firestore يحاول تفعيل IndexedDB، والواجهة تحفظ آخر بيانات مهمة في localStorage. Service Worker يحفظ ملفات الموقع الأساسية. عند انقطاع الإنترنت يظهر تنبيه ويستمر عرض آخر البيانات.

## 6) الطقس والصلاة
- مواقيت الصلاة: Aladhan API باستخدام إحداثيات أرمناز.
- الطقس: OpenWeather اختياري؛ ضع المفتاح في `firebase-config.js`.
إذا لم تضع مفتاح الطقس، تبقى آخر قراءة محفوظة.

## 7) GitHub Pages
ارفع كل الملفات في جذر repository، ثم Settings → Pages → Deploy from branch → main → root.

### أمان مهم
Firebase config الخاص بالويب ليس كلمة سر. لكن لا تضع أي Service Account JSON أو private key داخل المستودع. الحماية الحقيقية تأتي من Authentication + Firestore Rules + Custom Claims.
