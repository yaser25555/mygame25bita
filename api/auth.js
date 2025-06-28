const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // المسار صحيح الآن
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // التحقق من وجود المستخدم أو البريد الإلكتروني بالفعل
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // توليد userId يدوياً
    const lastUser = await User.findOne({}, { userId: 1 }).sort({ userId: -1 }).limit(1);
    let newUserId = 1500; // البدء من 1500
    if (lastUser && lastUser.userId) {
      newUserId = lastUser.userId + 1;
    }
    
    // التحقق من عدم وجود تعارض
    const existingUserId = await User.findOne({ userId: newUserId });
    if (existingUserId) {
      // البحث عن معرف متاح
      let counter = 1;
      while (true) {
        const testUserId = newUserId + counter;
        const testUser = await User.findOne({ userId: testUserId });
        if (!testUser) {
          newUserId = testUserId;
          break;
        }
        counter++;
        if (counter > 100) {
          // في حالة الطوارئ، استخدم timestamp
          newUserId = Math.floor(Date.now() / 1000) + 1500;
          break;
        }
      }
    }

    const newUser = new User({
      userId: newUserId,
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
      'stats.score': 0
    });

    // حفظ المستخدم
    await newUser.save();
    
    console.log('✅ تم إنشاء مستخدم جديد:', {
      username: newUser.username,
      userId: newUser.userId,
      email: newUser.email,
      coins: newUser.stats.coins
    });

    res.status(201).json({ 
      message: 'تم التسجيل بنجاح!',
      userId: newUser.userId,
      welcomeMessage: 'أهلاً وسهلاً بك معنا في مملكة الحظ! تقبل هديتنا المتواضعة لتبدأ: 100,000 عملة نقدية. تعامل معها جيداً لتجمع اللؤلؤ وتحوله لأموال حقيقية! 🎁💰',
      coins: newUser.stats.coins
    });

  } catch (err) {
    console.error("خطأ أثناء التسجيل:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'خطأ داخلي أثناء التسجيل', error: err.message });
  }
});

