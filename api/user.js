const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // تصحيح المسار
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('./auth');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123'; // تصحيح ||

// دالة Middleware للتحقق من التوكن (يمكن أن تكون في ملف منفصل لسهولة إعادة الاستخدام)
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
    console.log('✅ تم فك تشفير التوكن بنجاح:', { userId: decoded.userId, username: decoded.username });
    req.user = decoded; // تخزين معلومات المستخدم (userId, username, isAdmin) في req.user
    next();
  } catch (err) {
    console.log('❌ خطأ في فك تشفير التوكن:', err.message);
    return res.status(401).json({ message: 'توكن غير صالح' });
  }
}

// دالة Middleware للتحقق من صلاحية المشرف (إذا كنت تحتاجها بشكل منفصل)
function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) { // req.user تم تعيينه بواسطة verifyToken
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

// مسار جديد: جلب إعدادات اللعبة (للجميع) - *** يجب وضعه هنا قبل المسارات الأخرى ***
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
router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user.userId تم تعيينه من التوكن بواسطة verifyToken
    const user = await User.findById(req.user.userId).select('-password'); // لا ترجع كلمة المرور

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // إرجاع البيانات التي تحتاجها الواجهة الأمامية، بما في ذلك بيانات اللعبة الجديدة
    res.json({
        username: user.username,
        score: user.stats.score,
        isAdmin: user.isAdmin,
        personalScore: user.stats.personalScore,
        highScore: user.stats.highScore,
        roundNumber: user.stats.roundNumber,
        singleShotsUsed: user.weapons.singleShotsUsed,
        tripleShotsUsed: user.weapons.tripleShotsUsed,
        hammerShotsUsed: user.weapons.hammerShotsUsed,
        boxValues: user.boxValues,
        itemsCollected: user.itemsCollected,
        collectedGems: user.collectedGems,
        totalGemsCollected: user.totalGemsCollected,
        batsHit: user.batsHit,
        profile: user.profile,
        stats: user.stats,
        weapons: user.weapons,
        achievements: user.achievements,
        badges: user.badges,
        relationships: user.relationships
    });

  } catch (error) {
    console.error("خطأ في جلب بيانات المستخدم:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب بيانات المستخدم' });
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
        if (scoreDiff > 10000) { // أكثر من 10,000 نقطة دفعة واحدة
            suspiciousActivity.push(`زيادة غير طبيعية في النقاط: ${scoreDiff}`);
        }
        
        // Check for negative score
        if (score < 0) {
            suspiciousActivity.push('نقاط سالبة غير مسموحة');
        }
        
        // Check for unrealistic high score
        if (highScore > 1000000) { // أكثر من مليون نقطة
            suspiciousActivity.push(`نتيجة عالية غير طبيعية: ${highScore}`);
        }
        
        // Check for unrealistic items collected
        if (itemsCollected) {
            Object.entries(itemsCollected).forEach(([item, count]) => {
                if (count > 1000) { // أكثر من 1000 عنصر من نوع واحد
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
            
            // If multiple suspicious activities, consider blocking
            if (user.suspiciousActivity.length > 3) {
                return res.status(403).json({ 
                    message: 'تم اكتشاف نشاط مشبوه. تم حظر الحفظ مؤقتاً.',
                    suspiciousActivity: suspiciousActivity
                });
            }
        }

        // Update user data
        user.stats.score = score;
        user.stats.highScore = highScore;
        user.stats.roundNumber = roundNumber;
        if (itemsCollected) user.itemsCollected = itemsCollected;
        if (collectedGems !== undefined) user.collectedGems = collectedGems;
        if (totalGemsCollected !== undefined) user.totalGemsCollected = totalGemsCollected;
        if (batsHit !== undefined) user.batsHit = batsHit;
        if (totalSpent !== undefined) user.totalSpent = totalSpent;

        await user.save();

        res.json({ 
            message: 'تم حفظ بيانات اللعبة بنجاح', 
            score: user.stats.score, 
            highScore: user.stats.highScore, 
            roundNumber: user.stats.roundNumber,
            suspiciousActivity: suspiciousActivity.length > 0 ? suspiciousActivity : null
        });
    } catch (error) {
        console.error('Error saving game data:', error);
        res.status(500).json({ message: 'خطأ في الخادم أثناء حفظ بيانات اللعبة' });
    }
});

// تعديل نقاط المستخدم (فقط للمشرف)
router.post('/update-score', verifyToken, verifyAdmin, async (req, res) => { // إضافة verifyToken هنا
  const { username, newScore } = req.body;

  try {
    const user = await User.findOneAndUpdate({ username }, { 'stats.score': newScore }, { new: true }); // إصلاح: استخدام stats.score
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.json({ message: 'تم تحديث النقاط بنجاح', user });

  } catch (err) {
    console.error("خطأ في تحديث النقاط:", err); // إضافة console.error
    res.status(500).json({ message: 'خطأ في الخادم أثناء تحديث النقاط' });
  }
});

// مسار جديد: جلب بيانات المستخدم بواسطة اسم المستخدم (لصفحة المشرف)
router.get('/:username', verifyToken, async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }).select('-password'); // لا ترجع كلمة المرور

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({
        username: user.username,
        score: user.stats.score,
        boxesOpened: user.stats.boxesOpened,
        settings: user.settings, // Include the entire settings object
        isAdmin: user.isAdmin,
        personalScore: user.stats.personalScore,
        highScore: user.stats.highScore,
        roundNumber: user.stats.roundNumber,
        singleShotsUsed: user.weapons.singleShotsUsed,
        tripleShotsUsed: user.weapons.tripleShotsUsed,
        hammerShotsUsed: user.weapons.hammerShotsUsed,
        boxValues: user.boxValues // إضافة قيم الصناديق الحالية
    });

  } catch (error) {
    console.error("خطأ في جلب بيانات المستخدم بواسطة اسم المستخدم:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب بيانات المستخدم' });
  }
});

