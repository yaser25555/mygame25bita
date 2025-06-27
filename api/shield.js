const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('./auth');

// تفعيل الدرع
router.post('/activate', auth, async (req, res) => {
  try {
    const { type = 'basic' } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من وجود درع نشط
    if (user.shield.currentShield.isActive) {
      return res.status(400).json({ error: 'لديك درع نشط بالفعل' });
    }

    // تحديد تكلفة ومدة الدرع
    const shieldConfig = {
      basic: { cost: 50000, duration: 1440 }, // 50k coins لمدة 24 ساعة
      premium: { cost: 100000, duration: 2880 }, // 100k coins لمدة 48 ساعة
      extended: { cost: 90000, duration: 4320 }, // 90k coins لمدة 72 ساعة
      ultimate: { cost: 135000, duration: 4320 } // 135k coins لمدة 72 ساعة (3 أيام)
    };

    const config = shieldConfig[type];
    if (!config) {
      return res.status(400).json({ error: 'نوع درع غير صحيح' });
    }

    // التحقق من الرصيد
    if (user.score < config.cost) {
      return res.status(400).json({ 
        error: `لا تملك عملات كافية. المطلوب: ${config.cost} عملة` 
      });
    }

    // إنشاء معرف فريد للدرع
    const shieldId = `shield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // تفعيل الدرع
    user.shield.currentShield = {
      isActive: true,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + config.duration * 60 * 1000), // تحويل الدقائق لمللي ثانية
      type: type,
      protectionLevel: type === 'basic' ? 1 : type === 'premium' ? 2 : type === 'extended' ? 3 : 4
    };

    // إضافة للسجل
    const shieldRecord = {
      shieldId,
      type: type,
      cost: config.cost,
      duration: config.duration,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + config.duration * 60 * 1000),
      status: 'active',
      giftsBlocked: 0
    };
    user.shield.shieldHistory.push(shieldRecord);

    // تحديث الإحصائيات
    user.shield.shieldStats.totalShieldsActivated++;
    user.shield.shieldStats.totalCoinsSpent += config.cost;
    user.shield.shieldStats.totalProtectionTime += config.duration;
    user.shield.shieldStats.lastShieldAt = new Date();

    // خصم العملات
    user.score -= config.cost;

    await user.save();

    res.json({
      success: true,
      message: `تم تفعيل الدرع ${getShieldTypeName(type)} بنجاح لمدة ${config.duration / 60} ساعة`,
      shield: {
        type: type,
        expiresAt: user.shield.currentShield.expiresAt,
        cost: config.cost
      }
    });

  } catch (error) {
    console.error('خطأ في تفعيل الدرع:', error);
    res.status(500).json({ error: 'خطأ في تفعيل الدرع' });
  }
});

// إلغاء الدرع
router.post('/deactivate', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (!user.shield.currentShield.isActive) {
      return res.status(400).json({ error: 'ليس لديك درع نشط' });
    }

    // إلغاء الدرع
    user.shield.currentShield = {
      isActive: false,
      activatedAt: null,
      expiresAt: null,
      type: 'basic',
      protectionLevel: 1
    };

    // تحديث آخر درع في السجل
    const lastShield = user.shield.shieldHistory[user.shield.shieldHistory.length - 1];
    if (lastShield && lastShield.status === 'active') {
      lastShield.status = 'cancelled';
      lastShield.expiredAt = new Date();
    }

    await user.save();

    res.json({
      success: true,
      message: 'تم إلغاء الدرع بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إلغاء الدرع:', error);
    res.status(500).json({ error: 'خطأ في إلغاء الدرع' });
  }
});

// الحصول على حالة الدرع
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من انتهاء صلاحية الدرع
    if (user.shield.currentShield.isActive && 
        user.shield.currentShield.expiresAt < new Date()) {
      user.shield.currentShield.isActive = false;
      user.shield.currentShield.activatedAt = null;
      user.shield.currentShield.expiresAt = null;
      
      // تحديث آخر درع في السجل
      const lastShield = user.shield.shieldHistory[user.shield.shieldHistory.length - 1];
      if (lastShield && lastShield.status === 'active') {
        lastShield.status = 'expired';
        lastShield.expiredAt = new Date();
      }
      
      await user.save();
    }

    res.json({
      isActive: user.shield.currentShield.isActive,
      type: user.shield.currentShield.type,
      activatedAt: user.shield.currentShield.activatedAt,
      expiresAt: user.shield.currentShield.expiresAt,
      protectionLevel: user.shield.currentShield.protectionLevel,
      stats: user.shield.shieldStats,
      settings: user.shield.shieldSettings
    });

  } catch (error) {
    console.error('خطأ في جلب حالة الدرع:', error);
    res.status(500).json({ error: 'خطأ في جلب حالة الدرع' });
  }
});

// الحصول على سجل الدرع
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // ترتيب السجل من الأحدث للأقدم
    const history = user.shield.shieldHistory
      .sort((a, b) => new Date(b.activatedAt) - new Date(a.activatedAt));

    // تطبيق الصفحات
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = history.slice(startIndex, endIndex);

    res.json({
      history: paginatedHistory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(history.length / limit),
        totalRecords: history.length,
        hasNext: endIndex < history.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب سجل الدرع:', error);
    res.status(500).json({ error: 'خطأ في جلب سجل الدرع' });
  }
});

// تحديث إعدادات الدرع
router.put('/settings', auth, async (req, res) => {
  try {
    const { 
      autoRenew, 
      autoRenewType, 
      notifications, 
      blockAllNegative 
    } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تحديث الإعدادات
    if (typeof autoRenew === 'boolean') {
      user.shield.shieldSettings.autoRenew = autoRenew;
    }
    if (autoRenewType && ['basic', 'premium', 'extended', 'ultimate'].includes(autoRenewType)) {
      user.shield.shieldSettings.autoRenewType = autoRenewType;
    }
    if (typeof notifications === 'boolean') {
      user.shield.shieldSettings.notifications = notifications;
    }
    if (typeof blockAllNegative === 'boolean') {
      user.shield.shieldSettings.blockAllNegative = blockAllNegative;
    }

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث إعدادات الدرع بنجاح',
      settings: user.shield.shieldSettings
    });

  } catch (error) {
    console.error('خطأ في تحديث إعدادات الدرع:', error);
    res.status(500).json({ error: 'خطأ في تحديث إعدادات الدرع' });
  }
});

// الحصول على إعدادات الدرع
router.get('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json(user.shield.shieldSettings);

  } catch (error) {
    console.error('خطأ في جلب إعدادات الدرع:', error);
    res.status(500).json({ error: 'خطأ في جلب إعدادات الدرع' });
  }
});

// دالة مساعدة للحصول على اسم نوع الدرع
function getShieldTypeName(type) {
  const names = {
    basic: 'الأساسي',
    premium: 'المميز',
    extended: 'الممتد',
    ultimate: 'الأقوى'
  };
  return names[type] || 'غير معروف';
}

module.exports = router; 