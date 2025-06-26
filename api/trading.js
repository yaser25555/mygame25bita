const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('./auth');

// إنشاء طلب تداول جديد
router.post('/create', auth, async (req, res) => {
  try {
    const { toUsername, offeredItems, requestedItems, message = '' } = req.body;
    const fromUserId = req.user.id;
    
    if (!toUsername || !offeredItems || !requestedItems) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    
    // التحقق من وجود المستخدم المستهدف
    const toUser = await User.findOne({ username: toUsername });
    if (!toUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    if (toUser._id.toString() === fromUserId) {
      return res.status(400).json({ error: 'لا يمكنك التداول مع نفسك' });
    }
    
    // التحقق من إعدادات التداول للمستخدم المستهدف
    if (!toUser.trading.tradingSettings.allowTrades) {
      return res.status(403).json({ error: 'هذا المستخدم لا يقبل طلبات التداول' });
    }
    
    // التحقق من وجود المستخدم المرسل
    const fromUser = await User.findById(fromUserId);
    if (!fromUser) {
      return res.status(404).json({ error: 'المستخدم المرسل غير موجود' });
    }
    
    // التحقق من امتلاك العناصر المطلوب تداولها
    const validationResult = await validateTradeItems(fromUser, offeredItems);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // التحقق من امتلاك العناصر المطلوبة من المستخدم المستهدف
    const targetValidationResult = await validateTradeItems(toUser, requestedItems);
    if (!targetValidationResult.valid) {
      return res.status(400).json({ error: 'المستخدم المستهدف لا يملك العناصر المطلوبة' });
    }
    
    // التحقق من حدود التداول
    const limitsValidation = validateTradeLimits(offeredItems, requestedItems, fromUser, toUser);
    if (!limitsValidation.valid) {
      return res.status(400).json({ error: limitsValidation.error });
    }
    
    // إنشاء معرف فريد للتداول
    const tradeId = generateTradeId();
    
    // إنشاء طلب التداول
    const trade = {
      tradeId,
      toUserId: toUser._id,
      toUsername: toUser.username,
      offeredItems,
      requestedItems,
      message,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ساعة
    };
    
    // إضافة الطلب للمستخدم المرسل
    fromUser.trading.sentTrades.push(trade);
    await fromUser.save();
    
    // إضافة الطلب للمستخدم المستلم
    const receivedTrade = {
      tradeId,
      fromUserId: fromUser._id,
      fromUsername: fromUser.username,
      offeredItems: requestedItems, // عكس العناصر
      requestedItems: offeredItems,
      message,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    toUser.trading.receivedTrades.push(receivedTrade);
    await toUser.save();
    
    res.json({ 
      message: 'تم إرسال طلب التداول بنجاح',
      tradeId 
    });
  } catch (error) {
    console.error('خطأ في إنشاء طلب التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// قبول طلب تداول
router.post('/accept/:tradeId', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // البحث عن طلب التداول
    const receivedTrade = user.trading.receivedTrades.find(trade => trade.tradeId === tradeId);
    if (!receivedTrade) {
      return res.status(404).json({ error: 'طلب التداول غير موجود' });
    }
    
    if (receivedTrade.status !== 'pending') {
      return res.status(400).json({ error: 'طلب التداول غير صالح' });
    }
    
    // التحقق من انتهاء صلاحية الطلب
    if (new Date() > receivedTrade.expiresAt) {
      return res.status(400).json({ error: 'طلب التداول منتهي الصلاحية' });
    }
    
    // البحث عن المستخدم المرسل
    const fromUser = await User.findById(receivedTrade.fromUserId);
    if (!fromUser) {
      return res.status(404).json({ error: 'المستخدم المرسل غير موجود' });
    }
    
    // التحقق من امتلاك العناصر مرة أخرى
    const fromUserValidation = await validateTradeItems(fromUser, receivedTrade.offeredItems);
    const toUserValidation = await validateTradeItems(user, receivedTrade.requestedItems);
    
    if (!fromUserValidation.valid || !toUserValidation.valid) {
      return res.status(400).json({ error: 'أحد الطرفين لا يملك العناصر المطلوبة' });
    }
    
    // تنفيذ التداول
    await executeTrade(fromUser, user, receivedTrade);
    
    // تحديث حالة الطلب
    receivedTrade.status = 'accepted';
    user.trading.receivedTrades = user.trading.receivedTrades.map(trade => 
      trade.tradeId === tradeId ? receivedTrade : trade
    );
    
    // تحديث طلب التداول المرسل
    const sentTrade = fromUser.trading.sentTrades.find(trade => trade.tradeId === tradeId);
    if (sentTrade) {
      sentTrade.status = 'accepted';
      fromUser.trading.sentTrades = fromUser.trading.sentTrades.map(trade => 
        trade.tradeId === tradeId ? sentTrade : trade
      );
    }
    
    // حفظ التغييرات
    await user.save();
    await fromUser.save();
    
    res.json({ message: 'تم قبول طلب التداول بنجاح' });
  } catch (error) {
    console.error('خطأ في قبول طلب التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// رفض طلب تداول
router.post('/reject/:tradeId', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // البحث عن طلب التداول
    const receivedTrade = user.trading.receivedTrades.find(trade => trade.tradeId === tradeId);
    if (!receivedTrade) {
      return res.status(404).json({ error: 'طلب التداول غير موجود' });
    }
    
    if (receivedTrade.status !== 'pending') {
      return res.status(400).json({ error: 'طلب التداول غير صالح' });
    }
    
    // تحديث حالة الطلب
    receivedTrade.status = 'rejected';
    user.trading.receivedTrades = user.trading.receivedTrades.map(trade => 
      trade.tradeId === tradeId ? receivedTrade : trade
    );
    
    // تحديث طلب التداول المرسل
    const fromUser = await User.findById(receivedTrade.fromUserId);
    if (fromUser) {
      const sentTrade = fromUser.trading.sentTrades.find(trade => trade.tradeId === tradeId);
      if (sentTrade) {
        sentTrade.status = 'rejected';
        fromUser.trading.sentTrades = fromUser.trading.sentTrades.map(trade => 
          trade.tradeId === tradeId ? sentTrade : trade
        );
        await fromUser.save();
      }
    }
    
    await user.save();
    
    res.json({ message: 'تم رفض طلب التداول' });
  } catch (error) {
    console.error('خطأ في رفض طلب التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// إلغاء طلب تداول
router.post('/cancel/:tradeId', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // البحث عن طلب التداول المرسل
    const sentTrade = user.trading.sentTrades.find(trade => trade.tradeId === tradeId);
    if (!sentTrade) {
      return res.status(404).json({ error: 'طلب التداول غير موجود' });
    }
    
    if (sentTrade.status !== 'pending') {
      return res.status(400).json({ error: 'طلب التداول غير صالح للإلغاء' });
    }
    
    // تحديث حالة الطلب المرسل
    sentTrade.status = 'cancelled';
    user.trading.sentTrades = user.trading.sentTrades.map(trade => 
      trade.tradeId === tradeId ? sentTrade : trade
    );
    
    // تحديث طلب التداول المستلم
    const toUser = await User.findById(sentTrade.toUserId);
    if (toUser) {
      const receivedTrade = toUser.trading.receivedTrades.find(trade => trade.tradeId === tradeId);
      if (receivedTrade) {
        receivedTrade.status = 'cancelled';
        toUser.trading.receivedTrades = toUser.trading.receivedTrades.map(trade => 
          trade.tradeId === tradeId ? receivedTrade : trade
        );
        await toUser.save();
      }
    }
    
    await user.save();
    
    res.json({ message: 'تم إلغاء طلب التداول بنجاح' });
  } catch (error) {
    console.error('خطأ في إلغاء طلب التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الحصول على طلبات التداول المستلمة
router.get('/received', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('trading.receivedTrades.fromUserId', 'username profile');
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    const receivedTrades = user.trading.receivedTrades
      .filter(trade => trade.status === 'pending')
      .map(trade => ({
        tradeId: trade.tradeId,
        fromUser: {
          id: trade.fromUserId._id,
          username: trade.fromUserId.username,
          displayName: trade.fromUserId.profile?.displayName || trade.fromUserId.username
        },
        offeredItems: trade.offeredItems,
        requestedItems: trade.requestedItems,
        message: trade.message,
        createdAt: trade.createdAt,
        expiresAt: trade.expiresAt
      }));
    
    res.json(receivedTrades);
  } catch (error) {
    console.error('خطأ في الحصول على طلبات التداول المستلمة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الحصول على طلبات التداول المرسلة
router.get('/sent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('trading.sentTrades.toUserId', 'username profile');
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    const sentTrades = user.trading.sentTrades.map(trade => ({
      tradeId: trade.tradeId,
      toUser: {
        id: trade.toUserId._id,
        username: trade.toUserId.username,
        displayName: trade.toUserId.profile?.displayName || trade.toUserId.username
      },
      offeredItems: trade.offeredItems,
      requestedItems: trade.requestedItems,
      message: trade.message,
      status: trade.status,
      createdAt: trade.createdAt,
      expiresAt: trade.expiresAt
    }));
    
    res.json(sentTrades);
  } catch (error) {
    console.error('خطأ في الحصول على طلبات التداول المرسلة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الحصول على سجل التداول
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('trading.tradeHistory.partnerId', 'username profile');
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    const tradeHistory = user.trading.tradeHistory.map(trade => ({
      tradeId: trade.tradeId,
      partner: {
        id: trade.partnerId._id,
        username: trade.partnerId.username,
        displayName: trade.partnerId.profile?.displayName || trade.partnerId.username
      },
      tradedItems: trade.tradedItems,
      completedAt: trade.completedAt
    }));
    
    res.json(tradeHistory);
  } catch (error) {
    console.error('خطأ في الحصول على سجل التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تحديث إعدادات التداول
router.put('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { allowTrades, allowScoreTrading, allowPearlTrading, allowItemTrading, minTradeAmount, maxTradeAmount, autoRejectTrades } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // تحديث الإعدادات
    if (typeof allowTrades === 'boolean') user.trading.tradingSettings.allowTrades = allowTrades;
    if (typeof allowScoreTrading === 'boolean') user.trading.tradingSettings.allowScoreTrading = allowScoreTrading;
    if (typeof allowPearlTrading === 'boolean') user.trading.tradingSettings.allowPearlTrading = allowPearlTrading;
    if (typeof allowItemTrading === 'boolean') user.trading.tradingSettings.allowItemTrading = allowItemTrading;
    if (typeof minTradeAmount === 'number') user.trading.tradingSettings.minTradeAmount = minTradeAmount;
    if (typeof maxTradeAmount === 'number') user.trading.tradingSettings.maxTradeAmount = maxTradeAmount;
    if (typeof autoRejectTrades === 'boolean') user.trading.tradingSettings.autoRejectTrades = autoRejectTrades;
    
    await user.save();
    
    res.json({ 
      message: 'تم تحديث إعدادات التداول بنجاح',
      settings: user.trading.tradingSettings 
    });
  } catch (error) {
    console.error('خطأ في تحديث إعدادات التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الحصول على إحصائيات التداول
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    res.json(user.trading.tradingStats);
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات التداول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// إرسال هدية
router.post('/send-gift', auth, async (req, res) => {
  try {
    const { toUsername, giftName, giftCount = 1, message = '' } = req.body;
    const fromUserId = req.user.userId;

    if (!toUsername || !giftName) {
      return res.status(400).json({ error: 'اسم المستخدم ونوع الهدية مطلوبان' });
    }

    // البحث عن المستخدم المستلم
    const toUser = await User.findOne({ username: toUsername });
    if (!toUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (toUser._id.toString() === fromUserId) {
      return res.status(400).json({ error: 'لا يمكنك إرسال هدية لنفسك' });
    }

    // التحقق من إعدادات المستلم
    if (!toUser.gifts.giftSettings.allowGifts) {
      return res.status(403).json({ error: 'هذا المستخدم لا يقبل الهدايا' });
    }

    // تحديد نوع الهدية وتصنيفها
    const giftInfo = getGiftInfo(giftName);
    if (!giftInfo) {
      return res.status(400).json({ error: 'نوع هدية غير صحيح' });
    }

    // التحقق من إعدادات الهدايا السلبية
    if (giftInfo.type === 'negative' && !toUser.gifts.giftSettings.allowNegativeGifts) {
      return res.status(403).json({ error: 'هذا المستخدم لا يقبل الهدايا السلبية' });
    }

    // التحقق من إعدادات القنابل والخفافيش
    if ((giftInfo.category === 'bomb' || giftInfo.category === 'bat') && 
        !toUser.gifts.giftSettings.allowBombsAndBats) {
      return res.status(403).json({ error: 'هذا المستخدم لا يقبل القنابل والخفافيش' });
    }

    // التحقق من الحد اليومي
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayGifts = await User.findById(fromUserId).then(user => 
      user.gifts.sentGifts.filter(gift => 
        gift.sentAt >= today && gift.toUserId.toString() === toUser._id.toString()
      ).length
    );

    if (todayGifts >= 5) { // حد أقصى 5 هدايا يومياً لنفس المستخدم
      return res.status(429).json({ error: 'لقد وصلت للحد الأقصى من الهدايا لهذا المستخدم اليوم' });
    }

    // إنشاء معرف فريد للهدية
    const giftId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // تحديد ما إذا كانت الهدية تتطلب موافقة
    const requiresAcceptance = shouldRequireAcceptance(giftInfo);
    const autoExecute = !requiresAcceptance;

    // إنشاء الهدية
    const gift = {
      giftId,
      toUserId: toUser._id,
      toUsername: toUser.username,
      giftType: giftInfo.type,
      giftCategory: giftInfo.category,
      giftName: giftInfo.name,
      giftValue: giftInfo.value * giftCount,
      giftCount,
      message,
      status: autoExecute ? 'auto_executed' : 'pending',
      requiresAcceptance,
      autoExecute,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 أيام
      executedAt: autoExecute ? new Date() : null
    };

    // إضافة الهدية للمرسل
    const fromUser = await User.findById(fromUserId);
    fromUser.gifts.sentGifts.push(gift);
    fromUser.gifts.giftStats.totalGiftsSent++;
    if (giftInfo.type === 'positive') {
      fromUser.gifts.giftStats.positiveGiftsSent++;
    } else if (giftInfo.type === 'negative') {
      fromUser.gifts.giftStats.negativeGiftsSent++;
    }
    fromUser.gifts.giftStats.lastGiftAt = new Date();

    // إضافة الهدية للمستلم
    const receivedGift = {
      ...gift,
      fromUserId: fromUser._id,
      fromUsername: fromUser.username,
      receivedAt: new Date()
    };
    toUser.gifts.receivedGifts.push(receivedGift);
    toUser.gifts.giftStats.totalGiftsReceived++;
    if (giftInfo.type === 'positive') {
      toUser.gifts.giftStats.positiveGiftsReceived++;
    } else if (giftInfo.type === 'negative') {
      toUser.gifts.giftStats.negativeGiftsReceived++;
    }

    // تنفيذ الهدية تلقائياً إذا كانت لا تتطلب موافقة
    if (autoExecute) {
      await executeGift(toUser, giftInfo, giftCount);
      
      // إضافة للسجل
      const historyEntry = {
        giftId,
        partnerId: toUser._id,
        partnerUsername: toUser.username,
        type: 'sent',
        giftType: giftInfo.type,
        giftCategory: giftInfo.category,
        giftName: giftInfo.name,
        giftValue: giftInfo.value * giftCount,
        giftCount,
        message,
        status: 'auto_executed',
        executedAt: new Date()
      };
      fromUser.gifts.giftHistory.push(historyEntry);
      
      const receivedHistoryEntry = {
        ...historyEntry,
        type: 'received',
        partnerId: fromUser._id,
        partnerUsername: fromUser.username
      };
      toUser.gifts.giftHistory.push(receivedHistoryEntry);
    }

    await fromUser.save();
    await toUser.save();

    res.json({
      success: true,
      message: autoExecute ? 
        `تم إرسال ${giftInfo.name} وتنفيذها تلقائياً على ${toUser.username}` :
        `تم إرسال ${giftInfo.name} إلى ${toUser.username} بانتظار الموافقة`,
      giftId,
      autoExecuted: autoExecute
    });

  } catch (error) {
    console.error('خطأ في إرسال الهدية:', error);
    res.status(500).json({ error: 'خطأ في إرسال الهدية' });
  }
});

// قبول هدية
router.post('/accept-gift', auth, async (req, res) => {
  try {
    const { giftId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // البحث عن الهدية
    const gift = user.gifts.receivedGifts.find(g => g.giftId === giftId);
    if (!gift) {
      return res.status(404).json({ error: 'الهدية غير موجودة' });
    }

    if (gift.status !== 'pending') {
      return res.status(400).json({ error: 'لا يمكن قبول هذه الهدية' });
    }

    // البحث عن معلومات الهدية
    const giftInfo = getGiftInfo(gift.giftName);
    if (!giftInfo) {
      return res.status(400).json({ error: 'معلومات الهدية غير صحيحة' });
    }

    // تنفيذ الهدية
    await executeGift(user, giftInfo, gift.giftCount);

    // تحديث حالة الهدية
    gift.status = 'accepted';
    gift.executedAt = new Date();

    // البحث عن المرسل وتحديث هديته
    const fromUser = await User.findById(gift.fromUserId);
    if (fromUser) {
      const sentGift = fromUser.gifts.sentGifts.find(g => g.giftId === giftId);
      if (sentGift) {
        sentGift.status = 'accepted';
        sentGift.executedAt = new Date();
      }
      await fromUser.save();
    }

    // إضافة للسجل
    const historyEntry = {
      giftId,
      partnerId: fromUser._id,
      partnerUsername: fromUser.username,
      type: 'received',
      giftType: giftInfo.type,
      giftCategory: giftInfo.category,
      giftName: giftInfo.name,
      giftValue: giftInfo.value * gift.giftCount,
      giftCount: gift.giftCount,
      message: gift.message,
      status: 'accepted',
      executedAt: new Date()
    };
    user.gifts.giftHistory.push(historyEntry);

    await user.save();

    res.json({
      success: true,
      message: `تم قبول ${giftInfo.name} بنجاح`,
      giftValue: giftInfo.value * gift.giftCount
    });

  } catch (error) {
    console.error('خطأ في قبول الهدية:', error);
    res.status(500).json({ error: 'خطأ في قبول الهدية' });
  }
});

// رفض هدية
router.post('/reject-gift', auth, async (req, res) => {
  try {
    const { giftId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // البحث عن الهدية
    const gift = user.gifts.receivedGifts.find(g => g.giftId === giftId);
    if (!gift) {
      return res.status(404).json({ error: 'الهدية غير موجودة' });
    }

    if (gift.status !== 'pending') {
      return res.status(400).json({ error: 'لا يمكن رفض هذه الهدية' });
    }

    // تحديث حالة الهدية
    gift.status = 'rejected';

    // البحث عن المرسل وتحديث هديته
    const fromUser = await User.findById(gift.fromUserId);
    if (fromUser) {
      const sentGift = fromUser.gifts.sentGifts.find(g => g.giftId === giftId);
      if (sentGift) {
        sentGift.status = 'rejected';
      }
      await fromUser.save();
    }

    await user.save();

    res.json({
      success: true,
      message: 'تم رفض الهدية بنجاح'
    });

  } catch (error) {
    console.error('خطأ في رفض الهدية:', error);
    res.status(500).json({ error: 'خطأ في رفض الهدية' });
  }
});

// الحصول على الهدايا المستلمة
router.get('/received-gifts', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تصفية الهدايا حسب الحالة
    const pendingGifts = user.gifts.receivedGifts.filter(g => g.status === 'pending');
    const acceptedGifts = user.gifts.receivedGifts.filter(g => g.status === 'accepted');
    const rejectedGifts = user.gifts.receivedGifts.filter(g => g.status === 'rejected');

    res.json({
      pending: pendingGifts,
      accepted: acceptedGifts,
      rejected: rejectedGifts,
      stats: user.gifts.giftStats
    });

  } catch (error) {
    console.error('خطأ في جلب الهدايا:', error);
    res.status(500).json({ error: 'خطأ في جلب الهدايا' });
  }
});

// الحصول على الهدايا المرسلة
router.get('/sent-gifts', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({
      sentGifts: user.gifts.sentGifts,
      stats: user.gifts.giftStats
    });

  } catch (error) {
    console.error('خطأ في جلب الهدايا المرسلة:', error);
    res.status(500).json({ error: 'خطأ في جلب الهدايا المرسلة' });
  }
});

// تحديث إعدادات الهدايا
router.put('/gift-settings', auth, async (req, res) => {
  try {
    const { 
      allowGifts, 
      allowNegativeGifts, 
      allowBombsAndBats, 
      autoAcceptPositiveGifts,
      maxGiftValue,
      dailyGiftLimit 
    } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تحديث الإعدادات
    if (typeof allowGifts === 'boolean') {
      user.gifts.giftSettings.allowGifts = allowGifts;
    }
    if (typeof allowNegativeGifts === 'boolean') {
      user.gifts.giftSettings.allowNegativeGifts = allowNegativeGifts;
    }
    if (typeof allowBombsAndBats === 'boolean') {
      user.gifts.giftSettings.allowBombsAndBats = allowBombsAndBats;
    }
    if (typeof autoAcceptPositiveGifts === 'boolean') {
      user.gifts.giftSettings.autoAcceptPositiveGifts = autoAcceptPositiveGifts;
    }
    if (typeof maxGiftValue === 'number') {
      user.gifts.giftSettings.maxGiftValue = maxGiftValue;
    }
    if (typeof dailyGiftLimit === 'number') {
      user.gifts.giftSettings.dailyGiftLimit = dailyGiftLimit;
    }

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث إعدادات الهدايا بنجاح',
      settings: user.gifts.giftSettings
    });

  } catch (error) {
    console.error('خطأ في تحديث إعدادات الهدايا:', error);
    res.status(500).json({ error: 'خطأ في تحديث إعدادات الهدايا' });
  }
});

// دالة مساعدة لتحديد معلومات الهدية
function getGiftInfo(giftName) {
  const giftTypes = {
    // هدايا إيجابية (تتطلب موافقة)
    'pearls': { name: 'لآلئ', type: 'positive', category: 'currency', value: 100 },
    'gems': { name: 'جواهر', type: 'positive', category: 'currency', value: 50 },
    'coins': { name: 'عملات', type: 'positive', category: 'currency', value: 10 },
    'keys': { name: 'مفاتيح', type: 'positive', category: 'item', value: 25 },
    'stars': { name: 'نجوم', type: 'positive', category: 'item', value: 30 },
    
    // هدايا سلبية (تنفذ تلقائياً)
    'bomb': { name: 'قنبلة', type: 'negative', category: 'bomb', value: -50 },
    'bat': { name: 'خفاش', type: 'negative', category: 'bat', value: -30 },
    'curse': { name: 'لعنة', type: 'negative', category: 'effect', value: -20 },
    
    // هدايا محايدة
    'mystery_box': { name: 'صندوق غامض', type: 'neutral', category: 'item', value: 0 }
  };

  return giftTypes[giftName];
}

// دالة مساعدة لتحديد ما إذا كانت الهدية تتطلب موافقة
function shouldRequireAcceptance(giftInfo) {
  // الهدايا السلبية (قنابل، خفافيش، لعنات) تنفذ تلقائياً
  if (giftInfo.type === 'negative') {
    return false;
  }
  
  // الهدايا الإيجابية (عملات، عناصر) تتطلب موافقة
  if (giftInfo.type === 'positive') {
    return true;
  }
  
  // الهدايا المحايدة تتطلب موافقة
  return true;
}

// دالة مساعدة لتنفيذ الهدية
async function executeGift(user, giftInfo, count) {
  switch (giftInfo.category) {
    case 'currency':
      switch (giftInfo.name) {
        case 'لآلئ':
          user.stats.pearls += (giftInfo.value * count);
          break;
        case 'جواهر':
          user.itemsCollected.gems += count;
          break;
        case 'عملات':
          user.itemsCollected.coins += count;
          break;
      }
      break;
      
    case 'item':
      switch (giftInfo.name) {
        case 'مفاتيح':
          user.itemsCollected.keys += count;
          break;
        case 'نجوم':
          user.itemsCollected.stars += count;
          break;
      }
      break;
      
    case 'bomb':
      // القنبلة تخصم نقاط
      user.stats.score = Math.max(0, user.stats.score + (giftInfo.value * count));
      break;
      
    case 'bat':
      // الخفاش يخصم نقاط
      user.stats.score = Math.max(0, user.stats.score + (giftInfo.value * count));
      break;
      
    case 'effect':
      // اللعنة تخصم نقاط
      user.stats.score = Math.max(0, user.stats.score + (giftInfo.value * count));
      break;
  }
  
  // تحديث إحصائيات الهدايا
  user.gifts.giftStats.totalGiftValue += (giftInfo.value * count);
}

// دوال مساعدة

// التحقق من امتلاك العناصر
async function validateTradeItems(user, items) {
  const { score, pearls, gems, keys, coins, bombs, stars, bats } = items;
  
  if (score > 0 && user.stats.score < score) {
    return { valid: false, error: 'لا تملك نقاط كافية' };
  }
  
  if (pearls > 0 && user.stats.pearls < pearls) {
    return { valid: false, error: 'لا تملك لآلئ كافية' };
  }
  
  if (gems > 0 && user.itemsCollected.gems < gems) {
    return { valid: false, error: 'لا تملك جواهر كافية' };
  }
  
  if (keys > 0 && user.itemsCollected.keys < keys) {
    return { valid: false, error: 'لا تملك مفاتيح كافية' };
  }
  
  if (coins > 0 && user.itemsCollected.coins < coins) {
    return { valid: false, error: 'لا تملك عملات كافية' };
  }
  
  if (bombs > 0 && user.itemsCollected.bombs < bombs) {
    return { valid: false, error: 'لا تملك قنابل كافية' };
  }
  
  if (stars > 0 && user.itemsCollected.stars < stars) {
    return { valid: false, error: 'لا تملك نجوم كافية' };
  }
  
  if (bats > 0 && user.batsHit < bats) {
    return { valid: false, error: 'لا تملك خفافيش كافية' };
  }
  
  return { valid: true };
}

// التحقق من حدود التداول
function validateTradeLimits(offeredItems, requestedItems, fromUser, toUser) {
  const totalOffered = Object.values(offeredItems).reduce((sum, val) => sum + val, 0);
  const totalRequested = Object.values(requestedItems).reduce((sum, val) => sum + val, 0);
  
  if (totalOffered === 0 && totalRequested === 0) {
    return { valid: false, error: 'يجب تداول عنصر واحد على الأقل' };
  }
  
  if (totalOffered < fromUser.trading.tradingSettings.minTradeAmount) {
    return { valid: false, error: `الحد الأدنى للتداول هو ${fromUser.trading.tradingSettings.minTradeAmount}` };
  }
  
  if (totalOffered > fromUser.trading.tradingSettings.maxTradeAmount) {
    return { valid: false, error: `الحد الأقصى للتداول هو ${fromUser.trading.tradingSettings.maxTradeAmount}` };
  }
  
  if (totalRequested < toUser.trading.tradingSettings.minTradeAmount) {
    return { valid: false, error: `الحد الأدنى للتداول هو ${toUser.trading.tradingSettings.minTradeAmount}` };
  }
  
  if (totalRequested > toUser.trading.tradingSettings.maxTradeAmount) {
    return { valid: false, error: `الحد الأقصى للتداول هو ${toUser.trading.tradingSettings.maxTradeAmount}` };
  }
  
  return { valid: true };
}

// تنفيذ التداول
async function executeTrade(fromUser, toUser, trade) {
  const { offeredItems, requestedItems } = trade;
  
  // خصم العناصر من المستخدم المرسل
  fromUser.stats.score -= offeredItems.score;
  fromUser.stats.pearls -= offeredItems.pearls;
  fromUser.itemsCollected.gems -= offeredItems.gems;
  fromUser.itemsCollected.keys -= offeredItems.keys;
  fromUser.itemsCollected.coins -= offeredItems.coins;
  fromUser.itemsCollected.bombs -= offeredItems.bombs;
  fromUser.itemsCollected.stars -= offeredItems.stars;
  fromUser.batsHit -= offeredItems.bats;
  
  // إضافة العناصر المطلوبة للمستخدم المرسل
  fromUser.stats.score += requestedItems.score;
  fromUser.stats.pearls += requestedItems.pearls;
  fromUser.itemsCollected.gems += requestedItems.gems;
  fromUser.itemsCollected.keys += requestedItems.keys;
  fromUser.itemsCollected.coins += requestedItems.coins;
  fromUser.itemsCollected.bombs += requestedItems.bombs;
  fromUser.itemsCollected.stars += requestedItems.stars;
  fromUser.batsHit += requestedItems.bats;
  
  // خصم العناصر من المستخدم المستلم
  toUser.stats.score -= requestedItems.score;
  toUser.stats.pearls -= requestedItems.pearls;
  toUser.itemsCollected.gems -= requestedItems.gems;
  toUser.itemsCollected.keys -= requestedItems.keys;
  toUser.itemsCollected.coins -= requestedItems.coins;
  toUser.itemsCollected.bombs -= requestedItems.bombs;
  toUser.itemsCollected.stars -= requestedItems.stars;
  toUser.batsHit -= requestedItems.bats;
  
  // إضافة العناصر المطلوبة للمستخدم المستلم
  toUser.stats.score += offeredItems.score;
  toUser.stats.pearls += offeredItems.pearls;
  toUser.itemsCollected.gems += offeredItems.gems;
  toUser.itemsCollected.keys += offeredItems.keys;
  toUser.itemsCollected.coins += offeredItems.coins;
  toUser.itemsCollected.bombs += offeredItems.bombs;
  toUser.itemsCollected.stars += offeredItems.stars;
  toUser.batsHit += offeredItems.bats;
  
  // تحديث إحصائيات التداول
  fromUser.trading.tradingStats.totalTrades++;
  fromUser.trading.tradingStats.successfulTrades++;
  fromUser.trading.tradingStats.totalTradedScore += offeredItems.score;
  fromUser.trading.tradingStats.totalTradedPearls += offeredItems.pearls;
  fromUser.trading.tradingStats.totalTradedGems += offeredItems.gems;
  
  toUser.trading.tradingStats.totalTrades++;
  toUser.trading.tradingStats.successfulTrades++;
  toUser.trading.tradingStats.totalTradedScore += requestedItems.score;
  toUser.trading.tradingStats.totalTradedPearls += requestedItems.pearls;
  toUser.trading.tradingStats.totalTradedGems += requestedItems.gems;
  
  // إضافة إلى سجل التداول
  const tradeRecord = {
    tradeId: trade.tradeId,
    partnerId: toUser._id,
    partnerUsername: toUser.username,
    tradedItems: {
      given: offeredItems,
      received: requestedItems
    },
    completedAt: new Date()
  };
  
  fromUser.trading.tradeHistory.push(tradeRecord);
  
  const tradeRecord2 = {
    tradeId: trade.tradeId,
    partnerId: fromUser._id,
    partnerUsername: fromUser.username,
    tradedItems: {
      given: requestedItems,
      received: offeredItems
    },
    completedAt: new Date()
  };
  
  toUser.trading.tradeHistory.push(tradeRecord2);
  
  // حفظ التغييرات
  await fromUser.save();
  await toUser.save();
}

// توليد معرف فريد للتداول
function generateTradeId() {
  return 'TRADE_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = router; 