const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeletedUser = require('../models/DeletedUser');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('./auth');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

// دالة Middleware للتحقق من التوكن
function verifyToken(req, res, next) {
  console.log('🔐 محاولة التحقق من التوكن...');
  let token;
  
  // 1. Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('✅ تم العثور على التوكن في Authorization header');
  } 
  // 2. If not in header, check for token in query parameters (for sendBeacon)
  else if (req.query.token) {
    token = req.query.token;
    console.log('✅ تم العثور على التوكن في query parameters');
  }

  if (!token) {
    console.log('❌ التوكن مفقود');
    return res.status(401).json({ message: 'التوكن مفقود' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('✅ تم فك تشفير التوكن بنجاح:', { _id: decoded._id, userId: decoded.userId, username: decoded.username });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ خطأ في فك تشفير التوكن:', err.message);
    return res.status(401).json({ message: 'توكن غير صالح' });
  }
}

// دالة Middleware للتحقق من صلاحية المشرف
function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'غير مصرح لك (تحتاج صلاحية مشرف)' });
  }
  next();
}

// إعداد التخزين للصور الرمزية
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.userId + ext);
  }
});
const upload = multer({ storage: storage });

// مسار test للتأكد من أن المسارات تعمل
router.get('/test', (req, res) => {
  console.log('🧪 تم استلام طلب test');
  res.json({ message: 'مسارات user تعمل بشكل صحيح' });
});

// مسار test مع verifyToken
router.get('/test-auth', verifyToken, (req, res) => {
  console.log('🧪 تم استلام طلب test-auth');
  res.json({ 
    message: 'المصادقة تعمل بشكل صحيح',
    user: req.user 
  });
});

// مسار جديد: جلب إعدادات اللعبة (للجميع)
router.get('/settings', async (req, res) => {
  try {
    const admin = await User.findOne({ isAdmin: true });

    if (admin && admin.settings) {
      res.json(admin.settings);
    } else {
      res.json({
        boxCost: 100,
        boxValue: 50,
        winRatio: 50
      });
    }
  } catch (error) {
    console.error("خطأ في جلب إعدادات اللعبة:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب إعدادات اللعبة' });
  }
});

// مسار جديد: جلب بيانات المستخدم الحالي (يتطلب توكن مصادقة)
router.get('/me', async (req, res) => {
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

    // تحديث آخر ظهور
    await user.updateLastSeen();

    // حساب مدة التواجد
    const timeOnline = user.getTimeOnline();

    res.json({
      _id: user._id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      profile: user.profile,
      stats: user.stats,
      weapons: user.weapons,
      achievements: user.achievements,
      relationships: user.relationships,
      shield: user.shield,
      dailyRewards: user.dailyRewards,
      timeOnline: timeOnline,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    res.status(500).json({ message: 'خطأ داخلي في جلب معلومات المستخدم', error: error.message });
  }
});

// مسار جلب إحصائيات المستخدم
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({
      stats: user.stats,
      weapons: user.weapons,
      itemsCollected: user.itemsCollected,
      achievements: user.achievements,
      badges: user.badges
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب الإحصائيات' });
  }
});

// Route to save user's game data with anti-cheat protection
router.post('/save-game-data', verifyToken, async (req, res) => {
    try {
        const { score, highScore, roundNumber, itemsCollected, collectedGems, totalGemsCollected, batsHit, totalSpent } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
        if (!user.stats) user.stats = { score: 0, pearls: 0, highScore: 0, roundNumber: 0, personalScore: 50, boxesOpened: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0, totalPlayTime: 0, averageScore: 0 };
        if (!user.itemsCollected) user.itemsCollected = { gems: 0, keys: 0, coins: 0, pearls: 0, bombs: 0, stars: 0, bat: 0 };
        if (!user.weapons) user.weapons = { singleShotsUsed: 0, tripleShotsUsed: 0, hammerShotsUsed: 0, totalShots: 0, accuracy: 0 };
        if (!user.settings) user.settings = { gameSettings: { numBoxes: 10, boxValues: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, privacy: {}, notifications: {} };
        if (!user.boxValues) user.boxValues = [];
        if (!user.achievements) user.achievements = [];
        if (!user.badges) user.badges = [];
        if (!user.relationships) user.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
        if (!user.suspiciousActivity) user.suspiciousActivity = [];

        // Anti-cheat checks
        const suspiciousActivity = [];
        
        // Check for unrealistic score increase
        const scoreDiff = score - user.stats.score;
        if (scoreDiff > 10000) {
            suspiciousActivity.push(`زيادة غير طبيعية في النقاط: ${scoreDiff}`);
        }
        
        // Check for negative score
        if (score < 0) {
            suspiciousActivity.push('نقاط سالبة غير مسموحة');
        }
        
        // Check for unrealistic high score
        if (highScore > 1000000) {
            suspiciousActivity.push(`نتيجة عالية غير طبيعية: ${highScore}`);
        }
        
        // Check for unrealistic items collected
        if (itemsCollected) {
            Object.entries(itemsCollected).forEach(([item, count]) => {
                if (count > 1000) {
                    suspiciousActivity.push(`عدد كبير من العناصر: ${item} = ${count}`);
                }
            });
        }
        
        // Check for unrealistic gems collected
        if (collectedGems > 1000) {
            suspiciousActivity.push(`عدد كبير من الجواهر: ${collectedGems}`);
        }
        
        // If suspicious activity detected, log it and potentially block the save
        if (suspiciousActivity.length > 0) {
            console.warn(`Suspicious activity detected for user ${user.username}:`, suspiciousActivity);
            
            // Log suspicious activity to user's record
            user.suspiciousActivity.push({
                timestamp: new Date(),
                activities: suspiciousActivity,
                oldScore: user.stats.score,
                newScore: score,
                ip: req.ip
            });
            
            // For now, we'll allow the save but log the activity
            // In production, you might want to block suspicious saves
        }

        // Update user data
        user.stats.score = score;
        if (highScore > user.stats.highScore) {
            user.stats.highScore = highScore;
        }
        user.stats.roundNumber = roundNumber;
        if (itemsCollected) {
            user.itemsCollected = { ...user.itemsCollected, ...itemsCollected };
        }
        if (collectedGems !== undefined) user.collectedGems = collectedGems;
        if (totalGemsCollected !== undefined) user.totalGemsCollected = totalGemsCollected;
        if (batsHit !== undefined) user.batsHit = batsHit;
        if (totalSpent !== undefined) user.totalSpent = (user.totalSpent || 0) + totalSpent;

        await user.save();

        res.json({ 
            message: 'تم حفظ بيانات اللعبة بنجاح',
            user: {
                userId: user.userId,
                _id: user._id,
                username: user.username,
                score: user.stats.score,
                highScore: user.stats.highScore,
                roundNumber: user.stats.roundNumber,
                itemsCollected: user.itemsCollected,
                collectedGems: user.collectedGems,
                totalGemsCollected: user.totalGemsCollected,
                batsHit: user.batsHit,
                totalSpent: user.totalSpent
            }
        });

    } catch (error) {
        console.error('خطأ في حفظ بيانات اللعبة:', error);
        res.status(500).json({ message: 'خطأ في الخادم أثناء حفظ بيانات اللعبة' });
    }
});

// مسار تحديث بيانات المستخدم
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { displayName, bio, status } = req.body;

    console.log('📝 طلب تحديث بيانات البروفايل للمستخدم:', req.user.username);
    console.log('📋 البيانات المرسلة:', { displayName, bio, status });

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('❌ المستخدم غير موجود');
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', { userId: user.userId, username: user.username });

    // تهيئة profile إذا لم يكن موجوداً
    if (!user.profile) {
      console.log('📝 تهيئة profile للمستخدم:', user.username);
      user.profile = {
        bio: 'مرحباً! أنا لاعب في VoiceBoom 🎮',
        avatar: 'default-avatar.png',
        level: 1,
        experience: 0,
        status: 'offline',
        joinDate: new Date(),
        lastSeen: new Date()
      };
    }

    // تحديث البيانات المطلوبة
    if (displayName) user.profile.displayName = displayName;
    if (bio) user.profile.bio = bio;
    if (status) user.profile.status = status;

    console.log('💾 محاولة حفظ التغييرات...');
    await user.save();
    console.log('💾 تم حفظ التغييرات بنجاح');

    console.log(`📝 تم تحديث بيانات البروفايل للمستخدم ${user.username}`);

    res.json({
      message: 'تم تحديث بيانات البروفايل بنجاح',
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات البروفايل:', error);
    console.error('❌ تفاصيل الخطأ:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'خطأ في تحديث بيانات البروفايل',
      message: 'حدث خطأ غير متوقع',
      details: error.message 
    });
  }
});

