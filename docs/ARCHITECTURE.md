# Architecture

الواجهة الحالية لا تعتمد على خرائط أو GPS. العناوين نصية.

المبدأ:
UI → Data layer → API → Backend → Database

كل معلومة متغيرة يجب أن تكون في قاعدة البيانات/لوحة الإدارة في النسخة الإنتاجية، وليس داخل مكونات الواجهة.

التصميم مجهز لـ:
- PWA
- Backend API
- Authentication
- Admin dashboard
- Android/iOS لاحقًا
