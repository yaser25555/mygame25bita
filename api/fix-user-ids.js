const mongoose = require('mongoose');
const User = require('../models/User');

// إعداد الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceboom', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// دالة لتوليد معرف المستخدم
async function generateUserId() {
    try {
        // البحث عن أعلى معرف موجود
        const lastUser = await User.findOne({}, { userId: 1 })
            .sort({ userId: -1 })
            .limit(1);
        
        // إذا لم يوجد مستخدمين، ابدأ من 1500
        if (!lastUser) {
            return 1500;
        } else {
            // خذ المعرف التالي
            return lastUser.userId + 1;
        }
    } catch (error) {
        console.error('خطأ في توليد معرف المستخدم:', error);
        // في حالة الخطأ، استخدم timestamp كبديل
        return Math.floor(Date.now() / 1000) + 1500;
    }
}

// دالة لإصلاح معرفات المستخدمين
async function fixUserIds() {
    try {
        console.log('🔧 بدء إصلاح معرفات المستخدمين...');
        
        // البحث عن المستخدمين الذين لا يملكون userId
        const usersWithoutId = await User.find({ userId: { $exists: false } });
        console.log(`📊 تم العثور على ${usersWithoutId.length} مستخدم بدون معرف`);
        
        if (usersWithoutId.length === 0) {
            console.log('✅ جميع المستخدمين لديهم معرفات صحيحة');
            return;
        }
        
        // إصلاح كل مستخدم
        for (const user of usersWithoutId) {
            const newUserId = await generateUserId();
            user.userId = newUserId;
            await user.save();
            console.log(`✅ تم إضافة المعرف ${newUserId} للمستخدم ${user.username}`);
        }
        
        console.log('🎉 تم إصلاح جميع معرفات المستخدمين بنجاح!');
        
    } catch (error) {
        console.error('❌ خطأ في إصلاح معرفات المستخدمين:', error);
    } finally {
        mongoose.connection.close();
    }
}

// تشغيل السكريبت
fixUserIds(); 