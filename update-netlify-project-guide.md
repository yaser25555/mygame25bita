# 🔄 تحديث مشروع Netlify الموجود - infinity-box25

## الوضع الحالي:
- ✅ لديك مشروع منشور: `infinity-box25.netlify.app`
- ✅ تم النشر في 7 يونيو
- ⚠️ يحتاج تحديث الإعدادات

---

## 🎯 خطوات التحديث:

### الخطوة 1: تحديث إعدادات البناء
1. **في صفحة مشروعك اضغط "Site settings"**
2. **اذهب إلى "Build & deploy"**
3. **اضغط "Edit settings" في قسم Build settings**
4. **حدث الإعدادات إلى:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

### الخطوة 2: إضافة متغيرات البيئة
1. **في "Site settings" اذهب إلى "Environment variables"**
2. **اضغط "Add variable" وأضف:**
   ```
   VITE_API_URL = https://mygame25bita-7eqw.onrender.com
   VITE_WS_URL = wss://mygame25bita-7eqw.onrender.com
   ```

### الخطوة 3: إعادة النشر
1. **اذهب إلى تبويب "Deploys"**
2. **اضغط "Trigger deploy" → "Deploy site"**
3. **انتظر 3-5 دقائق**

---

## ⚠️ خطوة مهمة - تحديث CORS:

بعد نجاح النشر، حدث Backend:

```javascript
// في ملف server.js في Backend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://infinity-box25.netlify.app', // الرابط الموجود
    'https://mygame25bita-7eqw.onrender.com'
  ]
}));
```

ثم ارفع التحديث:
```bash
git add .
git commit -m "تحديث CORS لـ Netlify"
git push origin main
```

---

## 🔍 التحقق من النجاح:

### 1. **افتح:** `https://infinity-box25.netlify.app`
### 2. **اختبر:**
- [ ] تحميل الصفحة الرئيسية
- [ ] تسجيل الدخول
- [ ] المحادثة الصوتية
- [ ] الألعاب
- [ ] لوحة المشرف

---

## 🚨 إذا ظهرت أخطاء:

### خطأ في البناء:
1. **تحقق من Build logs**
2. **تأكد من Base directory: `frontend`**
3. **تحقق من وجود package.json في مجلد frontend**

### أخطاء CORS:
1. **تأكد من تحديث Backend**
2. **انتظر 5 دقائق لإعادة نشر Backend**
3. **تحقق من console في المتصفح**

---

## 🎉 النتيجة المتوقعة:

بعد التحديث ستحصل على:
- ⚡ موقع سريع جداً على `infinity-box25.netlify.app`
- 🔄 نشر تلقائي عند تحديث الكود
- 🌍 سرعة عالمية ممتازة
- 💰 مجاني تماماً

---

## 📞 المساعدة:

إذا واجهت أي مشكلة، أخبرني:
- ما الخطأ الذي يظهر؟
- في أي خطوة توقفت؟
- screenshot من Build logs إذا فشل البناء