// مسار جديد: إضافة عملات للمستخدم (فقط للمشرف)
router.post('/add-coins', verifyToken, verifyAdmin, async (req, res) => {
  const { username, amount } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'المبلغ غير صالح. يجب أن يكون رقمًا موجبًا.' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { $inc: { score: amount } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: `تم إضافة ${amount} عملة للمستخدم ${username} بنجاح!`, user });
  } catch (error) {
    console.error("خطأ في إضافة العملات:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء إضافة العملات' });
  }
});

// مسار جديد: إضافة لؤلؤ للمستخدم (فقط للمشرف)
router.post('/add-pearls', verifyToken, verifyAdmin, async (req, res) => {
  const { username, amount } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'المبلغ غير صالح. يجب أن يكون رقمًا موجبًا.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // تحديث حقل pearls و itemsCollected.pearl
    user.pearls = (user.pearls || 0) + amount;
    if (!user.itemsCollected) {
      user.itemsCollected = {};
    }
    user.itemsCollected.pearl = (user.itemsCollected.pearl || 0) + amount;
    
    await user.save();

    res.json({ message: `تم إضافة ${amount} لؤلؤة للمستخدم ${username} بنجاح!`, user });
  } catch (error) {
    console.error("خطأ في إضافة اللؤلؤ:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء إضافة اللؤلؤ' });
  }
});

// مسار جديد: تحديث بيانات اللعبة للمستخدم
router.post('/update-game-data', verifyToken, async (req, res) => {
  const { score, itemsCollected, collectedGems, totalGemsCollected, batsHit, pearls } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // تحديث البيانات
    if (score !== undefined) user.stats.score = score;
    if (itemsCollected) user.itemsCollected = { ...user.itemsCollected, ...itemsCollected };
    if (collectedGems !== undefined) user.collectedGems = collectedGems;
    if (totalGemsCollected !== undefined) user.totalGemsCollected = totalGemsCollected;
    if (batsHit !== undefined) user.batsHit = batsHit;
    if (pearls !== undefined) user.pearls = pearls;

    await user.save();

    res.json({ message: 'تم تحديث بيانات اللعبة بنجاح!', user });
  } catch (error) {
    console.error("خطأ في تحديث بيانات اللعبة:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء تحديث بيانات اللعبة' });
  }
});

// نقطة نهاية رفع الصورة الرمزية
router.post('/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    user.avatar = '/uploads/avatars/' + req.file.filename;
    await user.save();
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء رفع الصورة' });
  }
});

// مسار جديد: جلب بيانات المستخدم بواسطة اسم المستخدم (فقط للمشرف)
router.get('/by-username/:username', verifyToken, verifyAdmin, async (req, res) => {
  const { username } = req.params;

  console.log('🔍 طلب البحث عن المستخدم بالاسم:', username);

  try {
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      console.log('❌ المستخدم غير موجود:', username);
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', {
      userId: user.userId,
      username: user.username,
      email: user.email,
      score: user.stats?.score,
      pearls: user.stats?.pearls,
      _id: user._id
    });

    // التحقق من وجود userId
    if (!user.userId) {
      console.log('⚠️ تحذير: المستخدم لا يحتوي على userId:', user.username);
      console.log('📋 جميع بيانات المستخدم:', JSON.stringify(user, null, 2));
    } else {
      console.log('✅ المستخدم يحتوي على userId صحيح:', user.userId);
    }

    res.json(user);
  } catch (error) {
    console.error("خطأ في جلب بيانات المستخدم:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب بيانات المستخدم' });
  }
});

