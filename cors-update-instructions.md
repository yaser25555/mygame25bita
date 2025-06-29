# 🔧 تحديث CORS في Backend - خطوات مهمة

## المشكلة الحالية:
Backend الخاص بك على Render لا يسمح بالطلبات من النطاق الجديد `infinity-box25.netlify.app`

## الحل:

### 1. اذهب إلى كود Backend على Render:
- افتح مشروع Backend على Render.com
- ابحث عن ملف `server.js` أو `app.js`

### 2. ابحث عن كود CORS:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mygame25bita-1-4ue6.onrender.com'
  ]
}));
```

### 3. استبدله بهذا الكود:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://infinity-box25.netlify.app',  // النطاق الجديد
    'https://mygame25bita-1-4ue6.onrender.com'
  ]
}));
```

### 4. احفظ الملف:
- Render سيعيد النشر تلقائياً
- انتظر 2-3 دقائق

### 5. اختبر الموقع:
- اذهب إلى `https://infinity-box25.netlify.app`
- جرب تسجيل الدخول
- تأكد من عمل جميع الوظائف

## ⚠️ مهم جداً:
بدون هذا التحديث، لن تعمل:
- تسجيل الدخول
- المحادثة الصوتية  
- الألعاب
- لوحة المشرف

## 🔍 كيفية التحقق من نجاح التحديث:
1. افتح `https://infinity-box25.netlify.app`
2. اضغط F12 (Developer Tools)
3. اذهب إلى تبويب Console
4. إذا رأيت أخطاء CORS، فالتحديث لم يتم بعد
5. إذا لم تر أخطاء، فالتحديث نجح

## 📞 إذا احتجت مساعدة:
- أرسل لي screenshot من أخطاء Console
- أو أخبرني إذا نجح التحديث