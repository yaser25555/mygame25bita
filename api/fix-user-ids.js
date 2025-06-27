const mongoose = require('mongoose');
const User = require('../models/User');

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceboom', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function fixUserIds() {
    try {
        console.log('🔧 بدء إصلاح معرفات المستخدمين...');
        
        // البحث عن المستخدمين الذين لا يملكون معرف أو معرفهم null/undefined
        const usersWithoutId = await User.find({
            $or: [
                { userId: { $exists: false } },
                { userId: null },
                { userId: undefined }
            ]
        });
        console.log(`📊 وجد ${usersWithoutId.length} مستخدم بدون معرف`);
        
        if (usersWithoutId.length === 0) {
            console.log('✅ جميع المستخدمين لديهم معرفات صحيحة');
            return;
        }
        
        // البحث عن أعلى معرف موجود
        const maxUser = await User.findOne({ userId: { $exists: true, $ne: null } }).sort({ userId: -1 });
        let nextId = maxUser && maxUser.userId ? maxUser.userId + 1 : 1500;
        
        console.log(`🆔 سيبدأ الترقيم من: ${nextId}`);
        
        // إصلاح المعرفات
        for (const user of usersWithoutId) {
            try {
                // التحقق من أن المستخدم صالح
                if (!user.email || !user.username) {
                    console.log(`⚠️ تخطي المستخدم ${user._id} - بيانات غير مكتملة`);
                    continue;
                }
                
                user.userId = nextId;
                await user.save();
                console.log(`✅ تم إصلاح معرف المستخدم ${user.username}: ${nextId}`);
                nextId++;
            } catch (error) {
                console.log(`❌ خطأ في إصلاح معرف المستخدم ${user.username}:`, error.message);
            }
        }
        
        console.log('🎉 تم إصلاح جميع معرفات المستخدمين بنجاح!');
        
    } catch (error) {
        console.error('❌ خطأ في إصلاح المعرفات:', error);
    } finally {
        mongoose.connection.close();
    }
}

// تشغيل السكريبت
fixUserIds(); 