const mongoose = require('mongoose');
const User = require('../models/User');

// إعداد الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceboom', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkAndFixUserIds() {
    try {
        console.log('🔍 بدء فحص معرفات المستخدمين...');
        
        // البحث عن جميع المستخدمين
        const users = await User.find({}).sort({ createdAt: 1 });
        console.log(`📊 تم العثور على ${users.length} مستخدم`);
        
        let nextUserId = 1500;
        let fixedCount = 0;
        
        for (const user of users) {
            if (!user.userId || user.userId < 1500) {
                console.log(`🔧 إصلاح معرف المستخدم: ${user.username} (${user.userId || 'غير محدد'} -> ${nextUserId})`);
                
                user.userId = nextUserId;
                await user.save();
                nextUserId++;
                fixedCount++;
            } else {
                // تحديث nextUserId إذا كان معرف المستخدم أكبر
                if (user.userId >= nextUserId) {
                    nextUserId = user.userId + 1;
                }
            }
        }
        
        console.log(`✅ تم إصلاح ${fixedCount} معرف مستخدم`);
        console.log(`📈 المعرف التالي المتاح: ${nextUserId}`);
        
        // عرض قائمة المستخدمين مع معرفاتهم
        console.log('\n📋 قائمة المستخدمين مع معرفاتهم:');
        const updatedUsers = await User.find({}).select('userId username email createdAt').sort({ userId: 1 });
        
        updatedUsers.forEach(user => {
            console.log(`ID: ${user.userId} | Username: ${user.username} | Email: ${user.email} | Created: ${user.createdAt.toLocaleDateString('ar-SA')}`);
        });
        
    } catch (error) {
        console.error('❌ خطأ في فحص وإصلاح معرفات المستخدمين:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
}

// تشغيل السكريبت
checkAndFixUserIds(); 