// تسجيل دخول
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 بدء معالجة طلب تسجيل الدخول');
    console.log('📝 Headers:', req.headers);
    console.log('📦 Body:', req.body);
    
    const { username, password } = req.body;

    console.log('🔐 محاولة تسجيل دخول:', { username, password: password ? '***' : 'فارغة' });

    // التحقق من وجود البيانات المطلوبة
    if (!username || !password) {
      console.log('❌ بيانات ناقصة:', { username: !!username, password: !!password });
      return res.status(400).json({ 
        message: 'اسم المستخدم وكلمة المرور مطلوبان',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // البحث عن المستخدم باستخدام اسم المستخدم أو البريد الإلكتروني
    const user = await User.findOne({ $or: [{ username }, { email: username }] }); // يمكن الدخول باسم المستخدم أو البريد الإلكتروني

    if (!user) {
      console.log('❌ المستخدم غير موجود:', username);
      return res.status(400).json({ 
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log('✅ تم العثور على المستخدم:', user.username);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('❌ كلمة المرور غير صحيحة للمستخدم:', username);
      return res.status(400).json({ 
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log('✅ كلمة المرور صحيحة للمستخدم:', username);

    // إنشاء التوكن
    const token = jwt.sign(
      { _id: user._id, userId: user.userId, username: user.username, isAdmin: user.isAdmin },
      SECRET_KEY,
      { expiresIn: '6h' }
    );

    console.log('✅ تم إنشاء التوكن للمستخدم:', username);

    const response = {
      message: 'تم تسجيل الدخول بنجاح!',
      token,
      username: user.username,
      isAdmin: user.isAdmin,
      score: user.stats ? user.stats.score : 0
    };

    console.log('✅ إرسال الاستجابة:', { ...response, token: '***' });
    
    // إضافة headers إضافية للاستجابة
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json(response);

  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل الدخول:", error); // طباعة الخطأ كاملاً
    res.status(500).json({ 
      message: 'خطأ داخلي أثناء تسجيل الدخول', 
      error: error.message,
      errorCode: 'INTERNAL_SERVER_ERROR'
    });
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
    
    // توليد userId يدوياً
    const lastUser = await User.findOne({}, { userId: 1 }).sort({ userId: -1 }).limit(1);
    let newUserId = 1500; // البدء من 1500
    if (lastUser && lastUser.userId) {
      newUserId = lastUser.userId + 1;
    }
    
    // التحقق من عدم وجود تعارض
    const existingUserId = await User.findOne({ userId: newUserId });
    if (existingUserId) {
      // البحث عن معرف متاح
      let counter = 1;
      while (true) {
        const testUserId = newUserId + counter;
        const testUser = await User.findOne({ userId: testUserId });
        if (!testUser) {
          newUserId = testUserId;
          break;
        }
        counter++;
        if (counter > 100) {
          // في حالة الطوارئ، استخدم timestamp
          newUserId = Math.floor(Date.now() / 1000) + 1500;
          break;
        }
      }
    }

    const newUser = new User({
      userId: newUserId,
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
      'stats.score': 1000,
      'stats.pearls': 5,
      'stats.coins': 100000 // هدية ترحيب
    });

    // حفظ المستخدم
    await newUser.save();
    
    console.log('✅ تم إنشاء مستخدم تجريبي:', {
      username: newUser.username,
      userId: newUser.userId,
      email: newUser.email
    });

    res.status(201).json({ 
      message: 'تم إنشاء المستخدم التجريبي بنجاح!',
      username,
      email,
      userId: newUser.userId,
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
        score: user.stats.score,
        pearls: user.stats.pearls || 0,
        coins: user.stats.coins || 0,
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

// مسار الجوائز اليومية
router.post('/daily-reward', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'توكن مطلوب' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // التحقق من آخر جائزة
    if (user.dailyRewards.lastClaimDate) {
      const lastClaim = new Date(user.dailyRewards.lastClaimDate);
      const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
      
      if (lastClaimDay.getTime() === today.getTime()) {
        return res.status(400).json({ 
          message: 'لقد حصلت على الجائزة اليومية بالفعل! عد غداً للحصول على المزيد',
          canClaim: false
        });
      }
      
      // التحقق من الاستمرارية
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastClaimDay.getTime() === yesterday.getTime()) {
        // استمرارية
        user.dailyRewards.streakDays += 1;
      } else {
        // انقطاع الاستمرارية
        user.dailyRewards.streakDays = 1;
      }
    } else {
      // أول مرة
      user.dailyRewards.streakDays = 1;
    }

    // إعطاء الجوائز
    const coinsReward = 20000;
    const pearlsReward = 1;
    
    user.stats.coins += coinsReward;
    user.stats.pearls += pearlsReward;
    user.dailyRewards.lastClaimDate = now;
    user.dailyRewards.totalRewardsClaimed += 1;
    
    await user.save();

    console.log('🎁 جائزة يومية:', {
      username: user.username,
      coinsReward,
      pearlsReward,
      streakDays: user.dailyRewards.streakDays,
      totalCoins: user.stats.coins,
      totalPearls: user.stats.pearls
    });

    res.json({
      message: `تم الحصول على الجائزة اليومية! +${coinsReward.toLocaleString()} عملة و +${pearlsReward} لؤلؤ`,
      reward: {
        coins: coinsReward,
        pearls: pearlsReward
      },
      streak: user.dailyRewards.streakDays,
      totalCoins: user.stats.coins,
      totalPearls: user.stats.pearls,
      canClaim: false
    });

  } catch (error) {
    console.error('خطأ في الجوائز اليومية:', error);
    res.status(500).json({ message: 'خطأ داخلي في الجوائز اليومية', error: error.message });
  }
});

// مسار فحص حالة الجوائز اليومية
router.get('/daily-reward-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'توكن مطلوب' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let canClaim = true;
    if (user.dailyRewards.lastClaimDate) {
      const lastClaim = new Date(user.dailyRewards.lastClaimDate);
      const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
      
      if (lastClaimDay.getTime() === today.getTime()) {
        canClaim = false;
      }
    }

    res.json({
      canClaim,
      streakDays: user.dailyRewards.streakDays,
      totalRewardsClaimed: user.dailyRewards.totalRewardsClaimed,
      lastClaimDate: user.dailyRewards.lastClaimDate
    });

  } catch (error) {
    console.error('خطأ في فحص حالة الجوائز اليومية:', error);
    res.status(500).json({ message: 'خطأ داخلي في فحص الجوائز اليومية', error: error.message });
  }
});

// تم إزالة دالة verifyToken ومسار /me من هنا
// لأنها موجودة في user.js وهي مناسبة أكثر هناك
// تأكد من أن أي مكان يستدعي verifyToken يستخدمها من user.js أو أن تكون دالة عامة
// (مثلاً في ملف middleware منفصل يتم استيراده في كل من auth.js و user.js)

module.exports = router;