// مسار جديد: تعيين مستخدم كمشرف (للتطوير فقط - يجب تأمينه بشكل أفضل في الإنتاج)
router.post('/set-admin', verifyToken, async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOneAndUpdate({ username }, { isAdmin: true }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: `تم تعيين ${username} كمشرف بنجاح!`, user });
  } catch (error) {
    console.error("خطأ في تعيين المشرف:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء تعيين المشرف' });
  }
});

// مسار جديد: تحديث دور المستخدم (فقط للمشرف)
router.post('/update-role', verifyToken, verifyAdmin, async (req, res) => {
  const { username, role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'الدور غير صالح. يجب أن يكون "user" أو "admin".' });
  }

  try {
    const user = await User.findOneAndUpdate({ username }, { isAdmin: (role === 'admin') }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: `تم تحديث دور ${username} إلى ${role} بنجاح!`, user });
  } catch (error) {
    console.error("خطأ في تحديث دور المستخدم:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء تحديث دور المستخدم' });
  }
});

// مسار جديد: حذف المستخدم (فقط للمشرف)
router.post('/delete', verifyToken, verifyAdmin, async (req, res) => {
  const { username } = req.body;

  try {
    console.log(`Attempting to delete user: ${username}`); // Add this line for debugging
    const user = await User.findOneAndDelete({ username });

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: `تم حذف المستخدم ${username} بنجاح!` });
  } catch (error) {
    console.error("خطأ في حذف المستخدم:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء حذف المستخدم' });
  }
});