// مسار جديد: تحديث بيانات المستخدم (فقط للمشرف)
router.post('/update-user', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username, newUsername, newPassword, newScore, newPearls } = req.body;

    console.log('🔧 طلب تحديث بيانات المستخدم:', { username, newUsername, newScore, newPearls });
    console.log('📋 البيانات الكاملة المرسلة:', req.body);

    if (!username) {
      console.log('❌ اسم المستخدم مفقود');
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    // التحقق من أن البيانات رقمية
    if (newScore !== undefined && (isNaN(newScore) || newScore < 0)) {
      console.log('❌ قيمة النقاط غير صحيحة:', newScore);
      return res.status(400).json({ error: 'قيمة النقاط يجب أن تكون رقماً موجباً' });
    }

    if (newPearls !== undefined && (isNaN(newPearls) || newPearls < 0)) {
      console.log('❌ قيمة اللآلئ غير صحيحة:', newPearls);
      return res.status(400).json({ error: 'قيمة اللآلئ يجب أن تكون رقماً موجباً' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ المستخدم غير موجود:', username);
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', { 
      userId: user.userId, 
      username: user.username,
      stats: user.stats,
      hasStats: !!user.stats,
      hasUserId: !!user.userId
    });

    // تهيئة stats إذا لم يكن موجوداً
    if (!user.stats) {
      console.log('📝 تهيئة stats للمستخدم:', username);
      user.stats = {};
    }

    // تهيئة userId إذا لم يكن موجوداً
    if (!user.userId) {
      console.log('📝 المستخدم لا يحتوي على userId رقمي، سيتم استخدام _id للتعريف');
    }

    // تحديث اسم المستخدم إذا تم توفيره
    if (newUsername && newUsername !== username) {
      console.log('🔄 تحديث اسم المستخدم من', username, 'إلى', newUsername);
      // التحقق من أن الاسم الجديد غير مستخدم
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        console.log('❌ اسم المستخدم الجديد مستخدم بالفعل:', newUsername);
        return res.status(400).json({ error: 'اسم المستخدم الجديد مستخدم بالفعل' });
      }
      user.username = newUsername;
    }

    // تحديث كلمة المرور إذا تم توفيرها
    if (newPassword) {
      console.log('🔐 تحديث كلمة المرور للمستخدم:', username);
      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // تحديث النقاط إذا تم توفيرها
    if (newScore !== undefined) {
      const oldScore = user.stats.score || 0;
      console.log('📊 تحديث النقاط من', oldScore, 'إلى', newScore);
      user.stats.score = parseInt(newScore);
    }

    // تحديث اللآلئ إذا تم توفيرها
    if (newPearls !== undefined) {
      const oldPearls = user.stats.pearls || 0;
      console.log('💎 تحديث اللآلئ من', oldPearls, 'إلى', newPearls);
      user.stats.pearls = parseInt(newPearls);
    }

    console.log('💾 محاولة حفظ التغييرات...');
    console.log('📋 البيانات قبل الحفظ:', {
      stats: user.stats,
      score: user.stats.score,
      pearls: user.stats.pearls
    });
    
    await user.save();
    console.log('💾 تم حفظ التغييرات بنجاح');

    console.log(`🔧 المشرف ${req.user.username} حدث بيانات المستخدم ${username}`);

    res.json({
      message: 'تم تحديث بيانات المستخدم بنجاح',
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        score: user.stats?.score || 0,
        pearls: user.stats?.pearls || 0
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
    console.error('❌ تفاصيل الخطأ:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // إرجاع رسالة خطأ أكثر تفصيلاً
    let errorMessage = 'حدث خطأ غير متوقع';
    if (error.name === 'ValidationError') {
      errorMessage = 'خطأ في التحقق من البيانات';
    } else if (error.name === 'CastError') {
      errorMessage = 'خطأ في نوع البيانات';
    } else if (error.code === 11000) {
      errorMessage = 'اسم المستخدم مستخدم بالفعل';
    }
    
    res.status(500).json({ 
      error: 'خطأ في تحديث بيانات المستخدم',
      message: errorMessage,
      details: error.message 
    });
  }
});

// الحصول على قائمة الأصدقاء
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('relationships.friends.userId', 'username profile.displayName profile.avatar stats.score');

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const friends = user.relationships.friends.map(friend => ({
      id: friend.userId._id,
      username: friend.userId.username,
      displayName: friend.userId.profile.displayName,
      avatar: friend.userId.profile.avatar,
      score: friend.userId.stats.score,
      addedAt: friend.addedAt,
      status: friend.status
    }));

    res.json({
      friends,
      totalFriends: friends.length
    });

  } catch (error) {
    console.error('خطأ في جلب الأصدقاء:', error);
    res.status(500).json({ error: 'خطأ في جلب الأصدقاء' });
  }
});

// الحصول على طلبات الصداقة
router.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('relationships.friendRequests.fromUserId', 'username profile.displayName profile.avatar stats.score');

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const requests = user.relationships.friendRequests.map(request => ({
      id: request.fromUserId._id,
      username: request.fromUserId.username,
      displayName: request.fromUserId.profile.displayName,
      avatar: request.fromUserId.profile.avatar,
      score: request.fromUserId.stats.score,
      sentAt: request.sentAt,
      message: request.message
    }));

    res.json({
      requests,
      totalRequests: requests.length
    });

  } catch (error) {
    console.error('خطأ في جلب طلبات الصداقة:', error);
    res.status(500).json({ error: 'خطأ في جلب طلبات الصداقة' });
  }
});

// الحصول على المستخدمين المحظورين
router.get('/blocked-users', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('relationships.blockedUsers.userId', 'username profile.displayName profile.avatar stats.score');

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const blockedUsers = user.relationships.blockedUsers.map(blocked => ({
      id: blocked.userId._id,
      username: blocked.userId.username,
      displayName: blocked.userId.profile.displayName,
      avatar: blocked.userId.profile.avatar,
      score: blocked.userId.stats.score,
      blockedAt: blocked.blockedAt,
      reason: blocked.reason
    }));

    res.json({
      blockedUsers,
      totalBlocked: blockedUsers.length
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين المحظورين:', error);
    res.status(500).json({ error: 'خطأ في جلب المستخدمين المحظورين' });
  }
});

// البحث عن المستخدمين
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.userId;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'يجب أن يكون البحث من حرفين على الأقل' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { 'profile.displayName': { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username profile.displayName profile.avatar stats.score relationships.friends relationships.friendRequests relationships.blockedUsers')
    .limit(20);

    const results = users.map(user => ({
      id: user._id,
      username: user.username,
      displayName: user.profile.displayName,
      avatar: user.profile.avatar,
      score: user.stats.score,
      isFriend: user.relationships.friends.some(friend => friend.userId.toString() === currentUserId),
      hasSentRequest: user.relationships.friendRequests.some(request => request.fromUserId.toString() === currentUserId),
      hasReceivedRequest: user.relationships.friendRequests.some(request => request.fromUserId.toString() === currentUserId),
      isBlocked: user.relationships.blockedUsers.some(blocked => blocked.userId.toString() === currentUserId)
    }));

    res.json({
      users: results,
      totalResults: results.length
    });

  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في البحث عن المستخدمين' });
  }
});

