// سكريبت لإنشاء مستخدم تجريبي
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function createTestUser() {
    try {
        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceboom');
        console.log('✅ تم الاتصال بقاعدة البيانات');

        // التحقق من وجود المستخدم
        const existingUser = await User.findOne({ username: 'ASD' });
        if (existingUser) {
            console.log('⚠️ المستخدم ASD موجود بالفعل');
            return;
        }

        // إنشاء كلمة مرور مشفرة
        const hashedPassword = await bcrypt.hash('test123', 10);

        // إنشاء المستخدم الجديد
        const newUser = new User({
            username: 'ASD',
            email: 'asd@test.com',
            password: hashedPassword,
            isAdmin: false,
            score: 1000,
            pearls: 5 // إضافة 5 لآلئ للمستخدم الجديد
        });

        await newUser.save();
        console.log('✅ تم إنشاء المستخدم ASD بنجاح');
        console.log('📧 البريد الإلكتروني: asd@test.com');
        console.log('🔑 كلمة المرور: test123');
        console.log('🦪 عدد اللآلئ: 5');

    } catch (error) {
        console.error('❌ خطأ في إنشاء المستخدم:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
}

createTestUser(); 