// مسار جديد: إضافة صناديق للمستخدم (فقط للمشرف)
router.post('/add-boxes', verifyToken, verifyAdmin, async (req, res) => {
  const { username, count, value } = req.body;

  if (typeof count !== 'number' || count <= 0) {
    return res.status(400).json({ message: 'العدد غير صالح. يجب أن يكون رقمًا موجبًا.' });
  }
  if (typeof value !== 'number' || value <= 0) {
    return res.status(400).json({ message: 'القيمة غير صالحة. يجب أن تكون رقمًا موجبًا.' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { $inc: { 'stats.boxesOpened': count }, $push: { boxValues: { $each: Array(count).fill(value) } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: `تم إضافة ${count} صندوق للمستخدم ${username} بنجاح!`, user });
  } catch (error) {
    console.error("خطأ في إضافة الصناديق:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء إضافة الصناديق' });
  }
});

// مسار جديد: حفظ إعدادات اللعبة (فقط للمشرف)
router.post('/settings', verifyToken, verifyAdmin, async (req, res) => {
  const { gameSettings } = req.body;

  try {
    // Find the admin user (assuming settings are global or tied to an admin user)
    // A more robust solution might involve a dedicated Settings model
    const adminUser = await User.findOne({ isAdmin: true });

    if (!adminUser) {
      return res.status(404).json({ message: 'لم يتم العثور على مستخدم مشرف لحفظ الإعدادات.' });
    }

    adminUser.settings.gameSettings = gameSettings;
    await adminUser.save();

    res.json({ message: 'تم حفظ إعدادات اللعبة بنجاح!', settings: adminUser.settings.gameSettings });
  } catch (error) {
    console.error("خطأ في حفظ إعدادات اللعبة:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء حفظ إعدادات اللعبة' });
  }
});

// مسار جديد: تحديث بيانات المستخدم (للمشرف)
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { score, totalSpent, itemsCollected, stats, weapons, profile, achievements, badges, relationships } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!user.stats) user.stats = { score: 0, pearls: 0, highScore: 0, roundNumber: 0, personalScore: 50, boxesOpened: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0, totalPlayTime: 0, averageScore: 0 };
    if (!user.itemsCollected) user.itemsCollected = { gems: 0, keys: 0, coins: 0, pearls: 0, bombs: 0, stars: 0, bat: 0 };
    if (!user.weapons) user.weapons = { singleShotsUsed: 0, tripleShotsUsed: 0, hammerShotsUsed: 0, totalShots: 0, accuracy: 0 };
    if (!user.profile) user.profile = { displayName: user.username, bio: 'مرحباً! أنا لاعب في VoiceBoom 🎮', avatar: 'default-avatar.png', level: 1, experience: 0, joinDate: new Date(), lastSeen: new Date(), status: 'offline' };
    if (!user.achievements) user.achievements = [];
    if (!user.badges) user.badges = [];
    if (!user.relationships) user.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };

    // تحديث البيانات المرسلة
    if (score !== undefined) user.stats.score = score;
    if (totalSpent !== undefined) user.totalSpent = totalSpent;
    if (itemsCollected) user.itemsCollected = { ...user.itemsCollected, ...itemsCollected };
    if (stats) user.stats = { ...user.stats, ...stats };
    if (weapons) user.weapons = { ...user.weapons, ...weapons };
    if (profile) user.profile = { ...user.profile, ...profile };
    if (achievements) user.achievements = achievements;
    if (badges) user.badges = badges;
    if (relationships) user.relationships = { ...user.relationships, ...relationships };

    await user.save();

    res.json({ 
      message: 'تم تحديث بيانات المستخدم بنجاح',
      user: {
        username: user.username,
        score: user.stats.score,
        totalSpent: user.totalSpent,
        itemsCollected: user.itemsCollected,
        stats: user.stats,
        weapons: user.weapons,
        profile: user.profile,
        achievements: user.achievements,
        badges: user.badges,
        relationships: user.relationships
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث بيانات المستخدم:', error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء تحديث بيانات المستخدم' });
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
      { $inc: { score: amount } }, // زيادة حقل النقاط (score) بالمبلغ المحدد
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

  try {
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json(user);
  } catch (error) {
    console.error("خطأ في جلب بيانات المستخدم:", error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب بيانات المستخدم' });
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

// إرسال طلب صداقة
router.post('/friend-request', verifyToken, async (req, res) => {
  try {
    const { toUserId, message = '' } = req.body;
    const fromUserId = req.user.userId;

    if (!toUserId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'لا يمكنك إرسال طلب صداقة لنفسك' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من عدم وجود طلب سابق
    const existingRequest = toUser.relationships.friendRequests.find(
      req => req.fromUserId.toString() === fromUserId
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'تم إرسال طلب صداقة بالفعل' });
    }

    // التحقق من عدم وجود صداقة
    const existingFriendship = toUser.relationships.friends.find(
      friend => friend.userId.toString() === fromUserId
    );

    if (existingFriendship) {
      return res.status(400).json({ error: 'أنتما أصدقاء بالفعل' });
    }

    // إضافة طلب الصداقة
    toUser.relationships.friendRequests.push({
      fromUserId: fromUserId,
      sentAt: new Date(),
      message: message
    });

    await toUser.save();

    res.json({
      success: true,
      message: 'تم إرسال طلب الصداقة بنجاح'
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
    const toUserId = req.user.userId;

    if (!fromUserId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    const toUser = await User.findById(toUserId);
    const fromUser = await User.findById(fromUserId);

    if (!toUser || !fromUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // البحث عن طلب الصداقة
    const requestIndex = toUser.relationships.friendRequests.findIndex(
      req => req.fromUserId.toString() === fromUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    // إزالة طلب الصداقة
    const request = toUser.relationships.friendRequests.splice(requestIndex, 1)[0];

    // إضافة الصداقة لكلا المستخدمين
    toUser.relationships.friends.push({
      userId: fromUserId,
      addedAt: new Date(),
      status: 'active'
    });

    fromUser.relationships.friends.push({
      userId: toUserId,
      addedAt: new Date(),
      status: 'active'
    });

    await toUser.save();
    await fromUser.save();

    res.json({
      success: true,
      message: 'تم قبول طلب الصداقة بنجاح'
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
    const toUserId = req.user.userId;

    if (!fromUserId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    const toUser = await User.findById(toUserId);

    if (!toUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // البحث عن طلب الصداقة
    const requestIndex = toUser.relationships.friendRequests.findIndex(
      req => req.fromUserId.toString() === fromUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    // إزالة طلب الصداقة
    toUser.relationships.friendRequests.splice(requestIndex, 1);

    await toUser.save();

    res.json({
      success: true,
      message: 'تم رفض طلب الصداقة'
    });

  } catch (error) {
    console.error('خطأ في رفض طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في رفض طلب الصداقة' });
  }
});

// حظر مستخدم
router.post('/block-user', verifyToken, async (req, res) => {
  try {
    const { userId: userToBlock, reason = '' } = req.body;
    const currentUserId = req.user.userId;

    if (!userToBlock) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    if (currentUserId === userToBlock) {
      return res.status(400).json({ error: 'لا يمكنك حظر نفسك' });
    }

    const currentUser = await User.findById(currentUserId);
    const userToBlockData = await User.findById(userToBlock);

    if (!currentUser || !userToBlockData) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من عدم وجود حظر سابق
    const existingBlock = currentUser.relationships.blockedUsers.find(
      block => block.userId.toString() === userToBlock
    );

    if (existingBlock) {
      return res.status(400).json({ error: 'المستخدم محظور بالفعل' });
    }

    // إضافة الحظر
    currentUser.relationships.blockedUsers.push({
      userId: userToBlock,
      blockedAt: new Date(),
      reason: reason
    });

    // إزالة الصداقة إذا كانت موجودة
    const friendshipIndex = currentUser.relationships.friends.findIndex(
      friend => friend.userId.toString() === userToBlock
    );

    if (friendshipIndex !== -1) {
      currentUser.relationships.friends.splice(friendshipIndex, 1);
    }

    // إزالة طلبات الصداقة
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      req => req.fromUserId.toString() === userToBlock
    );

    if (requestIndex !== -1) {
      currentUser.relationships.friendRequests.splice(requestIndex, 1);
    }

    await currentUser.save();

    res.json({
      success: true,
      message: 'تم حظر المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حظر المستخدم:', error);
    res.status(500).json({ error: 'خطأ في حظر المستخدم' });
  }
});

// إلغاء حظر مستخدم
router.post('/unblock-user', verifyToken, async (req, res) => {
  try {
    const { userId: userToUnblock } = req.body;
    const currentUserId = req.user.userId;

    if (!userToUnblock) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // البحث عن الحظر
    const blockIndex = currentUser.relationships.blockedUsers.findIndex(
      block => block.userId.toString() === userToUnblock
    );

    if (blockIndex === -1) {
      return res.status(404).json({ error: 'المستخدم غير محظور' });
    }

    // إزالة الحظر
    currentUser.relationships.blockedUsers.splice(blockIndex, 1);

    await currentUser.save();

    res.json({
      success: true,
      message: 'تم إلغاء حظر المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إلغاء حظر المستخدم:', error);
    res.status(500).json({ error: 'خطأ في إلغاء حظر المستخدم' });
  }
});

// البحث عن مستخدمين
router.get('/search-users', verifyToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    const currentUserId = req.user.userId;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'يجب إدخال نص بحث مكون من حرفين على الأقل' });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { 'profile.displayName': { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: currentUserId } }
      ]
    })
    .select('username profile.displayName profile.avatar stats.score relationships.friends relationships.friendRequests relationships.blockedUsers')
    .limit(parseInt(limit));

    const currentUser = await User.findById(currentUserId);
    const currentUserFriends = currentUser.relationships.friends.map(f => f.userId.toString());
    const currentUserRequests = currentUser.relationships.friendRequests.map(r => r.fromUserId.toString());
    const currentUserBlocked = currentUser.relationships.blockedUsers.map(b => b.userId.toString());

    const searchResults = users.map(user => {
      const isFriend = currentUserFriends.includes(user._id.toString());
      const hasRequest = currentUserRequests.includes(user._id.toString());
      const isBlocked = currentUserBlocked.includes(user._id.toString());

      return {
        id: user._id,
        username: user.username,
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
        score: user.stats.score,
        relationship: isFriend ? 'friend' : hasRequest ? 'request_sent' : isBlocked ? 'blocked' : 'none'
      };
    });

    res.json({
      users: searchResults,
      total: searchResults.length
    });

  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في البحث عن المستخدمين' });
  }
});

// الحصول على بروفايل المستخدم
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password -suspiciousActivity');
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // التحقق من إعدادات الخصوصية
    if (!user.settings.privacy.showProfile) {
      return res.status(403).json({ error: 'هذا البروفايل خاص' });
    }
    
    res.json({
      profile: user.profile,
      stats: user.settings.privacy.showStats ? user.stats : null,
      achievements: user.achievements,
      badges: user.badges,
      relationships: {
        friendsCount: user.relationships.friends.filter(f => f.status === 'accepted').length,
        followersCount: user.relationships.followers.length,
        followingCount: user.relationships.following.length
      }
    });
  } catch (error) {
    console.error('خطأ في الحصول على البروفايل:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تحديث بروفايل المستخدم
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, bio, avatar, country, timezone } = req.body;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // تحديث البيانات المسموح بها
    if (displayName) user.profile.displayName = displayName;
    if (bio) user.profile.bio = bio;
    if (avatar) user.profile.avatar = avatar;
    if (country) user.profile.country = country;
    if (timezone) user.profile.timezone = timezone;
    
    await user.save();
    
    res.json({ 
      message: 'تم تحديث البروفايل بنجاح',
      profile: user.profile 
    });
  } catch (error) {
    console.error('خطأ في تحديث البروفايل:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// البحث عن المستخدمين
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    const userId = req.user.userId;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'يجب إدخال نص بحث مكون من حرفين على الأقل' });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q.trim(), 'i');

    // البحث في المستخدمين الذين يسمحون بالبحث عنهم
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: searchRegex },
            { 'profile.displayName': searchRegex },
            { 'profile.bio': searchRegex }
          ]
        },
        { _id: { $ne: userId } },
        { 'profile.searchable': true },
        { 'profile.showInSearch': true },
        { isBanned: false }
      ]
    })
    .select('username profile.displayName profile.bio profile.avatar profile.level profile.status profile.joinDate')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ 'profile.level': -1, username: 1 });

    // التحقق من حالة الصداقة لكل مستخدم
    const currentUser = await User.findById(userId);
    const usersWithStatus = users.map(user => {
      const isFriend = currentUser.relationships.friends.some(friend => 
        friend.userId.toString() === user._id.toString() && friend.status === 'accepted'
      );
      const hasPendingRequest = currentUser.relationships.friendRequests.some(request => 
        request.from.toString() === user._id.toString()
      );
      const hasSentRequest = currentUser.relationships.friends.some(friend => 
        friend.userId.toString() === user._id.toString() && friend.status === 'pending'
      );
      const isBlocked = currentUser.relationships.blockedUsers.some(blocked => 
        blocked.userId.toString() === user._id.toString()
      );

      return {
        _id: user._id,
        username: user.username,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        avatar: user.profile.avatar,
        level: user.profile.level,
        status: user.profile.status,
        joinDate: user.profile.joinDate,
        isFriend,
        hasPendingRequest,
        hasSentRequest,
        isBlocked
      };
    });

    res.json({
      users: usersWithStatus,
      total: users.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في البحث عن المستخدمين' });
  }
});

