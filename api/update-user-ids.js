const mongoose = require('mongoose');
const User = require('../models/User');

// إعداد الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

async function updateUserIds() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // البحث عن جميع المستخدمين الذين ليس لديهم userId
    const usersWithoutId = await User.find({ userId: { $exists: false } });
    console.log(`📊 تم العثور على ${usersWithoutId.length} مستخدم بدون معرف`);
    
    if (usersWithoutId.length === 0) {
      console.log('✅ جميع المستخدمين لديهم معرفات بالفعل');
      return;
    }
    
    // البحث عن أعلى معرف موجود
    const lastUser = await User.findOne({}, { userId: 1 })
      .sort({ userId: -1 })
      .limit(1);
    
    let nextId = 1500;
    if (lastUser && lastUser.userId) {
      nextId = lastUser.userId + 1;
    }
    
    console.log(`🚀 سيبدأ الترقيم من: ${nextId}`);
    
    // تحديث معرفات المستخدمين
    for (let i = 0; i < usersWithoutId.length; i++) {
      const user = usersWithoutId[i];
      const newUserId = nextId + i;
      
      await User.findByIdAndUpdate(user._id, { userId: newUserId });
      console.log(`✅ تم تحديث المستخدم ${user.username} بمعرف: ${newUserId}`);
    }
    
    console.log(`🎉 تم تحديث ${usersWithoutId.length} مستخدم بنجاح`);
    
  } catch (error) {
    console.error('❌ خطأ في تحديث معرفات المستخدمين:', error);
  } finally {
    // إغلاق الاتصال
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  updateUserIds();
}

module.exports = updateUserIds; 