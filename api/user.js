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
  let token;
  // 1. Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // 2. If not in header, check for token in query parameters (for sendBeacon)
  else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'التوكن مفقود' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // تخزين معلومات المستخدم (id, isAdmin) في req.user
    next();
  } catch (err) {
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
        score: user.score,
        isAdmin: user.isAdmin,
        personalScore: user.personalScore,
        highScore: user.highScore,
        roundNumber: user.roundNumber,
        singleShotsUsed: user.singleShotsUsed,
        tripleShotsUsed: user.tripleShotsUsed,
        hammerShotsUsed: user.hammerShotsUsed,
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

        // Anti-cheat checks
        const suspiciousActivity = [];
        
        // Check for unrealistic score increase
        const scoreDiff = score - user.score;
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
            if (!user.suspiciousActivity) user.suspiciousActivity = [];
            user.suspiciousActivity.push({
                timestamp: new Date(),
                activities: suspiciousActivity,
                oldScore: user.score,
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
        user.score = score;
        user.highScore = highScore;
        user.roundNumber = roundNumber;
        if (itemsCollected) user.itemsCollected = itemsCollected;
        if (collectedGems !== undefined) user.collectedGems = collectedGems;
        if (totalGemsCollected !== undefined) user.totalGemsCollected = totalGemsCollected;
        if (batsHit !== undefined) user.batsHit = batsHit;
        if (totalSpent !== undefined) user.totalSpent = totalSpent;

        await user.save();

        res.json({ 
            message: 'تم حفظ بيانات اللعبة بنجاح', 
            score: user.score, 
            highScore: user.highScore, 
            roundNumber: user.roundNumber,
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
    const user = await User.findOneAndUpdate({ username }, { score: newScore }, { new: true }); // تصحيح score: و new: true
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
        score: user.score,
        boxesOpened: user.boxesOpened,
        settings: user.settings, // Include the entire settings object
        isAdmin: user.isAdmin,
        personalScore: user.personalScore,
        highScore: user.highScore,
        roundNumber: user.roundNumber,
        singleShotsUsed: user.singleShotsUsed,
        tripleShotsUsed: user.tripleShotsUsed,
        hammerShotsUsed: user.hammerShotsUsed,
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
      { $inc: { boxesOpened: count }, $push: { boxValues: { $each: Array(count).fill(value) } } },
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
router.post('/update-user', verifyToken, verifyAdmin, async (req, res) => {
  const { currentUsername, newUsername, newPassword, newScore } = req.body;

  try {
    const user = await User.findOne({ username: currentUsername });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (newUsername) {
      user.username = newUsername;
    }
    if (newPassword) {
      user.password = newPassword; // The pre-save hook in User.js will hash it
    }
    if (newScore !== undefined) {
      user.score = newScore;
    }

    await user.save();

    res.json({ message: 'تم تحديث بيانات المستخدم بنجاح!', user });

  } catch (error) {
    console.error("خطأ في تحديث بيانات المستخدم:", error);
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
    if (score !== undefined) user.score = score;
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

// جلب قائمة الأصدقاء
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json({ friends: user.friends || [] });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم عند جلب الأصدقاء' });
  }
});

// إضافة صديق
router.post('/friends/add', verifyToken, async (req, res) => {
  const { friendUsername } = req.body;
  if (!friendUsername) return res.status(400).json({ message: 'يرجى تحديد اسم الصديق' });
  if (friendUsername === req.user.username) return res.status(400).json({ message: 'لا يمكنك إضافة نفسك' });
  try {
    const user = await User.findById(req.user.userId);
    const friend = await User.findOne({ username: friendUsername });
    if (!user || !friend) return res.status(404).json({ message: 'المستخدم أو الصديق غير موجود' });
    if (user.friends.includes(friendUsername)) return res.status(400).json({ message: 'الصديق مضاف بالفعل' });
    user.friends.push(friendUsername);
    await user.save();
    res.json({ message: 'تمت إضافة الصديق بنجاح', friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم عند إضافة الصديق' });
  }
});

// إزالة صديق
router.post('/friends/remove', verifyToken, async (req, res) => {
  const { friendUsername } = req.body;
  if (!friendUsername) return res.status(400).json({ message: 'يرجى تحديد اسم الصديق' });
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    user.friends = user.friends.filter(f => f !== friendUsername);
    await user.save();
    res.json({ message: 'تمت إزالة الصديق بنجاح', friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم عند إزالة الصديق' });
  }
});

// مراقبة النشاطات المشبوهة (للمشرفين فقط)
router.get('/admin/suspicious-activity', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { 'suspiciousActivity.0': { $exists: true } },
        { score: { $gt: 100000 } },
        { 'itemsCollected.gem': { $gt: 500 } }
      ]
    }).select('username score suspiciousActivity itemsCollected createdAt lastLogin');

    const suspiciousUsers = users.map(user => ({
      username: user.username,
      score: user.score,
      suspiciousActivityCount: user.suspiciousActivity ? user.suspiciousActivity.length : 0,
      lastSuspiciousActivity: user.suspiciousActivity && user.suspiciousActivity.length > 0 
        ? user.suspiciousActivity[user.suspiciousActivity.length - 1] 
        : null,
      itemsCollected: user.itemsCollected,
      createdAt: user.createdAt,
      riskLevel: calculateRiskLevel(user)
    }));

    res.json({
      totalSuspiciousUsers: suspiciousUsers.length,
      users: suspiciousUsers
    });
  } catch (error) {
    console.error('Error fetching suspicious activity:', error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء جلب النشاطات المشبوهة' });
  }
});

// حظر/إلغاء حظر مستخدم (للمشرفين)
router.post('/admin/ban-user', verifyToken, verifyAdmin, async (req, res) => {
  const { username, reason } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    await user.save();

    res.json({ message: `تم حظر المستخدم ${username} بنجاح` });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء حظر المستخدم' });
  }
});

// إعادة تعيين نقاط مستخدم (للمشرفين)
router.post('/admin/reset-user-score', verifyToken, verifyAdmin, async (req, res) => {
  const { username, newScore } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const oldScore = user.score;
    user.score = newScore || 1000; // إعادة تعيين إلى 1000 إذا لم يتم تحديد قيمة
    user.suspiciousActivity = []; // مسح النشاطات المشبوهة
    await user.save();

    res.json({ 
      message: `تم إعادة تعيين نقاط ${username} من ${oldScore} إلى ${user.score}`,
      oldScore,
      newScore: user.score
    });
  } catch (error) {
    console.error('Error resetting user score:', error);
    res.status(500).json({ message: 'خطأ في الخادم أثناء إعادة تعيين النقاط' });
  }
});

// دالة حساب مستوى الخطورة
function calculateRiskLevel(user) {
  let riskScore = 0;
  
  // النشاطات المشبوهة
  if (user.suspiciousActivity && user.suspiciousActivity.length > 0) {
    riskScore += user.suspiciousActivity.length * 10;
  }
  
  // النقاط العالية
  if (user.score > 100000) riskScore += 20;
  if (user.score > 500000) riskScore += 30;
  
  // العناصر الكثيرة
  if (user.itemsCollected) {
    Object.values(user.itemsCollected).forEach(count => {
      if (count > 100) riskScore += 5;
      if (count > 500) riskScore += 10;
    });
  }
  
  // تحديد مستوى الخطورة
  if (riskScore >= 50) return 'عالي';
  if (riskScore >= 20) return 'متوسط';
  return 'منخفض';
}

// جلب كود الدعوة الخاص بالمستخدم
router.get('/invite-code', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    
    res.json({ 
      inviteCode: user.inviteCode,
      invitedUsers: user.invitedUsers || [],
      inviteRewards: user.inviteRewards || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم عند جلب كود الدعوة' });
  }
});

// استخدام كود دعوة
router.post('/use-invite-code', verifyToken, async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ message: 'يرجى إدخال كود الدعوة' });
  
  try {
    const user = await User.findById(req.user.userId);
    const inviter = await User.findOne({ inviteCode: inviteCode.toUpperCase() });
    
    if (!user || !inviter) {
      return res.status(404).json({ message: 'كود الدعوة غير صحيح' });
    }
    
    if (user.invitedBy) {
      return res.status(400).json({ message: 'لقد استخدمت كود دعوة من قبل' });
    }
    
    if (inviter.username === user.username) {
      return res.status(400).json({ message: 'لا يمكنك استخدام كود دعوتك الخاصة' });
    }
    
    // تحديث بيانات المستخدم
    user.invitedBy = inviter.username;
    user.score += 500; // مكافأة للمستخدم الجديد
    
    // تحديث بيانات الداعي
    inviter.invitedUsers.push(user.username);
    inviter.inviteRewards += 1000; // مكافأة للداعي
    inviter.score += 1000;
    
    await user.save();
    await inviter.save();
    
    res.json({ 
      message: 'تم استخدام كود الدعوة بنجاح! حصلت على 500 نقطة مكافأة',
      reward: 500,
      inviterUsername: inviter.username
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم عند استخدام كود الدعوة' });
  }
});

// جلب إحصائيات الدعوات
router.get('/invite-stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    
    const invitedUsers = await User.find({ username: { $in: user.invitedUsers || [] } })
      .select('username score createdAt');
    
    res.json({
      inviteCode: user.inviteCode,
      invitedUsers: user.invitedUsers || [],
      inviteRewards: user.inviteRewards || 0,
      invitedBy: user.invitedBy,
      invitedUsersDetails: invitedUsers,
      totalInvited: (user.invitedUsers || []).length
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم عند جلب إحصائيات الدعوات' });
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
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, bio, avatar, country, timezone } = req.body;
    const userId = req.user.id;
    
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
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    const userId = req.user.id;

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
router.post('/upload-profile-image', auth, async (req, res) => {
  try {
    const { imageData, imageType } = req.body;
    const userId = req.user.id;

    if (!imageData || !imageType) {
      return res.status(400).json({ error: 'بيانات الصورة مطلوبة' });
    }

    // التحقق من نوع الصورة
    if (!['profileImage', 'coverImage'].includes(imageType)) {
      return res.status(400).json({ error: 'نوع صورة غير صحيح' });
    }

    // في التطبيق الحقيقي، ستقوم بحفظ الصورة في خدمة تخزين مثل AWS S3
    // هنا سنقوم بحفظ البيانات كـ base64 (للتطوير فقط)
    const imageUrl = `data:image/jpeg;base64,${imageData}`;

    // تحديث البروفايل
    const updateField = `profile.${imageType}`;
    await User.findByIdAndUpdate(userId, {
      [updateField]: imageUrl
    });

    res.json({ 
      success: true, 
      message: 'تم رفع الصورة بنجاح',
      imageUrl 
    });
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    res.status(500).json({ error: 'خطأ في رفع الصورة' });
  }
});

// حذف صورة البروفايل
router.delete('/delete-profile-image', auth, async (req, res) => {
  try {
    const { imageType } = req.body;
    const userId = req.user.id;

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
router.put('/update-bio', auth, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user.id;

    if (!bio || bio.length > 500) {
      return res.status(400).json({ error: 'السيرة الذاتية يجب أن تكون أقل من 500 حرف' });
    }

    await User.findByIdAndUpdate(userId, {
      'profile.bio': bio
    });

    res.json({ 
      success: true, 
      message: 'تم تحديث السيرة الذاتية بنجاح',
      bio 
    });
  } catch (error) {
    console.error('خطأ في تحديث السيرة الذاتية:', error);
    res.status(500).json({ error: 'خطأ في تحديث السيرة الذاتية' });
  }
});

// تحديث معلومات البروفايل الإضافية
router.put('/update-profile-info', auth, async (req, res) => {
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
    const userId = req.user.id;

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

    res.json({ 
      success: true, 
      message: 'تم تحديث معلومات البروفايل بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في تحديث معلومات البروفايل:', error);
    res.status(500).json({ error: 'خطأ في تحديث معلومات البروفايل' });
  }
});

// تحديث إعدادات البحث والخصوصية
router.put('/update-search-settings', auth, async (req, res) => {
  try {
    const { 
      searchable, 
      showInSearch, 
      allowFriendRequests, 
      allowMessages 
    } = req.body;
    const userId = req.user.id;

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

    res.json({ 
      success: true, 
      message: 'تم تحديث إعدادات البحث بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في تحديث إعدادات البحث:', error);
    res.status(500).json({ error: 'خطأ في تحديث إعدادات البحث' });
  }
});

module.exports = router;
