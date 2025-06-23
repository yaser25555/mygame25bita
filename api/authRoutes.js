const express = require('express');
const router = express.Router();
const User = require('../models/User'); // تأكد من المسار الصحيح لنموذج المستخدم
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // البحث عن المستخدم في قاعدة البيانات
        const user = await User.findOne({ username });

        // التحقق من وجود المستخدم وكلمة المرور
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
        }

        // التحقق مما إذا كان المستخدم مسؤولاً
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'ليس لديك صلاحيات المسؤول.' });
        }

        // إنشاء رمز JWT للمسؤول
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // يمكن تعديل مدة صلاحية الرمز
        );

        res.json({ message: 'تم تسجيل الدخول بنجاح كمسؤول.', token });

    } catch (error) {
        console.error('خطأ في تسجيل دخول المسؤول:', error);
        res.status(500).json({ message: 'حدث خطأ داخلي في الخادم.' });
    }
});

module.exports = router;