// رفع صورة البروفايل
router.post('/upload-profile-image', verifyToken, async (req, res) => {
  try {
    const { imageData, imageType } = req.body;
    const userId = req.user.userId;

    console.log('🖼️ طلب رفع صورة:', { imageType, userId, dataLength: imageData?.length });

    if (!imageData || !imageType) {
      return res.status(400).json({ error: 'بيانات الصورة مطلوبة' });
    }

    // التحقق من حجم البيانات (10MB كحد أقصى)
    if (imageData.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'حجم الصورة كبير جداً. الحد الأقصى 10MB' });
    }

    // التحقق من نوع الصورة
    if (!['profileImage', 'coverImage'].includes(imageType)) {
      return res.status(400).json({ error: 'نوع صورة غير صحيح' });
    }

    // التحقق من أن البيانات صحيحة
    if (!imageData.startsWith('data:image/') && !/^[A-Za-z0-9+/]*={0,2}$/.test(imageData)) {
      return res.status(400).json({ error: 'بيانات الصورة غير صحيحة' });
    }

    // التحقق من نوع الملف المسموح
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const detectedType = detectImageType(imageData);
    
    if (!allowedTypes.includes(detectedType)) {
      return res.status(400).json({ 
        error: 'نوع الصورة غير مسموح. الأنواع المسموحة: JPG, JPEG, PNG فقط' 
      });
    }

    // التحقق من المحتوى الإباحي
    const isInappropriate = await checkInappropriateContent(imageData);
    if (isInappropriate) {
      console.log('🚫 تم رفض صورة لاحتوائها على محتوى غير لائق');
      logRejectedImage(userId, 'محتوى غير لائق', imageData);
      return res.status(400).json({ 
        error: 'الصورة تحتوي على محتوى غير لائق. يرجى اختيار صورة مناسبة' 
      });
    }

    // في التطبيق الحقيقي، ستقوم بحفظ الصورة في خدمة تخزين مثل AWS S3
    // هنا سنقوم بحفظ البيانات كـ base64 (للتطوير فقط)
    const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;

    // تحديث البروفايل
    const updateField = `profile.${imageType}`;
    await User.findByIdAndUpdate(userId, {
      [updateField]: imageUrl
    });

    console.log('✅ تم رفع الصورة بنجاح');

    res.json({ 
      success: true, 
      message: 'تم رفع الصورة بنجاح',
      imageUrl 
    });
  } catch (error) {
    console.error('❌ خطأ في رفع الصورة:', error);
    res.status(500).json({ error: 'خطأ في رفع الصورة' });
  }
});

