# 🆓 دليل الحصول على نطاق مجاني من Freenom

## الخطوة 1: التسجيل في Freenom

1. **اذهب إلى:** [freenom.com](https://freenom.com)
2. **ابحث عن اسم النطاق:** مثل `infinitybox`
3. **اختر امتداد مجاني:** `.tk`, `.ml`, `.ga`, أو `.cf`
4. **اضغط "Check Availability"**

## الخطوة 2: إنشاء الحساب

1. **اضغط "Get it now!"** للنطاق المتاح
2. **اختر "12 Months @ FREE"**
3. **أكمل التسجيل** بإدخال:
   - الاسم الكامل
   - البريد الإلكتروني
   - كلمة المرور

## الخطوة 3: ربط النطاق بـ Netlify

### في Freenom:
1. **اذهب إلى "My Domains"**
2. **اضغط "Manage Domain"**
3. **اختر "Management Tools" → "Nameservers"**
4. **اختر "Use custom nameservers"**
5. **أدخل nameservers الخاصة بـ Netlify:**
   ```
   dns1.p08.nsone.net
   dns2.p08.nsone.net
   dns3.p08.nsone.net
   dns4.p08.nsone.net
   ```

### في Netlify:
1. **اذهب إلى موقعك في Netlify**
2. **اضغط "Domain management"**
3. **اضغط "Add custom domain"**
4. **أدخل النطاق الجديد:** `infinitybox.tk`
5. **اتبع التعليمات**

## الخطوة 4: انتظار التفعيل

- ⏱️ **الوقت المطلوب:** 24-48 ساعة
- 🔄 **التحقق:** استخدم [whatsmydns.net](https://whatsmydns.net)

## الخطوة 5: تحديث Backend

```javascript
// في كود الـ Backend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://infinity-box25.netlify.app',
    'https://infinitybox.tk',  // النطاق الجديد
    'https://mygame25bita-1-4ue6.onrender.com'
  ]
}));
```

## 🎉 النتيجة النهائية:

### بدلاً من:
`https://infinity-box25.netlify.app`

### ستحصل على:
`https://infinitybox.tk`

## 💡 نصائح مهمة:

1. **احتفظ بالنطاق القديم** كـ backup
2. **جدد النطاق سنوياً** (مجاني لكن يحتاج تجديد)
3. **استخدم SSL** (Netlify يوفره تلقائياً)
4. **اختبر الموقع** بعد التغيير

## 🔧 استكشاف الأخطاء:

### إذا لم يعمل النطاق:
1. **تحقق من DNS:** [dnschecker.org](https://dnschecker.org)
2. **انتظر أكثر:** قد يحتاج 48 ساعة
3. **تحقق من إعدادات Netlify**
4. **تأكد من CORS في Backend**

## 🚀 البدائل السريعة:

### إذا كان Freenom بطيء:
1. **استخدم النطاق الحالي:** `infinity-box25.netlify.app`
2. **غير اسم الموقع في Netlify** إلى: `infinitybox.netlify.app`
3. **اشتري نطاق رخيص** من Namecheap ($1-2 سنوياً)

## 📋 قائمة التحقق:

- [ ] تسجيل في Freenom
- [ ] اختيار نطاق مجاني
- [ ] ربط النطاق بـ Netlify
- [ ] تحديث CORS في Backend
- [ ] اختبار الموقع
- [ ] مشاركة الرابط الجديد

## 🎯 الخلاصة:

**الآن:** استخدم `infinity-box25.netlify.app`
**قريباً:** احصل على `infinitybox.tk` مجاناً
**المستقبل:** اشتري نطاق احترافي مثل `infinitybox.com`