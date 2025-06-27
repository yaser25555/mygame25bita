# دليل العثور على معرف المستخدم (User ID)

## الطرق المختلفة للعثور على معرف المستخدم

### 1. **من صفحة البروفايل (الأسهل)**
- اذهب إلى صفحة البروفايل بعد تسجيل الدخول
- ستجد معرف المستخدم معروض في أعلى الصفحة
- يمكنك النقر عليه لنسخه إلى الحافظة

### 2. **من وحدة تحكم المتصفح (Console)**
افتح وحدة تحكم المتصفح (F12) واكتب أحد الأوامر التالية:

```javascript
// للحصول على معرف المستخدم فقط
getUserId()

// لعرض معلومات المستخدم الكاملة
showUserInfo()

// لنسخ معرف المستخدم إلى الحافظة
copyUserId()

// للحصول على معرف المستخدم مباشرة
currentUser?.userId || currentUser?._id
```

### 3. **من الصفحة الإدارية**
- اذهب إلى: `admin-user-ids.html`
- ستجد قائمة بجميع المستخدمين ومعرفاتهم
- يمكنك البحث عن مستخدم معين
- يمكنك نسخ معرف أي مستخدم بالنقر على زر "نسخ المعرف"

### 4. **من localStorage (للمطورين)**
```javascript
// الحصول على بيانات المستخدم من localStorage
const userData = JSON.parse(localStorage.getItem('userData'));
const userId = userData?.userId || userData?._id;
```

### 5. **من API مباشرة**
```javascript
// طلب معرف المستخدم من الخادم
const token = localStorage.getItem('token');
const response = await fetch('https://voiceboom-backend.onrender.com/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const userData = await response.json();
const userId = userData.userId || userData._id;
```

## أنواع معرفات المستخدمين

### المعرف الرقمي (userId)
- يبدأ من 1500
- يتم إنشاؤه تلقائياً عند تسجيل المستخدم
- مثال: `1500`, `1501`, `1502`

### معرف MongoDB (ObjectId)
- معرف فريد من 24 حرف
- يتم إنشاؤه تلقائياً من MongoDB
- مثال: `507f1f77bcf86cd799439011`

## ملاحظات مهمة

1. **المعرف الرقمي** هو المعرف المفضل للاستخدام في التطبيق
2. **معرف MongoDB** يستخدم داخلياً في قاعدة البيانات
3. يمكن استخدام كلا النوعين في معظم العمليات
4. عند إرسال طلبات الصداقة، استخدم المعرف الرقمي

## استكشاف الأخطاء

### إذا لم يظهر معرف المستخدم:
1. تأكد من تسجيل الدخول
2. افحص وحدة تحكم المتصفح للأخطاء
3. تأكد من اتصال الإنترنت
4. جرب تحديث الصفحة

### إذا كان المعرف "undefined":
1. قد يكون المستخدم لم يتم تعيين معرف له بعد
2. اذهب إلى الصفحة الإدارية لتعيين معرف
3. أو استخدم سكريبت `fix-user-ids.js`

## أوامر مفيدة في وحدة التحكم

```javascript
// فحص حالة تسجيل الدخول
localStorage.getItem('token')

// فحص بيانات المستخدم المحفوظة
localStorage.getItem('userData')

// إعادة تحميل بيانات المستخدم
loadUserProfile()

// عرض جميع المتغيرات العامة
Object.keys(window).filter(key => key.includes('User'))
```

## روابط مفيدة

- [صفحة البروفايل](./frontend/profile.html)
- [الصفحة الإدارية](./frontend/admin-user-ids.html)
- [سكريبت إصلاح المعرفات](./api/fix-user-ids.js)
- [دليل إدارة المعرفات](./ADMIN_USER_ID_MANAGEMENT.md) 