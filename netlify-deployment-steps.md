# 🚀 خطوات نشر Frontend على Netlify

## الطريقة الاحترافية: ربط GitHub بـ Netlify

### الخطوة 1: ربط GitHub بـ Netlify
1. **في Netlify اضغط "New site from Git"**
2. **اختر GitHub → `yaser25555/mygame25bita`**
3. **إعدادات مهمة جداً:**
   ```
   Base directory: frontend
   Build command: npm run build  
   Publish directory: frontend/dist
   ```

### الخطوة 2: إضافة متغيرات البيئة
```
VITE_API_URL = https://mygame25bita-7eqw.onrender.com
VITE_WS_URL = wss://mygame25bita-7eqw.onrender.com
```

### الخطوة 3: النشر
- اضغط "Deploy site"
- انتظر 3-5 دقائق
- ستحصل على رابط مثل: `https://infinity-box-123.netlify.app`

## ⚠️ خطوة مهمة جداً - تحديث CORS:

بعد النشر، يجب تحديث Backend:

```javascript
// في ملف server.js في مجلد backend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-new-netlify-url.netlify.app', // الرابط الجديد
    'https://mygame25bita-7eqw.onrender.com'
  ]
}));
```

ثم:
```bash
git add .
git commit -m "تحديث CORS"
git push origin main
```

## 🎉 النتيجة النهائية:
- موقعك سيكون متاح على رابط سريع جداً
- يعمل على جميع الأجهزة والمتصفحات
- سرعة تحميل عالية
- أمان SSL مجاني