// دالة للتحقق من نوع الصورة
function detectImageType(imageData) {
  try {
    // إذا كانت البيانات تحتوي على MIME type
    if (imageData.startsWith('data:image/')) {
      const mimeType = imageData.split(';')[0].split(':')[1];
      return mimeType;
    }
    
    // التحقق من توقيعات الملفات (File Signatures)
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // توقيعات الملفات المعروفة
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    };
    
    for (const [mimeType, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return mimeType;
      }
    }
    
    return 'unknown';
  } catch (error) {
    console.error('خطأ في تحديد نوع الصورة:', error);
    return 'unknown';
  }
}

// دالة للتحقق من المحتوى الإباحي
async function checkInappropriateContent(imageData) {
  try {
    // قائمة الكلمات المفتاحية المحظورة (يمكن توسيعها)
    const inappropriateKeywords = [
      'nude', 'naked', 'porn', 'sex', 'adult', 'explicit', 'xxx', 'nsfw',
      'عري', 'إباحي', 'جنس', 'كبار', 'صريح', 'ممنوع', 'محظور'
    ];
    
    // التحقق من البيانات المشفرة (base64)
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // التحقق من حجم الصورة (الصور الإباحية عادة تكون كبيرة)
    if (base64Data.length > 5 * 1024 * 1024) { // 5MB
      console.log('⚠️ صورة كبيرة - قد تحتاج مراجعة يدوية');
    }
    
    // التحقق من نسبة الألوان (الصور الإباحية عادة تحتوي على ألوان معينة)
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const colorAnalysis = analyzeImageColors(buffer);
      
      // إذا كانت الصورة تحتوي على نسبة عالية من الألوان الجلدية
      if (colorAnalysis.skinToneRatio > 0.7) {
        console.log('⚠️ نسبة عالية من الألوان الجلدية - قد تحتاج مراجعة');
        // يمكن إضافة تحقق إضافي هنا
      }
    } catch (colorError) {
      console.log('⚠️ لا يمكن تحليل ألوان الصورة:', colorError.message);
    }
    
    // التحقق من وجود كلمات محظورة في البيانات (إذا كانت الصورة تحتوي على نص)
    try {
      const decodedData = Buffer.from(base64Data, 'base64').toString('utf8');
      for (const keyword of inappropriateKeywords) {
        if (decodedData.toLowerCase().includes(keyword.toLowerCase())) {
          console.log('🚫 تم العثور على كلمة محظورة:', keyword);
          return true;
        }
      }
    } catch (decodeError) {
      // البيانات ليست نصية، وهذا طبيعي للصور
    }
    
    // في التطبيق الحقيقي، يمكن استخدام خدمات AI مثل:
    // - Google Cloud Vision API
    // - AWS Rekognition
    // - Azure Computer Vision
    // - Cloudinary Moderation
    
    return false;
  } catch (error) {
    console.error('خطأ في التحقق من المحتوى:', error);
    // في حالة الخطأ، نرفض الصورة من باب الأمان
    return true;
  }
}