// إرسال طلب صداقة
router.post('/send-friend-request', verifyToken, async (req, res) => {
  try {
    const { targetUserId, message } = req.body;
    const currentUserId = req.user.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'لا يمكنك إرسال طلب صداقة لنفسك' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من أن الطلب لم يتم إرساله من قبل
    const existingRequest = targetUser.relationships.friendRequests.find(
      request => request.fromUserId.toString() === currentUserId
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'تم إرسال طلب صداقة من قبل' });
    }

    // التحقق من أنهم ليسوا أصدقاء بالفعل
    const isAlreadyFriend = targetUser.relationships.friends.some(
      friend => friend.userId.toString() === currentUserId
    );

    if (isAlreadyFriend) {
      return res.status(400).json({ error: 'أنتم أصدقاء بالفعل' });
    }

    // إضافة طلب الصداقة
    targetUser.relationships.friendRequests.push({
      fromUserId: currentUserId,
      message: message || '',
      sentAt: new Date()
    });

    await targetUser.save();

    res.json({ 
      message: 'تم إرسال طلب الصداقة بنجاح',
      request: {
        toUserId: targetUserId,
        message: message || '',
        sentAt: new Date()
      }
    });

  } catch (error) {
    console.error('خطأ في إرسال طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في إرسال طلب الصداقة' });
  }
});

// قبول طلب صداقة
router.post('/accept-friend-request', verifyToken, async (req, res) => {
  try {
    const { fromUserId } = req.body;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // البحث عن طلب الصداقة
    const friendRequest = currentUser.relationships.friendRequests.find(
      request => request.fromUserId.toString() === fromUserId
    );

    if (!friendRequest) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    // إزالة طلب الصداقة
    currentUser.relationships.friendRequests = currentUser.relationships.friendRequests.filter(
      request => request.fromUserId.toString() !== fromUserId
    );

    // إضافة كصديق
    currentUser.relationships.friends.push({
      userId: fromUserId,
      addedAt: new Date(),
      status: 'active'
    });

    // إضافة المستخدم الحالي كصديق للمستخدم الآخر
    const fromUser = await User.findById(fromUserId);
    if (fromUser) {
      fromUser.relationships.friends.push({
        userId: currentUserId,
        addedAt: new Date(),
        status: 'active'
      });
      await fromUser.save();
    }

    await currentUser.save();

    res.json({ 
      message: 'تم قبول طلب الصداقة بنجاح',
      friend: {
        userId: fromUserId,
        addedAt: new Date()
      }
    });

  } catch (error) {
    console.error('خطأ في قبول طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في قبول طلب الصداقة' });
  }
});

// رفض طلب صداقة
router.post('/reject-friend-request', verifyToken, async (req, res) => {
  try {
    const { fromUserId } = req.body;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // إزالة طلب الصداقة
    currentUser.relationships.friendRequests = currentUser.relationships.friendRequests.filter(
      request => request.fromUserId.toString() !== fromUserId
    );

    await currentUser.save();

    res.json({ message: 'تم رفض طلب الصداقة بنجاح' });

  } catch (error) {
    console.error('خطأ في رفض طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في رفض طلب الصداقة' });
  }
});

// إزالة صديق
router.post('/remove-friend', verifyToken, async (req, res) => {
  try {
    const { friendUserId } = req.body;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // إزالة من قائمة الأصدقاء
    currentUser.relationships.friends = currentUser.relationships.friends.filter(
      friend => friend.userId.toString() !== friendUserId
    );

    // إزالة المستخدم الحالي من قائمة أصدقاء المستخدم الآخر
    const friendUser = await User.findById(friendUserId);
    if (friendUser) {
      friendUser.relationships.friends = friendUser.relationships.friends.filter(
        friend => friend.userId.toString() !== currentUserId
      );
      await friendUser.save();
    }

    await currentUser.save();

    res.json({ message: 'تم إزالة الصديق بنجاح' });

  } catch (error) {
    console.error('خطأ في إزالة الصديق:', error);
    res.status(500).json({ error: 'خطأ في إزالة الصديق' });
  }
});

// حظر مستخدم
router.post('/block-user', verifyToken, async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;
    const currentUserId = req.user.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'لا يمكنك حظر نفسك' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من أن المستخدم لم يتم حظره من قبل
    const isAlreadyBlocked = currentUser.relationships.blockedUsers.some(
      blocked => blocked.userId.toString() === targetUserId
    );

    if (isAlreadyBlocked) {
      return res.status(400).json({ error: 'تم حظر هذا المستخدم من قبل' });
    }

    // إضافة إلى قائمة المستخدمين المحظورين
    currentUser.relationships.blockedUsers.push({
      userId: targetUserId,
      blockedAt: new Date(),
      reason: reason || ''
    });

    // إزالة من قائمة الأصدقاء إذا كانوا أصدقاء
    currentUser.relationships.friends = currentUser.relationships.friends.filter(
      friend => friend.userId.toString() !== targetUserId
    );

    // إزالة طلبات الصداقة
    currentUser.relationships.friendRequests = currentUser.relationships.friendRequests.filter(
      request => request.fromUserId.toString() !== targetUserId
    );

    await currentUser.save();

    res.json({ 
      message: 'تم حظر المستخدم بنجاح',
      blockedUser: {
        userId: targetUserId,
        blockedAt: new Date(),
        reason: reason || ''
      }
    });

  } catch (error) {
    console.error('خطأ في حظر المستخدم:', error);
    res.status(500).json({ error: 'خطأ في حظر المستخدم' });
  }
});

// إلغاء حظر مستخدم
router.post('/unblock-user', verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // إزالة من قائمة المستخدمين المحظورين
    currentUser.relationships.blockedUsers = currentUser.relationships.blockedUsers.filter(
      blocked => blocked.userId.toString() !== targetUserId
    );

    await currentUser.save();

    res.json({ message: 'تم إلغاء حظر المستخدم بنجاح' });

  } catch (error) {
    console.error('خطأ في إلغاء حظر المستخدم:', error);
    res.status(500).json({ error: 'خطأ في إلغاء حظر المستخدم' });
  }
});

