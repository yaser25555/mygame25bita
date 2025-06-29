const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// إعداد الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

async function testAdminUserIdFunctions() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // اختبار 1: إنشاء مشرف
    console.log('\n👑 اختبار 1: إنشاء مشرف');
    const adminUsername = `admin_${Date.now()}`;
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      username: adminUsername,
      email: `${adminUsername}@admin.com`,
      password: hashedPassword,
      isAdmin: true,
      profile: {
        displayName: 'المشرف التجريبي',
        bio: 'مشرف تم إنشاؤه لاختبار النظام'
      }
    });
    
    await admin.save();
    console.log(`✅ تم إنشاء المشرف: ${admin.username} بمعرف: ${admin.userId}`);
    
    // اختبار 2: إنشاء مستخدم عادي
    console.log('\n👤 اختبار 2: إنشاء مستخدم عادي');
    const normalUsername = `normaluser_${Date.now()}`;
    
    const normalUser = new User({
      username: normalUsername,
      email: `${normalUsername}@test.com`,
      password: hashedPassword,
      isAdmin: false,
      profile: {
        displayName: 'مستخدم عادي',
        bio: 'مستخدم عادي لاختبار النظام'
      }
    });
    
    await normalUser.save();
    console.log(`✅ تم إنشاء المستخدم العادي: ${normalUser.username} بمعرف: ${normalUser.userId}`);
    
    // اختبار 3: تغيير معرف المستخدم إلى رقم من خانة واحدة
    console.log('\n🔧 اختبار 3: تغيير معرف المستخدم إلى رقم من خانة واحدة');
    const oldUserId = normalUser.userId;
    const newUserId = 5; // رقم من خانة واحدة
    
    // التحقق من أن المعرف الجديد غير مستخدم
    const existingUser = await User.findOne({ userId: newUserId });
    if (existingUser) {
      console.log(`⚠️ المعرف ${newUserId} مستخدم بالفعل، سيتم استخدام معرف آخر`);
      // استخدام معرف آخر
      const nextAvailableId = await findNextAvailableId();
      normalUser.userId = nextAvailableId;
    } else {
      normalUser.userId = newUserId;
    }
    
    await normalUser.save();
    console.log(`✅ تم تغيير معرف المستخدم من ${oldUserId} إلى ${normalUser.userId}`);
    
    // اختبار 4: تغيير معرف المستخدم إلى رقم كبير
    console.log('\n🔧 اختبار 4: تغيير معرف المستخدم إلى رقم كبير');
    const bigUserId = 9999;
    
    // التحقق من أن المعرف الجديد غير مستخدم
    const existingUser2 = await User.findOne({ userId: bigUserId });
    if (existingUser2) {
      console.log(`⚠️ المعرف ${bigUserId} مستخدم بالفعل، سيتم استخدام معرف آخر`);
      const nextAvailableId2 = await findNextAvailableId();
      normalUser.userId = nextAvailableId2;
    } else {
      normalUser.userId = bigUserId;
    }
    
    await normalUser.save();
    console.log(`✅ تم تغيير معرف المستخدم إلى ${normalUser.userId}`);
    
    // اختبار 5: عرض جميع المستخدمين مع معرفاتهم
    console.log('\n📊 اختبار 5: عرض جميع المستخدمين مع معرفاتهم');
    const allUsers = await User.find({}, { userId: 1, username: 1, isAdmin: 1, email: 1 })
      .sort({ userId: 1 });
    
    console.log('جميع المستخدمين:');
    allUsers.forEach(user => {
      const adminStatus = user.isAdmin ? '👑 مشرف' : '👤 مستخدم';
      console.log(`  معرف: ${user.userId} | ${adminStatus} | اسم المستخدم: ${user.username} | البريد: ${user.email}`);
    });
    
    // اختبار 6: البحث عن مستخدم برقم المعرف
    console.log('\n🔍 اختبار 6: البحث عن مستخدم برقم المعرف');
    const searchUserId = normalUser.userId;
    const foundUser = await User.findOne({ userId: searchUserId });
    
    if (foundUser) {
      console.log(`✅ تم العثور على المستخدم: ${foundUser.username} بمعرف: ${foundUser.userId}`);
    } else {
      console.log(`❌ لم يتم العثور على مستخدم بمعرف: ${searchUserId}`);
    }
    
    // اختبار 7: التحقق من عدم تكرار المعرفات
    console.log('\n🔍 اختبار 7: التحقق من عدم تكرار المعرفات');
    const userIds = allUsers.map(user => user.userId);
    const uniqueIds = [...new Set(userIds)];
    
    if (userIds.length === uniqueIds.length) {
      console.log('✅ جميع المعرفات فريدة');
    } else {
      console.log('❌ يوجد معرفات مكررة');
      console.log('المعرفات المكررة:', userIds.filter((id, index) => userIds.indexOf(id) !== index));
    }
    
    // اختبار 8: إنشاء مستخدمين بمعرفات من خانة واحدة
    console.log('\n🔢 اختبار 8: إنشاء مستخدمين بمعرفات من خانة واحدة');
    const singleDigitIds = [1, 2, 3, 4, 6, 7, 8, 9]; // تجنب 5 لأنه قد يكون مستخدماً
    
    for (let i = 0; i < 3; i++) {
      const singleDigitId = singleDigitIds[i];
      const username = `single${singleDigitId}_${Date.now()}`;
      
      // التحقق من أن المعرف غير مستخدم
      const existing = await User.findOne({ userId: singleDigitId });
      if (!existing) {
        const user = new User({
          userId: singleDigitId,
          username: username,
          email: `${username}@test.com`,
          password: hashedPassword,
          profile: {
            displayName: `مستخدم رقم ${singleDigitId}`,
            bio: `مستخدم بمعرف من خانة واحدة: ${singleDigitId}`
          }
        });
        
        await user.save();
        console.log(`✅ تم إنشاء المستخدم: ${user.username} بمعرف: ${user.userId}`);
      } else {
        console.log(`⚠️ المعرف ${singleDigitId} مستخدم بالفعل`);
      }
    }
    
    console.log('\n🎉 تم إكمال جميع اختبارات إدارة المعرفات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار إدارة المعرفات:', error);
  } finally {
    // إغلاق الاتصال
    await mongoose.connection.close();
    console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// دالة للعثور على المعرف التالي المتاح
async function findNextAvailableId() {
  const lastUser = await User.findOne({}, { userId: 1 })
    .sort({ userId: -1 })
    .limit(1);
  
  return (lastUser?.userId || 1499) + 1;
}

// تشغيل الاختبار إذا تم استدعاؤه مباشرة
if (require.main === module) {
  testAdminUserIdFunctions();
}

module.exports = testAdminUserIdFunctions; 