// دالة لتحليل ألوان الصورة
function analyzeImageColors(buffer) {
  try {
    // هذا تحليل بسيط للألوان
    // في التطبيق الحقيقي، يمكن استخدام مكتبات مثل Sharp أو Jimp
    
    const data = new Uint8Array(buffer);
    let skinTonePixels = 0;
    let totalPixels = 0;
    
    // تحليل كل 10 بكسل (للسرعة)
    for (let i = 0; i < data.length; i += 30) {
      if (i + 2 < data.length) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // التحقق من الألوان الجلدية (تقريب بسيط)
        if (r > 200 && g > 150 && g < 220 && b > 100 && b < 180) {
          skinTonePixels++;
        }
        
        totalPixels++;
      }
    }
    
    return {
      skinToneRatio: totalPixels > 0 ? skinTonePixels / totalPixels : 0
    };
  } catch (error) {
    console.error('خطأ في تحليل الألوان:', error);
    return { skinToneRatio: 0 };
  }
}

// حذف صورة البروفايل
router.delete('/delete-profile-image', verifyToken, async (req, res) => {
  try {
    const { imageType } = req.body;
    const userId = req.user.userId;

    if (!imageType || !['profileImage', 'coverImage'].includes(imageType)) {
      return res.status(400).json({ error: 'نوع صورة غير صحيح' });
    }

    const updateField = `profile.${imageType}`;
    await User.findByIdAndUpdate(userId, {
      [updateField]: null
    });

    res.json({ 
      success: true, 
      message: 'تم حذف الصورة بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في حذف الصورة:', error);
    res.status(500).json({ error: 'خطأ في حذف الصورة' });
  }
});

// تحديث السيرة الذاتية
router.post('/update-bio', verifyToken, async (req, res) => {
  console.log('🔧 تم استلام طلب تحديث السيرة الذاتية:', req.body);
  try {
    const { bio } = req.body;
    const userId = req.user.userId;

    console.log('👤 معرف المستخدم:', userId);

    if (!bio || bio.length > 500) {
      return res.status(400).json({ error: 'السيرة الذاتية يجب أن تكون أقل من 500 حرف' });
    }

    await User.findByIdAndUpdate(userId, {
      'profile.bio': bio
    });

    console.log('✅ تم تحديث السيرة الذاتية بنجاح');

    res.json({ 
      success: true, 
      message: 'تم تحديث السيرة الذاتية بنجاح',
      bio 
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث السيرة الذاتية:', error);
    res.status(500).json({ error: 'خطأ في تحديث السيرة الذاتية' });
  }
});

// تحديث معلومات البروفايل الإضافية
router.post('/update-profile-info', verifyToken, async (req, res) => {
  console.log('🔧 تم استلام طلب تحديث معلومات البروفايل:', req.body);
  try {
    const { 
      displayName, 
      age, 
      gender, 
      interests, 
      favoriteGames,
      socialLinks,
      country,
      timezone 
    } = req.body;
    const userId = req.user.userId;

    console.log('👤 معرف المستخدم:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة حقل profile إذا لم يكن موجوداً
    if (!user.profile) {
      user.profile = {
        displayName: user.username,
        bio: 'مرحباً! أنا لاعب في VoiceBoom 🎮',
        avatar: 'default-avatar.png',
        profileImage: null,
        coverImage: null,
        age: null,
        gender: 'prefer-not-to-say',
        interests: [],
        favoriteGames: [],
        socialLinks: {},
        level: 1,
        experience: 0,
        joinDate: new Date(),
        lastSeen: new Date(),
        status: 'offline',
        country: '',
        timezone: '',
        searchable: true,
        showInSearch: true,
        allowFriendRequests: true,
        allowMessages: true
      };
      await user.save();
    }

    const updateData = {};

    if (displayName && displayName.length <= 50) {
      updateData['profile.displayName'] = displayName;
    }

    if (age && age >= 13 && age <= 100) {
      updateData['profile.age'] = age;
    }

    if (gender && ['male', 'female', 'other', 'prefer-not-to-say'].includes(gender)) {
      updateData['profile.gender'] = gender;
    }

    if (interests && Array.isArray(interests)) {
      updateData['profile.interests'] = interests.slice(0, 10); // حد أقصى 10 اهتمامات
    }

    if (favoriteGames && Array.isArray(favoriteGames)) {
      updateData['profile.favoriteGames'] = favoriteGames.slice(0, 5); // حد أقصى 5 ألعاب
    }

    if (socialLinks && typeof socialLinks === 'object') {
      updateData['profile.socialLinks'] = socialLinks;
    }

    if (country) {
      updateData['profile.country'] = country;
    }

    if (timezone) {
      updateData['profile.timezone'] = timezone;
    }

    await User.findByIdAndUpdate(userId, updateData);

    console.log('✅ تم تحديث معلومات البروفايل بنجاح');

    res.json({ 
      success: true, 
      message: 'تم تحديث معلومات البروفايل بنجاح' 
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث معلومات البروفايل:', error);
    res.status(500).json({ error: 'خطأ في تحديث معلومات البروفايل' });
  }
});

// تحديث إعدادات البحث والخصوصية
router.post('/update-search-settings', verifyToken, async (req, res) => {
  console.log('🔧 تم استلام طلب تحديث إعدادات البحث:', req.body);
  try {
    const { 
      searchable, 
      showInSearch, 
      allowFriendRequests, 
      allowMessages 
    } = req.body;
    const userId = req.user.userId;

    console.log('👤 معرف المستخدم:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة حقل profile إذا لم يكن موجوداً
    if (!user.profile) {
      user.profile = {
        displayName: user.username,
        bio: 'مرحباً! أنا لاعب في VoiceBoom 🎮',
        avatar: 'default-avatar.png',
        profileImage: null,
        coverImage: null,
        age: null,
        gender: 'prefer-not-to-say',
        interests: [],
        favoriteGames: [],
        socialLinks: {},
        level: 1,
        experience: 0,
        joinDate: new Date(),
        lastSeen: new Date(),
        status: 'offline',
        country: '',
        timezone: '',
        searchable: true,
        showInSearch: true,
        allowFriendRequests: true,
        allowMessages: true
      };
      await user.save();
    }

    const updateData = {};

    if (typeof searchable === 'boolean') {
      updateData['profile.searchable'] = searchable;
    }

    if (typeof showInSearch === 'boolean') {
      updateData['profile.showInSearch'] = showInSearch;
    }

    if (typeof allowFriendRequests === 'boolean') {
      updateData['profile.allowFriendRequests'] = allowFriendRequests;
    }

    if (typeof allowMessages === 'boolean') {
      updateData['profile.allowMessages'] = allowMessages;
    }

    await User.findByIdAndUpdate(userId, updateData);

    console.log('✅ تم تحديث إعدادات البحث بنجاح');

    res.json({ 
      success: true, 
      message: 'تم تحديث إعدادات البحث بنجاح' 
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث إعدادات البحث:', error);
    res.status(500).json({ error: 'خطأ في تحديث إعدادات البحث' });
  }
});

// الحصول على معرف المستخدم
router.get('/my-id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('userId username');
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    res.json({
      userId: user.userId,
      username: user.username
    });
  } catch (error) {
    console.error('خطأ في الحصول على معرف المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تغيير معرف المستخدم (للمشرفين فقط)
router.put('/admin/change-user-id', verifyToken, async (req, res) => {
  try {
    // التحقق من أن المستخدم مشرف
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }

    const { targetUserId, newUserId } = req.body;

    if (!targetUserId || newUserId === undefined) {
      return res.status(400).json({ error: 'معرف المستخدم الهدف والمعرف الجديد مطلوبان' });
    }

    // التحقق من أن المعرف الجديد رقم موجب
    if (newUserId < 1) {
      return res.status(400).json({ error: 'المعرف الجديد يجب أن يكون رقم موجب' });
    }

    // البحث عن المستخدم الهدف
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من أن المعرف الجديد غير مستخدم
    const existingUser = await User.findOne({ userId: newUserId });
    if (existingUser && existingUser._id.toString() !== targetUserId) {
      return res.status(400).json({ error: 'المعرف الجديد مستخدم بالفعل' });
    }

    // حفظ المعرف القديم للتوثيق
    const oldUserId = targetUser.userId;

    // تحديث معرف المستخدم
    targetUser.userId = newUserId;
    await targetUser.save();

    // تسجيل العملية
    console.log(`🔧 المشرف ${currentUser.username} غير معرف المستخدم ${targetUser.username} من ${oldUserId} إلى ${newUserId}`);

    res.json({
      success: true,
      message: `تم تغيير معرف المستخدم من ${oldUserId} إلى ${newUserId}`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        oldUserId: oldUserId,
        newUserId: newUserId
      }
    });

  } catch (error) {
    console.error('خطأ في تغيير معرف المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الحصول على قائمة المستخدمين مع معرفاتهم (للمشرفين فقط)
router.get('/admin/users-with-ids', verifyToken, async (req, res) => {
  try {
    // التحقق من أن المستخدم مشرف
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }

    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // بناء query البحث
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { 'profile.displayName': { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // البحث عن المستخدمين
    const users = await User.find(query)
      .select('userId username email profile.displayName profile.level stats.score createdAt')
      .sort({ userId: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // إجمالي عدد المستخدمين
    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('خطأ في جلب قائمة المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// البحث عن معرف مستخدم (للمشرفين فقط)
router.get('/admin/find-user-by-id/:userId', verifyToken, async (req, res) => {
  try {
    // التحقق من أن المستخدم مشرف
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }

    const { userId } = req.params;

    const user = await User.findOne({ userId: parseInt(userId) })
      .select('userId username email profile.displayName profile.level stats.score createdAt');

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ user });

  } catch (error) {
    console.error('خطأ في البحث عن المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// إدارة صور المستخدم (للمشرفين فقط)
router.put('/admin/manage-user-image', verifyToken, async (req, res) => {
  try {
    // التحقق من أن المستخدم مشرف
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }

    const { targetUserId, action, imageData, imageType } = req.body;

    if (!targetUserId || !action) {
      return res.status(400).json({ error: 'معرف المستخدم والإجراء مطلوبان' });
    }

    // البحث عن المستخدم الهدف
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    let result = {};

    switch (action) {
      case 'change_avatar':
        if (!imageData || !imageType) {
          return res.status(400).json({ error: 'بيانات الصورة ونوعها مطلوبان' });
        }
        
        // حفظ الصورة الجديدة
        const avatarUrl = await saveImage(imageData, imageType, `avatar_${targetUserId}`);
        targetUser.profile.avatar = avatarUrl;
        result = { avatar: avatarUrl };
        break;

      case 'change_profile_image':
        if (!imageData || !imageType) {
          return res.status(400).json({ error: 'بيانات الصورة ونوعها مطلوبان' });
        }
        
        // حفظ الصورة الجديدة
        const profileImageUrl = await saveImage(imageData, imageType, `profile_${targetUserId}`);
        targetUser.profile.profileImage = profileImageUrl;
        result = { profileImage: profileImageUrl };
        break;

      case 'change_cover_image':
        if (!imageData || !imageType) {
          return res.status(400).json({ error: 'بيانات الصورة ونوعها مطلوبان' });
        }
        
        // حفظ الصورة الجديدة
        const coverImageUrl = await saveImage(imageData, imageType, `cover_${targetUserId}`);
        targetUser.profile.coverImage = coverImageUrl;
        result = { coverImage: coverImageUrl };
        break;

      case 'remove_avatar':
        targetUser.profile.avatar = 'default-avatar.png';
        result = { avatar: 'default-avatar.png' };
        break;

      case 'remove_profile_image':
        targetUser.profile.profileImage = null;
        result = { profileImage: null };
        break;

      case 'remove_cover_image':
        targetUser.profile.coverImage = null;
        result = { coverImage: null };
        break;

      default:
        return res.status(400).json({ error: 'إجراء غير صحيح' });
    }

    await targetUser.save();

    // تسجيل العملية
    console.log(`🖼️ المشرف ${currentUser.username} ${action} للمستخدم ${targetUser.username}`);

    res.json({
      success: true,
      message: `تم ${action} بنجاح`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        userId: targetUser.userId
      },
      result
    });

  } catch (error) {
    console.error('خطأ في إدارة صورة المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// دالة لحفظ الصورة
async function saveImage(imageData, imageType, filename) {
  try {
    // هنا يمكن إضافة منطق حفظ الصورة
    // يمكن استخدام خدمات مثل Cloudinary أو حفظ محلي
    const timestamp = Date.now();
    const imageUrl = `https://example.com/images/${filename}_${timestamp}.${imageType}`;
    
    // في الوقت الحالي، نعيد URL مؤقت
    return imageUrl;
  } catch (error) {
    console.error('خطأ في حفظ الصورة:', error);
    throw new Error('فشل في حفظ الصورة');
  }
}

// الحصول على معلومات صور المستخدم (للمشرفين فقط)
router.get('/admin/user-images/:userId', verifyToken, async (req, res) => {
  try {
    // التحقق من أن المستخدم مشرف
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }

    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('userId username profile.avatar profile.profileImage profile.coverImage');

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        images: {
          avatar: user.profile.avatar,
          profileImage: user.profile.profileImage,
          coverImage: user.profile.coverImage
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب معلومات الصور:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// نظام تسجيل الصور المرفوضة
const rejectedImages = new Map();

// دالة لتسجيل الصورة المرفوضة
function logRejectedImage(userId, reason, imageData) {
  const logEntry = {
    userId,
    reason,
    timestamp: new Date(),
    imageHash: generateImageHash(imageData),
    // لا نحفظ الصورة نفسها لأسباب أمنية
  };
  
  rejectedImages.set(logEntry.imageHash, logEntry);
  
  // حفظ في قاعدة البيانات (اختياري)
  console.log('🚫 صورة مرفوضة:', {
    userId,
    reason,
    timestamp: logEntry.timestamp
  });
}

// دالة لتوليد هاش للصورة
function generateImageHash(imageData) {
  const crypto = require('crypto');
  const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
  return crypto.createHash('md5').update(base64Data).digest('hex');
}

module.exports = router;