// جلب ملف شخصي للمستخدم
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password -suspiciousActivity');

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // إعداد البيانات العامة للملف الشخصي
    const profileData = {
      id: user._id,
      userId: user.userId,
      username: user.username,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      level: user.profile.level,
      status: user.profile.status,
      joinDate: user.profile.joinDate,
      lastSeen: user.profile.lastSeen,
      stats: {
        score: user.stats.score,
        highScore: user.stats.highScore,
        gamesPlayed: user.stats.gamesPlayed,
        gamesWon: user.stats.gamesWon,
        winRate: user.stats.winRate,
        totalPlayTime: user.stats.totalPlayTime,
        averageScore: user.stats.averageScore
      },
      achievements: user.achievements,
      badges: user.badges
    };

    res.json(profileData);

  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    res.status(500).json({ error: 'خطأ في جلب الملف الشخصي' });
  }
});

// البحث عن المستخدمين للمشرفين
router.get('/admin/search', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const searchRegex = new RegExp(search, 'i');

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex },
        { 'profile.displayName': searchRegex }
      ]
    })
    .select('userId username email profile.displayName profile.bio profile.avatar profile.level profile.status profile.joinDate')
    .sort({ 'profile.level': -1, username: 1 })
    .limit(50);

    const results = users.map(user => ({
      id: user._id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      level: user.profile.level,
      status: user.profile.status,
      joinDate: user.profile.joinDate
    }));

    res.json({
      users: results,
      totalResults: results.length
    });

  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في البحث عن المستخدمين' });
  }
});

// جلب جميع المستخدمين للمشرفين
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find()
      .select('userId username email profile.displayName profile.level stats.score createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments();

    const results = users.map(user => ({
      id: user._id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      displayName: user.profile.displayName,
      level: user.profile.level,
      score: user.stats.score,
      createdAt: user.createdAt
    }));

    res.json({
      users: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في جلب المستخدمين' });
  }
});

// تحديث دور المستخدم (للمشرفين)
router.put('/admin/update-role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    user.isAdmin = role === 'admin';
    await user.save();

    res.json({
      message: `تم تحديث دور المستخدم ${user.username} إلى ${role} بنجاح`,
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث دور المستخدم:', error);
    res.status(500).json({ error: 'خطأ في تحديث دور المستخدم' });
  }
});

