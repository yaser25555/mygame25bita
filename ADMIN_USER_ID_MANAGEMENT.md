# نظام إدارة معرفات المستخدمين للمشرفين

## نظرة عامة
تم إضافة نظام إدارة معرفات المستخدمين للمشرفين، حيث يمكن للمشرفين تغيير معرفات المستخدمين إلى أي رقم، بما في ذلك الأرقام من خانة واحدة.

## الميزات الجديدة

### 1. تغيير معرف المستخدم
- يمكن للمشرف تغيير معرف أي مستخدم إلى أي رقم
- يدعم الأرقام من خانة واحدة (1-9)
- يدعم الأرقام الكبيرة
- التحقق من عدم تكرار المعرفات

### 2. البحث والتصفية
- البحث عن المستخدمين بالاسم أو البريد الإلكتروني
- البحث عن مستخدم برقم المعرف
- عرض قائمة المستخدمين مع معرفاتهم

### 3. واجهة إدارة متقدمة
- واجهة ويب سهلة الاستخدام للمشرفين
- عرض منظم للمستخدمين مع معرفاتهم
- إمكانية تغيير المعرفات بسهولة

## API Endpoints الجديدة

### 1. تغيير معرف المستخدم
```
PUT /api/users/admin/change-user-id
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "targetUserId": "user_mongodb_id",
  "newUserId": 5
}

Response:
{
  "success": true,
  "message": "تم تغيير معرف المستخدم من 1500 إلى 5",
  "user": {
    "id": "user_mongodb_id",
    "username": "user1500",
    "oldUserId": 1500,
    "newUserId": 5
  }
}
```

### 2. الحصول على قائمة المستخدمين
```
GET /api/users/admin/users-with-ids?page=1&limit=20&search=user
Authorization: Bearer <admin_token>

Response:
{
  "users": [
    {
      "_id": "user_id",
      "userId": 5,
      "username": "user1500",
      "email": "user@test.com",
      "profile": {
        "displayName": "المستخدم",
        "level": 10
      },
      "stats": {
        "score": 1000
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### 3. البحث عن مستخدم برقم المعرف
```
GET /api/users/admin/find-user-by-id/5
Authorization: Bearer <admin_token>

Response:
{
  "user": {
    "_id": "user_id",
    "userId": 5,
    "username": "user1500",
    "email": "user@test.com",
    "profile": {
      "displayName": "المستخدم",
      "level": 10
    },
    "stats": {
      "score": 1000
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## واجهة الإدارة

### الوصول للوحة الإدارة
```
http://your-domain.com/admin-user-ids.html
```

### الميزات المتاحة في الواجهة:
1. **البحث عن المستخدمين**: بالاسم أو البريد الإلكتروني
2. **البحث برقم المعرف**: للعثور على مستخدم محدد
3. **عرض قائمة المستخدمين**: مع معرفاتهم ومعلوماتهم
4. **تغيير المعرفات**: نقر على زر "تغيير المعرف"
5. **ترقيم الصفحات**: للتنقل بين الصفحات

## كيفية الاستخدام

### 1. تشغيل اختبار النظام
```bash
npm run test-admin-ids
```

### 2. الوصول للوحة الإدارة
1. سجل دخول كـ مشرف
2. انتقل إلى `admin-user-ids.html`
3. استخدم الواجهة لإدارة المعرفات

### 3. تغيير معرف مستخدم
1. ابحث عن المستخدم المطلوب
2. انقر على "تغيير المعرف"
3. أدخل المعرف الجديد
4. انقر على "حفظ التغيير"

## أمثلة على الاستخدام

### تغيير معرف إلى رقم من خانة واحدة
```javascript
// تغيير معرف المستخدم إلى 5
const response = await fetch('/api/users/admin/change-user-id', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    targetUserId: 'user_mongodb_id',
    newUserId: 5
  })
});
```

### البحث عن مستخدم برقم المعرف
```javascript
// البحث عن المستخدم برقم المعرف 5
const response = await fetch('/api/users/admin/find-user-by-id/5', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### الحصول على قائمة المستخدمين
```javascript
// الحصول على أول 20 مستخدم
const response = await fetch('/api/users/admin/users-with-ids?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

## الأمان والصلاحيات

### التحقق من الصلاحيات
- جميع النقاط النهائية تتطلب مصادقة المشرف
- التحقق من `isAdmin: true` للمستخدم
- رفض الطلبات من المستخدمين العاديين

### حماية البيانات
- التحقق من عدم تكرار المعرفات
- التحقق من صحة المعرف الجديد
- تسجيل جميع العمليات في الكونسول

## استكشاف الأخطاء

### خطأ: غير مصرح لك بهذا الإجراء
```javascript
// الحل: تأكد من أن المستخدم مشرف
const user = await User.findById(userId);
if (!user.isAdmin) {
  return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
}
```

### خطأ: المعرف الجديد مستخدم بالفعل
```javascript
// الحل: البحث عن معرف متاح
const existingUser = await User.findOne({ userId: newUserId });
if (existingUser) {
  return res.status(400).json({ error: 'المعرف الجديد مستخدم بالفعل' });
}
```

### خطأ: المعرف الجديد يجب أن يكون رقم موجب
```javascript
// الحل: التحقق من صحة المعرف
if (newUserId < 1) {
  return res.status(400).json({ error: 'المعرف الجديد يجب أن يكون رقم موجب' });
}
```

## السكريبتات المتاحة

### test-admin-user-ids.js
- يختبر جميع وظائف إدارة المعرفات
- ينشئ مشرف ومستخدمين تجريبيين
- يختبر تغيير المعرفات إلى أرقام من خانة واحدة
- يختبر البحث والتصفية

## ملاحظات مهمة

1. **الصلاحيات**: تأكد من أن المستخدم مشرف قبل استخدام هذه الوظائف
2. **النسخ الاحتياطي**: عمل نسخة احتياطية قبل تغيير المعرفات
3. **التوثيق**: جميع العمليات مسجلة في الكونسول
4. **الأمان**: التحقق من صحة البيانات قبل التحديث

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات الخطأ
2. تأكد من صلاحيات المشرف
3. تحقق من صحة المعرف الجديد
4. راجع التوثيق المحدث 