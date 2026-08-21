# أرمناز الخدمي
هذه النسخة تعمل فورًا على GitHub Pages حتى قبل Firebase: الواجهة 3D، كل الأقسام، أزرار الاتصال، لوحة الإدارة التجريبية، التخزين المحلي، Offline وService Worker.

## ربط Firebase
1. أنشئ مشروعًا في Firebase Console.
2. أضف Web App وانسخ config إلى firebase-config.js.
3. فعّل Authentication > Email/Password للمدير.
4. فعّل Firestore.
5. انشر firestore.rules.
6. أعط حساب المدير Custom Claim باسم admin=true باستخدام بيئة آمنة/Firebase Admin SDK. لا تضع Service Account في GitHub.
7. بعد ذلك تُستبدل طبقة localStorage بطبقة Firestore/onSnapshot لبيانات مركزية.

## GitHub Pages
ضع الملفات مباشرة في جذر المستودع، ثم Settings > Pages > Deploy from branch > main > root.