// حذف المستخدم (للمشرفين فقط)
router.delete('/admin/delete-user/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    // البحث عن المستخدم
    let user = await User.findOne({ userId: parseInt(userId) });
    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // منع حذف المشرفين
    if (user.isAdmin) {
      return res.status(403).json({ error: 'لا يمكن حذف المشرفين' });
    }

    // حفظ معلومات المستخدم في جدول المستخدمين المحذوفين
    const deletedUserData = new DeletedUser({
      originalUserId: user.userId,
      username: user.username,
      email: user.email,
      originalData: {
        profile: user.profile,
        stats: user.stats,
        boxValues: user.boxValues,
        friends: user.friends,
        achievements: user.achievements,
        itemsCollected: user.itemsCollected,
        pearls: user.pearls,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      deletedBy: req.user.username,
      reason: reason || 'حذف بواسطة المشرف'
    });

    await deletedUserData.save();

    // حذف المستخدم من قاعدة البيانات
    await User.findByIdAndDelete(user._id);

    console.log(`🗑️ تم حذف المستخدم ${user.username} (ID: ${user.userId}) بواسطة المشرف ${req.user.username}`);

    res.json({
      message: `تم حذف المستخدم ${user.username} بنجاح`,
      deletedUser: {
        originalUserId: deletedUserData.originalUserId,
        username: deletedUserData.username,
        email: deletedUserData.email,
        deletedAt: deletedUserData.deletedAt,
        deletedBy: deletedUserData.deletedBy,
        reason: deletedUserData.reason
      }
    });

  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// حذف عدة مستخدمين دفعة واحدة (للمشرفين فقط)
router.delete('/admin/delete-multiple-users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'قائمة معرفات المستخدمين مطلوبة' });
    }

    const deletedUsers = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        // البحث عن المستخدم
        let user = await User.findOne({ userId: parseInt(userId) });
        if (!user) {
          user = await User.findById(userId);
        }

        if (!user) {
          errors.push(`المستخدم ${userId} غير موجود`);
          continue;
        }

        // منع حذف المشرفين
        if (user.isAdmin) {
          errors.push(`لا يمكن حذف المشرف ${user.username}`);
          continue;
        }

        // حفظ معلومات المستخدم في جدول المستخدمين المحذوفين
        const deletedUserData = new DeletedUser({
          originalUserId: user.userId,
          username: user.username,
          email: user.email,
          originalData: {
            profile: user.profile,
            stats: user.stats,
            boxValues: user.boxValues,
            friends: user.friends,
            achievements: user.achievements,
            itemsCollected: user.itemsCollected,
            pearls: user.pearls,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          },
          deletedBy: req.user.username,
          reason: reason || 'حذف جماعي بواسطة المشرف'
        });

        await deletedUserData.save();

        // حذف المستخدم
        await User.findByIdAndDelete(user._id);

        deletedUsers.push({
          originalUserId: deletedUserData.originalUserId,
          username: deletedUserData.username,
          email: deletedUserData.email,
          deletedAt: deletedUserData.deletedAt,
          deletedBy: deletedUserData.deletedBy,
          reason: deletedUserData.reason
        });

        console.log(`🗑️ تم حذف المستخدم ${user.username} (ID: ${user.userId}) في الحذف الجماعي`);

      } catch (error) {
        errors.push(`خطأ في حذف المستخدم ${userId}: ${error.message}`);
      }
    }

    res.json({
      message: `تم حذف ${deletedUsers.length} مستخدم بنجاح`,
      deletedUsers: deletedUsers,
      errors: errors,
      totalDeleted: deletedUsers.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('خطأ في الحذف الجماعي:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// البحث عن المستخدمين المحذوفين (للمشرفين فقط)
router.get('/admin/deleted-users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { originalUserId: parseInt(search) || 0 },
          { email: { $regex: search, $options: 'i' } },
          { deletedBy: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const deletedUsers = await DeletedUser.find(query)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeletedUser.countDocuments(query);

    const results = deletedUsers.map(user => ({
      id: user._id,
      originalUserId: user.originalUserId,
      username: user.username,
      email: user.email,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
      reason: user.reason,
      canRestore: user.canRestore,
      originalData: {
        profile: user.originalData.profile,
        stats: user.originalData.stats,
        createdAt: user.originalData.createdAt
      }
    }));

    res.json({
      deletedUsers: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين المحذوفين:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// استعادة المستخدم المحذوف (للمشرفين فقط)
router.post('/admin/restore-user/:deletedUserId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { deletedUserId } = req.params;

    if (!deletedUserId) {
      return res.status(400).json({ error: 'معرف المستخدم المحذوف مطلوب' });
    }

    // البحث عن المستخدم المحذوف
    const deletedUser = await DeletedUser.findById(deletedUserId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'المستخدم المحذوف غير موجود' });
    }

    if (!deletedUser.canRestore) {
      return res.status(403).json({ error: 'لا يمكن استعادة هذا المستخدم' });
    }

    // التحقق من عدم وجود مستخدم بنفس المعرف
    const existingUser = await User.findOne({ userId: deletedUser.originalUserId });
    if (existingUser) {
      return res.status(400).json({ error: 'يوجد مستخدم آخر بنفس المعرف' });
    }

    // إنشاء مستخدم جديد من البيانات المحذوفة
    const restoredUser = new User({
      userId: deletedUser.originalUserId,
      username: deletedUser.username,
      email: deletedUser.email,
      password: deletedUser.originalData.password || 'tempPassword123',
      profile: deletedUser.originalData.profile || {},
      stats: deletedUser.originalData.stats || { score: 0, highScore: 0, roundNumber: 1 },
      boxValues: deletedUser.originalData.boxValues || [],
      friends: deletedUser.originalData.friends || [],
      achievements: deletedUser.originalData.achievements || [],
      itemsCollected: deletedUser.originalData.itemsCollected || {},
      pearls: deletedUser.originalData.pearls || 0,
      createdAt: deletedUser.originalData.createdAt,
      lastLogin: new Date()
    });

    await restoredUser.save();

    // حذف المستخدم من جدول المحذوفين
    await DeletedUser.findByIdAndDelete(deletedUserId);

    console.log(`🔄 تم استعادة المستخدم ${restoredUser.username} (ID: ${restoredUser.userId}) بواسطة المشرف ${req.user.username}`);

    res.json({
      message: `تم استعادة المستخدم ${restoredUser.username} بنجاح`,
      restoredUser: {
        id: restoredUser._id,
        userId: restoredUser.userId,
        username: restoredUser.username,
        email: restoredUser.email,
        createdAt: restoredUser.createdAt
      }
    });

  } catch (error) {
    console.error('خطأ في استعادة المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// حذف نهائي للمستخدم المحذوف (للمشرفين فقط)
router.delete('/admin/permanently-delete/:deletedUserId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { deletedUserId } = req.params;

    if (!deletedUserId) {
      return res.status(400).json({ error: 'معرف المستخدم المحذوف مطلوب' });
    }

    // البحث عن المستخدم المحذوف
    const deletedUser = await DeletedUser.findById(deletedUserId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'المستخدم المحذوف غير موجود' });
    }

    // حذف نهائي من جدول المحذوفين
    await DeletedUser.findByIdAndDelete(deletedUserId);

    console.log(`💀 تم الحذف النهائي للمستخدم ${deletedUser.username} (ID: ${deletedUser.originalUserId}) بواسطة المشرف ${req.user.username}`);

    res.json({
      message: `تم الحذف النهائي للمستخدم ${deletedUser.username} بنجاح`,
      permanentlyDeleted: {
        originalUserId: deletedUser.originalUserId,
        username: deletedUser.username,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('خطأ في الحذف النهائي:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// جلب المستخدمين مع معرفاتهم (للمشرفين فقط)
router.get('/admin/users-with-ids', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { userId: parseInt(search) || 0 },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('userId username email profile.displayName profile.level stats.score createdAt profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    const results = users.map(user => ({
      id: user._id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      displayName: user.profile?.displayName || user.username,
      level: user.profile?.level || 1,
      score: user.stats?.score || 0,
      avatar: user.profile?.avatar || null,
      createdAt: user.createdAt
    }));

    res.json({
      users: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين مع المعرفات:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// جلب معلومات صور المستخدم (للمشرفين فقط)
router.get('/admin/user-images/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    // البحث بالمعرف الرقمي أولاً
    let user = await User.findOne({ userId: parseInt(userId) });
    
    // إذا لم يتم العثور عليه، جرب البحث بالـ ObjectId
    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        images: {
          avatar: user.profile?.avatar
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب معلومات الصور:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// إدارة صور المستخدم (للمشرفين فقط)
router.put('/admin/manage-user-image', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { targetUserId, action, imageData, imageType } = req.body;

    console.log('📝 طلب إدارة الصورة:', { 
      targetUserId, 
      action, 
      imageType,
      imageDataLength: imageData ? imageData.length : 0 
    });

    if (!targetUserId || !action) {
      console.log('❌ بيانات مفقودة:', { targetUserId, action });
      return res.status(400).json({ error: 'معرف المستخدم والإجراء مطلوبان' });
    }

    // البحث عن المستخدم - معالجة أنواع البيانات المختلفة
    let user = null;
    
    // إذا كان targetUserId رقم، ابحث بالـ userId
    if (!isNaN(targetUserId)) {
      user = await User.findOne({ userId: parseInt(targetUserId) });
      console.log('🔍 البحث بالـ userId:', parseInt(targetUserId), user ? 'تم العثور عليه' : 'غير موجود');
    }
    
    // إذا لم يتم العثور عليه، جرب البحث بالـ ObjectId
    if (!user) {
      try {
        user = await User.findById(targetUserId);
        console.log('🔍 البحث بالـ ObjectId:', targetUserId, user ? 'تم العثور عليه' : 'غير موجود');
      } catch (err) {
        console.log('❌ خطأ في البحث بالـ ObjectId:', err.message);
      }
    }

    if (!user) {
      console.log('❌ المستخدم غير موجود:', targetUserId);
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', { userId: user.userId, username: user.username });

    // تهيئة profile إذا لم يكن موجوداً
    if (!user.profile) {
      user.profile = {};
      console.log('📝 تم تهيئة profile للمستخدم');
    }

    let message = '';

    switch (action) {
      case 'remove_avatar':
        console.log('🗑️ حذف الصورة الشخصية للمستخدم:', user.username);
        user.profile.avatar = null;
        message = 'تم حذف الصورة الشخصية بنجاح';
        break;

      case 'change_avatar':
        if (!imageData) {
          console.log('❌ بيانات الصورة مفقودة للـ change_avatar');
          return res.status(400).json({ error: 'بيانات الصورة مطلوبة' });
        }
        
        // تحقق من حجم البيانات (الحد الأقصى 3MB)
        const maxDataSize = 3 * 1024 * 1024; // 3MB
        if (imageData.length > maxDataSize) {
          console.log('❌ حجم البيانات كبير جداً:', imageData.length, 'bytes');
          return res.status(400).json({ error: 'حجم الصورة كبير جداً. الحد الأقصى 3MB' });
        }
        
        console.log('🖼️ تغيير الصورة الشخصية للمستخدم:', user.username, 'حجم البيانات:', imageData.length);
        user.profile.avatar = imageData;
        message = 'تم تغيير الصورة الشخصية بنجاح';
        break;

      default:
        console.log('❌ إجراء غير صالح:', action);
        return res.status(400).json({ error: 'إجراء غير صالح' });
    }

    console.log('💾 محاولة حفظ التغييرات...');
    await user.save();
    console.log('💾 تم حفظ التغييرات بنجاح');

    console.log(`🖼️ المشرف ${req.user.username} ${action} للمستخدم ${user.username}`);

    const responseData = {
      message: message,
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        images: {
          avatar: user.profile.avatar
        }
      }
    };

    console.log('📤 إرسال الاستجابة:', { message, userId: user.userId });
    res.json(responseData);

  } catch (error) {
    console.error('❌ خطأ في إدارة صورة المستخدم:', error);
    console.error('❌ تفاصيل الخطأ:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'خطأ في الخادم',
      message: 'حدث خطأ غير متوقع',
      details: error.message 
    });
  }
});

// تحديث معرف المستخدم (للمشرفين فقط)
router.put('/admin/update-user-id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { targetUserId, newUserId } = req.body;

    console.log('🆔 طلب تحديث معرف المستخدم:', { targetUserId, newUserId });
    console.log('📋 نوع البيانات:', { 
      targetUserId: typeof targetUserId, 
      newUserId: typeof newUserId 
    });
    console.log('📋 البيانات الخام:', req.body);
    console.log('📋 طول البيانات:', {
      targetUserId: targetUserId ? targetUserId.toString().length : 0,
      newUserId: newUserId ? newUserId.toString().length : 0
    });
    console.log('📋 فحص الأرقام:', {
      targetUserIdIsNumber: !isNaN(parseInt(targetUserId)),
      newUserIdIsNumber: !isNaN(parseInt(newUserId))
    });

    if (!targetUserId || !newUserId) {
      console.log('❌ بيانات مفقودة:', { targetUserId, newUserId });
      return res.status(400).json({ error: 'معرف المستخدم الحالي والجديد مطلوبان' });
    }

    // التحقق من أن المعرفات أرقام صحيحة
    const targetUserIdNum = parseInt(targetUserId);
    const newUserIdNum = parseInt(newUserId);

    console.log('🔢 المعرفات المحولة:', { targetUserIdNum, newUserIdNum });

    if (isNaN(targetUserIdNum) || isNaN(newUserIdNum)) {
      console.log('❌ المعرفات ليست أرقام صحيحة:', { targetUserId, newUserId });
      return res.status(400).json({ error: 'معرفات المستخدم يجب أن تكون أرقام صحيحة' });
    }

    if (newUserIdNum < 1) {
      console.log('❌ المعرف الجديد يجب أن يكون أكبر من صفر:', newUserIdNum);
      return res.status(400).json({ error: 'المعرف الجديد يجب أن يكون أكبر من صفر' });
    }

    // البحث عن المستخدم
    console.log('🔍 البحث عن المستخدم بالمعرف:', targetUserIdNum);
    let user = await User.findOne({ userId: targetUserIdNum });
    if (!user) {
      console.log('❌ المستخدم غير موجود بالمعرف:', targetUserIdNum);
      
      // محاولة البحث بجميع المستخدمين لمعرفة المعرفات الموجودة
      const allUsers = await User.find({}).select('userId username').limit(10);
      console.log('🔍 المستخدمين الموجودين:', allUsers.map(u => ({ userId: u.userId, username: u.username })));
      
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', { userId: user.userId, username: user.username });

    // التحقق من أن المعرف الجديد غير مستخدم
    console.log('🔍 التحقق من المعرف الجديد:', newUserIdNum);
    const existingUser = await User.findOne({ userId: newUserIdNum });
    if (existingUser) {
      console.log('❌ المعرف الجديد مستخدم بالفعل:', newUserIdNum, 'بواسطة:', existingUser.username);
      return res.status(400).json({ error: 'المعرف الجديد مستخدم بالفعل' });
    }

    // تحديث المعرف
    const oldUserId = user.userId;
    user.userId = newUserIdNum;
    
    console.log('💾 محاولة حفظ التغييرات...');
    await user.save();
    console.log('💾 تم حفظ التغييرات بنجاح');

    console.log(`🆔 المشرف ${req.user.username} غير معرف المستخدم ${oldUserId} إلى ${newUserIdNum}`);

    res.json({
      message: 'تم تحديث معرف المستخدم بنجاح',
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث معرف المستخدم:', error);
    console.error('❌ تفاصيل الخطأ:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'خطأ في الخادم',
      message: 'حدث خطأ غير متوقع',
      details: error.message 
    });
  }
});

// تعيين معرف للمستخدمين الذين لا يحتويون على userId (للمشرفين فقط)
router.post('/admin/assign-user-id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username } = req.body;

    console.log('🆔 طلب تعيين معرف للمستخدم:', username);

    if (!username) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', {
      userId: user.userId,
      username: user.username,
      _id: user._id
    });

    // إذا كان المستخدم يحتوي على userId، لا نحتاج لتعيينه
    if (user.userId) {
      return res.status(400).json({ 
        error: 'المستخدم يحتوي على معرف بالفعل',
        userId: user.userId 
      });
    }

    // البحث عن أعلى معرف موجود
    const highestUser = await User.findOne({}, {}, { sort: { 'userId': -1 } });
    const nextUserId = highestUser ? highestUser.userId + 1 : 1500;

    console.log('🆔 تعيين المعرف الجديد:', nextUserId);

    // تعيين المعرف الجديد
    user.userId = nextUserId;
    await user.save();

    console.log(`🆔 تم تعيين المعرف ${nextUserId} للمستخدم ${username}`);

    res.json({
      message: 'تم تعيين معرف المستخدم بنجاح',
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تعيين معرف المستخدم:', error);
    res.status(500).json({ 
      error: 'خطأ في الخادم',
      message: 'حدث خطأ غير متوقع',
      details: error.message 
    });
  }
});

// تحديث الصورة الشخصية للمستخدم
router.put('/update-avatar', verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body;

    console.log('🖼️ طلب تحديث الصورة الشخصية للمستخدم:', req.user.username);
    console.log('📋 البيانات المرسلة:', { hasAvatar: !!avatar, avatarLength: avatar ? avatar.length : 0 });
    console.log('🔍 معرف المستخدم من التوكن:', req.user._id);

    if (!avatar) {
      console.log('❌ الصورة الشخصية مفقودة');
      return res.status(400).json({ error: 'الصورة الشخصية مطلوبة' });
    }

    // البحث عن المستخدم بعدة طرق
    let user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('❌ المستخدم غير موجود بـ _id، محاولة البحث بـ username');
      user = await User.findOne({ username: req.user.username });
    }
    
    if (!user) {
      console.log('❌ المستخدم غير موجود بـ username، محاولة البحث بـ userId');
      user = await User.findOne({ userId: req.user.userId });
    }

    if (!user) {
      console.log('❌ المستخدم غير موجود بأي طريقة');
      console.log('🔍 معلومات المستخدم من التوكن:', {
        _id: req.user._id,
        username: req.user.username,
        userId: req.user.userId
      });
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', { 
      _id: user._id, 
      userId: user.userId, 
      username: user.username 
    });

    // تهيئة profile إذا لم يكن موجوداً
    if (!user.profile) {
      console.log('📝 تهيئة profile للمستخدم:', user.username);
      user.profile = {
        bio: 'مرحباً! أنا لاعب في VoiceBoom 🎮',
        displayName: user.username,
        level: 1,
        experience: 0,
        status: 'offline',
        joinDate: new Date(),
        lastSeen: new Date()
      };
    }

    // تحديث الصورة الشخصية
    user.profile.avatar = avatar;
    
    console.log('💾 محاولة حفظ التغييرات...');
    await user.save();
    console.log('💾 تم حفظ التغييرات بنجاح');

    console.log(`🖼️ تم تحديث الصورة الشخصية للمستخدم ${user.username}`);

    res.json({
      message: 'تم تحديث الصورة الشخصية بنجاح',
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        avatar: user.profile.avatar
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الصورة الشخصية:', error);
    console.error('❌ تفاصيل الخطأ:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'خطأ في تحديث الصورة الشخصية',
      message: 'حدث خطأ غير متوقع',
      details: error.message 
    });
  }
});

// route اختبار للتأكد من أن المسارات تعمل
router.get('/test-avatar-route', (req, res) => {
  res.json({ 
    message: 'route تحديث الصورة الشخصية متاح',
    timestamp: new Date().toISOString()
  });
});

// مسار لإضافة صديق بالبحث عن اسم المستخدم أو المعرف
router.post('/friends/add', verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const { targetUsername } = req.body;
    
    if (!targetUsername) {
      return res.status(400).json({ message: 'اسم المستخدم أو المعرف مطلوب' });
    }

    // تهيئة relationships إذا لم تكن موجودة
    if (!currentUser.relationships) {
      currentUser.relationships = { friends: [] };
    }

    // البحث عن المستخدم الهدف (باسم المستخدم أو المعرف)
    let targetUser;
    const targetUserId = parseInt(targetUsername);
    
    if (!isNaN(targetUserId)) {
      // البحث بالمعرف
      targetUser = await User.findOne({ userId: targetUserId });
    } else {
      // البحث باسم المستخدم
      targetUser = await User.findOne({ username: targetUsername });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // تهيئة relationships للمستخدم الهدف إذا لم تكن موجودة
    if (!targetUser.relationships) {
      targetUser.relationships = { friends: [] };
    }

    // التحقق من عدم إضافة نفسك
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك إضافة نفسك كصديق' });
    }

    // التحقق من وجود الصداقة بالفعل
    const existingFriendship = currentUser.relationships.friends.find(
      friend => friend.userId === targetUser.userId
    );

    if (existingFriendship) {
      return res.status(400).json({ message: 'أنتما أصدقاء بالفعل' });
    }

    // إضافة الصديق للمستخدم الحالي
    currentUser.relationships.friends.push({
      userId: targetUser.userId,
      username: targetUser.username,
      displayName: targetUser.profile?.displayName || targetUser.username,
      avatar: targetUser.profile?.avatar || 'default-avatar.png',
      addedAt: new Date()
    });

    // إضافة المستخدم الحالي كصديق للمستخدم الهدف
    targetUser.relationships.friends.push({
      userId: currentUser.userId,
      username: currentUser.username,
      displayName: currentUser.profile?.displayName || currentUser.username,
      avatar: currentUser.profile?.avatar || 'default-avatar.png',
      addedAt: new Date()
    });

    await currentUser.save();
    await targetUser.save();

    console.log('✅ تم إضافة صديق:', {
      from: currentUser.username,
      to: targetUser.username,
      fromUserId: currentUser.userId,
      toUserId: targetUser.userId
    });

    res.json({
      message: `تم إضافة ${targetUser.profile?.displayName || targetUser.username} كصديق بنجاح!`,
      friend: {
        userId: targetUser.userId,
        username: targetUser.username,
        displayName: targetUser.profile?.displayName || targetUser.username,
        avatar: targetUser.profile?.avatar || 'default-avatar.png'
      }
    });

  } catch (error) {
    console.error('خطأ في إضافة الصديق:', error);
    res.status(500).json({ message: 'خطأ داخلي في إضافة الصديق', error: error.message });
  }
});

module.exports = router; 