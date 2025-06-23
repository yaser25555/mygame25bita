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

    // البحث عن المستخدم باستخدام اسم المستخدم أو البريد الإلكتروني
    const user = await User.findOne({ $or: [{ username }, { email: username }] }); // يمكن الدخول باسم المستخدم أو البريد الإلكتروني

    if (!user) {
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // إنشاء التوكن
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      SECRET_KEY,
      { expiresIn: '6h' }
    );

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

// تم إزالة دالة verifyToken ومسار /me من هنا
// لأنها موجودة في user.js وهي مناسبة أكثر هناك
// تأكد من أن أي مكان يستدعي verifyToken يستخدمها من user.js أو أن تكون دالة عامة
// (مثلاً في ملف middleware منفصل يتم استيراده في كل من auth.js و user.js)

module.exports = router;
