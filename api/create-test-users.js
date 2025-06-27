const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// إعداد الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

async function createTestUsers() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // البحث عن أعلى معرف موجود
    const lastUser = await User.findOne({}, { userId: 1 })
      .sort({ userId: -1 })
      .limit(1);
    
    let nextId = 1500;
    if (lastUser && lastUser.userId) {
      nextId = lastUser.userId + 1;
    }
    
    console.log(`🚀 سيبدأ الترقيم من: ${nextId}`);
    
    // قائمة المستخدمين التجريبيين
    const testUsers = [
      {
        userId: nextId,
        username: `user${nextId}`,
        email: `user${nextId}@test.com`,
        password: '123456',
        profile: {
          displayName: `المستخدم ${nextId}`,
          bio: `مرحباً! أنا المستخدم رقم ${nextId}`,
          level: Math.floor(Math.random() * 50) + 1,
          status: 'online'
        },
        stats: {
          score: Math.floor(Math.random() * 10000),
          gamesPlayed: Math.floor(Math.random() * 100),
          gamesWon: Math.floor(Math.random() * 50)
        }
      },
      {
        userId: nextId + 1,
        username: `player${nextId + 1}`,
        email: `player${nextId + 1}@test.com`,
        password: '123456',
        profile: {
          displayName: `اللاعب ${nextId + 1}`,
          bio: `لاعب محترف رقم ${nextId + 1}`,
          level: Math.floor(Math.random() * 50) + 1,
          status: 'online'
        },
        stats: {
          score: Math.floor(Math.random() * 10000),
          gamesPlayed: Math.floor(Math.random() * 100),
          gamesWon: Math.floor(Math.random() * 50)
        }
      },
      {
        userId: nextId + 2,
        username: `gamer${nextId + 2}`,
        email: `gamer${nextId + 2}@test.com`,
        password: '123456',
        profile: {
          displayName: `اللاعب المحترف ${nextId + 2}`,
          bio: `لاعب محترف في VoiceBoom`,
          level: Math.floor(Math.random() * 50) + 1,
          status: 'online'
        },
        stats: {
          score: Math.floor(Math.random() * 10000),
          gamesPlayed: Math.floor(Math.random() * 100),
          gamesWon: Math.floor(Math.random() * 50)
        }
      },
      {
        userId: nextId + 3,
        username: `pro${nextId + 3}`,
        email: `pro${nextId + 3}@test.com`,
        password: '123456',
        profile: {
          displayName: `المحترف ${nextId + 3}`,
          bio: `لاعب محترف مع خبرة عالية`,
          level: Math.floor(Math.random() * 50) + 1,
          status: 'online'
        },
        stats: {
          score: Math.floor(Math.random() * 10000),
          gamesPlayed: Math.floor(Math.random() * 100),
          gamesWon: Math.floor(Math.random() * 50)
        }
      },
      {
        userId: nextId + 4,
        username: `master${nextId + 4}`,
        email: `master${nextId + 4}@test.com`,
        password: '123456',
        profile: {
          displayName: `السيد ${nextId + 4}`,
          bio: `سيد اللعبة رقم ${nextId + 4}`,
          level: Math.floor(Math.random() * 50) + 1,
          status: 'online'
        },
        stats: {
          score: Math.floor(Math.random() * 10000),
          gamesPlayed: Math.floor(Math.random() * 100),
          gamesWon: Math.floor(Math.random() * 50)
        }
      }
    ];
    
    // إنشاء المستخدمين
    for (const userData of testUsers) {
      try {
        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // إنشاء المستخدم
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        console.log(`✅ تم إنشاء المستخدم: ${userData.username} بمعرف: ${userData.userId}`);
        
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ المستخدم ${userData.username} موجود بالفعل`);
        } else {
          console.error(`❌ خطأ في إنشاء المستخدم ${userData.username}:`, error.message);
        }
      }
    }
    
    console.log('🎉 تم إنشاء المستخدمين التجريبيين بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين التجريبيين:', error);
  } finally {
    // إغلاق الاتصال
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  createTestUsers();
}

module.exports = createTestUsers; 