# VoiceBoom - لعبة الصوت التفاعلية

## 🚀 الإصلاحات الأخيرة (2024)

### إصلاح مشكلة تسجيل الدخول
تم إصلاح المشاكل التالية في صفحة تسجيل الدخول:

1. **مشكلة Content Security Policy**: تم تحديث CSP ليدعم URL الخادم الصحيح
2. **مشكلة CORS**: تم تحسين إعدادات CORS في الخادم
3. **مشكلة معالجة الاستجابة**: تم تحسين معالجة الأخطاء والاستجابات
4. **مشكلة URL الخادم**: تم توحيد استخدام URL الخادم الصحيح

### URLs المحدثة
- **الخادم الخلفي**: `https://mygame25bita-7eqw.onrender.com`
- **الواجهة الأمامية**: `https://mygame25bita-1-4ue6.onrender.com`

## 📋 المتطلبات

- Node.js >= 16.0.0
- MongoDB
- npm أو yarn

## 🛠️ التثبيت والتشغيل

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
أنشئ ملف `.env` في المجلد الجذر:
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voiceboom
JWT_SECRET=your-super-secret-jwt-key-here-2024
```

### 3. تشغيل الخادم
```bash
npm start
```

### 4. تشغيل في وضع التطوير
```bash
npm run dev
```

## 🧪 اختبار الاتصال

يمكنك اختبار الاتصال بالخادم باستخدام:
- صفحة الاختبار: `test-connection.html`
- Health Check: `GET /health`
- اختبار CORS: `GET /test-cors`

## 📁 هيكل المشروع

```
proj25/
├── api/                 # الخادم الخلفي
│   ├── index.js        # نقطة الدخول الرئيسية
│   ├── auth.js         # مسارات المصادقة
│   ├── user.js         # مسارات المستخدمين
│   └── ...
├── frontend/           # الواجهة الأمامية
│   ├── index.html      # صفحة تسجيل الدخول
│   ├── login.js        # منطق تسجيل الدخول
│   ├── game.html       # صفحة اللعبة
│   └── ...
├── models/             # نماذج قاعدة البيانات
│   └── User.js         # نموذج المستخدم
└── ...
```

## 🔧 الإصلاحات المطبقة

### 1. إصلاح Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://mygame25bita-7eqw.onrender.com https://mygame25bita-1-4ue6.onrender.com wss: ws:; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

### 2. تحسين معالجة الأخطاء
- إضافة معالجة أفضل للأخطاء في `login.js`
- تحسين رسائل الخطأ
- إضافة اختبار الاتصال التلقائي

### 3. تحسين إعدادات CORS
```javascript
app.use(cors({
  origin: [
    'https://mygame25bita-7eqw.onrender.com',
    'https://mygame25bita-1-4ue6.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));
```

## 🐛 استكشاف الأخطاء

### مشكلة "Refused to connect"
إذا واجهت هذه المشكلة:
1. تأكد من أن CSP يدعم URL الخادم الصحيح
2. تحقق من إعدادات CORS في الخادم
3. تأكد من أن الخادم يعمل على المنفذ الصحيح

### مشكلة "Failed to fetch"
1. تحقق من اتصال الإنترنت
2. تأكد من أن الخادم يعمل
3. تحقق من console للحصول على تفاصيل الخطأ

## 📞 الدعم

للمساعدة والدعم:
- البريد الإلكتروني: YASER.HAROON79@GMAIL.COM
- واتساب: 00966554593007

## 📄 الترخيص

هذا المشروع مملوك لـ VoiceBoom Team. 