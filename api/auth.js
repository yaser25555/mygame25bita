const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // المسار صحيح الآن
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body; // استلام البريد الإلكتروني من الطلب

    // التحقق من وجود المستخدم أو البريد الإلكتروني بالفعل
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email, // إضافة البريد الإلكتروني للمستخدم الجديد
      password: hashedPassword,
      isAdmin: false, // المستخدمون الجدد ليسوا مشرفين بشكل افتراضي
      score: 0 // تعيين النتيجة الأولية
    });

    await newUser.save();
    res.status(201).json({ message: 'تم التسجيل بنجاح!' });

  } catch (err) {
    // طباعة الخطأ كاملاً للتشخيص
    console.error("خطأ أثناء التسجيل:", err);
    // التعامل مع أخطاء التحقق (مثل حقل مطلوب مفقود)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'خطأ داخلي أثناء التسجيل', error: err.message });
  }
});

// تسجيل دخول
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 محاولة تسجيل دخول:', { username, password: password ? '***' : 'فارغة' });

    // البحث عن المستخدم باستخدام اسم المستخدم أو البريد الإلكتروني
    const user = await User.findOne({ $or: [{ username }, { email: username }] }); // يمكن الدخول باسم المستخدم أو البريد الإلكتروني

    if (!user) {
      console.log('❌ المستخدم غير موجود:', username);
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    console.log('✅ تم العثور على المستخدم:', user.username);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('❌ كلمة المرور غير صحيحة للمستخدم:', username);
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    console.log('✅ كلمة المرور صحيحة للمستخدم:', username);

    // إنشاء التوكن
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      SECRET_KEY,
      { expiresIn: '6h' }
    );

    console.log('✅ تم إنشاء التوكن للمستخدم:', username);

    res.json({
      message: 'تم تسجيل الدخول بنجاح!',
      token,
      username: user.username,
      isAdmin: user.isAdmin,
      score: user.score // يمكنك إرجاع النقاط هنا أيضاً
    });

  } catch (error) {
    console.error("خطأ أثناء تسجيل الدخول:", error); // طباعة الخطأ كاملاً
    res.status(500).json({ message: 'خطأ داخلي أثناء تسجيل الدخول', error: error.message });
  }
});

// مسار لإنشاء مستخدم تجريبي (للتطوير فقط)
router.post('/create-test-user', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
      score: 1000,
      pearls: 5
    });

    await newUser.save();
    res.status(201).json({ 
      message: 'تم إنشاء المستخدم التجريبي بنجاح!',
      username,
      email,
      password: 'كلمة المرور المدخلة'
    });

  } catch (err) {
    console.error("خطأ أثناء إنشاء المستخدم التجريبي:", err);
    res.status(500).json({ message: 'خطأ داخلي أثناء إنشاء المستخدم', error: err.message });
  }
});

// مسار لفحص المستخدمين الموجودين (للتطوير فقط)
router.get('/check-users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // لا نرجع كلمات المرور
    res.json({
      message: `تم العثور على ${users.length} مستخدم`,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        score: user.score,
        pearls: user.pearls || 0,
        createdAt: user.createdAt
      }))
    });
  } catch (err) {
    console.error("خطأ أثناء فحص المستخدمين:", err);
    res.status(500).json({ message: 'خطأ داخلي أثناء فحص المستخدمين', error: err.message });
  }
});

// مسار لإعادة تعيين كلمة مرور المستخدم (للتطوير فقط)
router.post('/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: 'تم إعادة تعيين كلمة المرور بنجاح!',
      username: user.username,
      newPassword: newPassword
    });

  } catch (err) {
    console.error("خطأ أثناء إعادة تعيين كلمة المرور:", err);
    res.status(500).json({ message: 'خطأ داخلي أثناء إعادة تعيين كلمة المرور', error: err.message });
  }
});

// تم إزالة دالة verifyToken ومسار /me من هنا
// لأنها موجودة في user.js وهي مناسبة أكثر هناك
// تأكد من أن أي مكان يستدعي verifyToken يستخدمها من user.js أو أن تكون دالة عامة
// (مثلاً في ملف middleware منفصل يتم استيراده في كل من auth.js و user.js)

module.exports = router;
