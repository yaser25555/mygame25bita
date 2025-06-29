const express = require('express');
const router = express.Router();
const User = require('../models/User');

// استيراد middleware المصادقة من user.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

// مسار اختبار للتحقق من أن relationships يعمل
router.get('/test', (req, res) => {
  console.log('🧪 تم استلام طلب test في relationships');
  res.json({ 
    message: 'مسارات relationships تعمل بشكل صحيح',
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      method: req.method,
      'user-agent': req.headers['user-agent']
    }
  });
});

// مسار اختبار CORS للـ POST
router.post('/test-cors', (req, res) => {
  console.log('🧪 تم استلام طلب test-cors POST في relationships');
  res.json({ 
    message: 'POST في relationships يعمل بشكل صحيح',
    body: req.body,
    headers: {
      origin: req.headers.origin,
      method: req.method,
      'content-type': req.headers['content-type']
    }
  });
});

// دالة Middleware للتحقق من التوكن
function verifyToken(req, res, next) {
  console.log('🔐 محاولة التحقق من التوكن في relationships...');
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
    console.log('❌ التوكن مفقود في relationships');
    return res.status(401).json({ message: 'التوكن مفقود' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('✅ تم فك تشفير التوكن بنجاح في relationships:', { userId: decoded.userId, username: decoded.username });
    req.user = decoded; // تخزين معلومات المستخدم (userId, username, isAdmin) في req.user
    next();
  } catch (err) {
    console.log('❌ خطأ في فك تشفير التوكن في relationships:', err.message);
    return res.status(401).json({ message: 'توكن غير صالح' });
  }
}

// دالة مساعدة للحصول على المستخدم الحالي
async function getCurrentUser(currentUserId) {
  // فحص القيم الفارغة أو غير الصحيحة
  if (!currentUserId || currentUserId === 'undefined' || currentUserId === 'null') {
    console.log('❌ userId غير صحيح:', currentUserId);
    return null;
  }

  // إذا كان userId هو ObjectId (MongoDB ID)
  if (currentUserId && typeof currentUserId === 'string' && currentUserId.match(/^[0-9a-fA-F]{24}$/)) {
    return await User.findById(currentUserId);
  } else {
    // إذا كان userId رقم أو string رقمي
    let numericUserId = currentUserId;
    if (typeof currentUserId === 'string' && !isNaN(currentUserId) && currentUserId.trim() !== '') {
      numericUserId = parseInt(currentUserId);
    }
    
    // فحص إضافي للتأكد من أن القيمة صحيحة
    if (isNaN(numericUserId) || numericUserId === null || numericUserId === undefined) {
      console.log('❌ userId غير صحيح بعد التحويل:', numericUserId);
      return null;
    }
    
    return await User.findOne({ userId: numericUserId });
  }
}

// إرسال طلب صداقة
router.post('/send-friend-request', verifyToken, async (req, res) => {
  try {
    console.log('🔍 محاولة إرسال طلب صداقة...');
    console.log('📦 البيانات المستلمة:', req.body);
    
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      console.log('❌ المستخدم غير موجود في الطلب');
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { userId: targetUserId } = req.body;
    const currentUserId = req.user.userId;

    console.log('🔍 محاولة إرسال طلب صداقة:', { 
      currentUserId, 
      targetUserId, 
      currentUserIdType: typeof currentUserId,
      targetUserIdType: typeof targetUserId 
    });

    if (!targetUserId || targetUserId === 'undefined' || targetUserId === 'null') {
      console.log('❌ معرف المستخدم المستهدف مفقود أو غير صحيح:', targetUserId);
      return res.status(400).json({ error: 'معرف المستخدم مطلوب وصحيح' });
    }

    if (currentUserId === targetUserId) {
      console.log('❌ محاولة إرسال طلب صداقة لنفس المستخدم');
      return res.status(400).json({ error: 'لا يمكن إرسال طلب صداقة لنفسك' });
    }

    // البحث عن المستخدمين باستخدام userId (رقم) وليس _id
    console.log('🔍 البحث عن المستخدم الحالي...');
    let currentUser;
    try {
      currentUser = await getCurrentUser(currentUserId);
      console.log('✅ تم العثور على المستخدم الحالي:', currentUser ? currentUser.username : 'غير موجود');
    } catch (error) {
      console.error('❌ خطأ في البحث عن المستخدم الحالي:', error);
      return res.status(500).json({ error: 'خطأ في البحث عن المستخدم الحالي' });
    }
    
    console.log('🔍 البحث عن المستخدم المستهدف...');
    let targetUser;
    try {
      targetUser = await getCurrentUser(targetUserId);
      console.log('✅ تم العثور على المستخدم المستهدف:', targetUser ? targetUser.username : 'غير موجود');
    } catch (error) {
      console.error('❌ خطأ في البحث عن المستخدم المستهدف:', error);
      return res.status(500).json({ error: 'خطأ في البحث عن المستخدم المستهدف' });
    }

    console.log('👥 نتائج البحث:', { 
      currentUser: currentUser ? { username: currentUser.username, userId: currentUser.userId } : 'غير موجود',
      targetUser: targetUser ? { username: targetUser.username, userId: targetUser.userId } : 'غير موجود'
    });

    if (!currentUser || !targetUser) {
      console.log('❌ أحد المستخدمين غير موجود');
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!targetUser.relationships) targetUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];
    if (!targetUser.relationships.friends) targetUser.relationships.friends = [];
    if (!targetUser.relationships.friendRequests) targetUser.relationships.friendRequests = [];

    // التحقق من أن المستخدمين ليسوا أصدقاء بالفعل
    const alreadyFriends = currentUser.relationships.friends.some(
      friend => friend.userId === targetUser.userId
    );

    if (alreadyFriends) {
      console.log('❌ المستخدمان أصدقاء بالفعل');
      return res.status(400).json({ error: 'أنتما أصدقاء بالفعل' });
    }

    // التحقق من وجود طلب صداقة مسبق (من المستخدم الحالي إلى المستهدف)
    const existingSentRequest = currentUser.relationships.friendRequests.some(
      request => request.from === currentUser.userId && request.toUserId === targetUser.userId
    );

    // التحقق من وجود طلب صداقة مسبق (من المستهدف إلى المستخدم الحالي)
    const existingReceivedRequest = targetUser.relationships.friendRequests.some(
      request => request.from === targetUser.userId && request.toUserId === currentUser.userId
    );

    if (existingSentRequest || existingReceivedRequest) {
      console.log('❌ يوجد طلب صداقة مسبق');
      return res.status(400).json({ error: 'يوجد طلب صداقة مسبق' });
    }

    // إضافة طلب الصداقة للمستخدم المستهدف فقط
    const friendRequest = {
      from: currentUser.userId,
      fromUsername: currentUser.username,
      toUserId: targetUser.userId,
      toUsername: targetUser.username,
      sentAt: new Date(),
      message: ''
    };

    console.log('📝 إضافة طلب الصداقة:', friendRequest);

    // إضافة الطلب فقط للمستخدم المستهدف
    targetUser.relationships.friendRequests.push(friendRequest);

    console.log('💾 حفظ البيانات...');
    try {
      await targetUser.save();
      console.log('✅ تم حفظ بيانات المستخدم المستهدف');
    } catch (error) {
      console.error('❌ خطأ في حفظ بيانات المستخدم المستهدف:', error);
      return res.status(500).json({ error: 'خطأ في حفظ البيانات' });
    }

    console.log('✅ تم إرسال طلب الصداقة بنجاح');

    res.json({
      success: true,
      message: `تم إرسال طلب صداقة إلى ${targetUser.username}`
    });

  } catch (error) {
    console.error('❌ خطأ في إرسال طلب الصداقة:', error);
    console.error('❌ تفاصيل الخطأ:', error.stack);
    res.status(500).json({ error: 'خطأ في إرسال طلب الصداقة' });
  }
});

// قبول طلب صداقة
router.post('/accept-friend-request', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { fromUserId } = req.body;
    const currentUserId = req.user.userId;

    if (!fromUserId) {
      return res.status(400).json({ error: 'معرف المستخدم المرسل مطلوب' });
    }

    const currentUser = await getCurrentUser(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // البحث عن الطلب
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from === fromUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    const request = currentUser.relationships.friendRequests[requestIndex];
    const fromUser = await getCurrentUser(request.from);

    if (!fromUser) {
      return res.status(404).json({ error: 'المستخدم المرسل غير موجود' });
    }

    // تهيئة الحقول المطلوبة للمستخدم المرسل
    if (!fromUser.relationships) fromUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!fromUser.relationships.friends) fromUser.relationships.friends = [];
    if (!fromUser.relationships.friendRequests) fromUser.relationships.friendRequests = [];

    // إضافة الصداقة لكلا المستخدمين
    const currentUserFriend = {
      userId: fromUser.userId,
      username: fromUser.username,
      addedAt: new Date(),
      status: 'accepted'
    };

    const fromUserFriend = {
      userId: currentUser.userId,
      username: currentUser.username,
      addedAt: new Date(),
      status: 'accepted'
    };

    currentUser.relationships.friends.push(currentUserFriend);
    fromUser.relationships.friends.push(fromUserFriend);

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(requestIndex, 1);
    const fromUserRequestIndex = fromUser.relationships.friendRequests.findIndex(
      req => req.from === currentUser.userId
    );
    if (fromUserRequestIndex !== -1) {
      fromUser.relationships.friendRequests.splice(fromUserRequestIndex, 1);
    }

    await currentUser.save();
    await fromUser.save();

    res.json({
      success: true,
      message: `تم قبول طلب الصداقة من ${fromUser.username}`
    });

  } catch (error) {
    console.error('خطأ في قبول طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في قبول طلب الصداقة' });
  }
});

// رفض طلب صداقة
router.post('/reject-friend-request', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { fromUserId } = req.body;
    const currentUserId = req.user.userId;

    if (!fromUserId) {
      return res.status(400).json({ error: 'معرف المستخدم المرسل مطلوب' });
    }

    const currentUser = await getCurrentUser(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // البحث عن الطلب
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from === fromUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    const request = currentUser.relationships.friendRequests[requestIndex];
    const fromUser = await getCurrentUser(request.from);

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(requestIndex, 1);
    if (fromUser) {
      // تهيئة الحقول المطلوبة للمستخدم المرسل
      if (!fromUser.relationships) fromUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
      if (!fromUser.relationships.friendRequests) fromUser.relationships.friendRequests = [];
      
      const fromUserRequestIndex = fromUser.relationships.friendRequests.findIndex(
        req => req.from === currentUser.userId
      );
      if (fromUserRequestIndex !== -1) {
        fromUser.relationships.friendRequests.splice(fromUserRequestIndex, 1);
      }
      await fromUser.save();
    }

    await currentUser.save();

    res.json({
      success: true,
      message: 'تم رفض طلب الصداقة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في رفض طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في رفض طلب الصداقة' });
  }
});

// حظر مستخدم
router.post('/block-user', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { userId: targetUserId, reason } = req.body;
    const currentUserId = req.user.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'لا يمكن حظر نفسك' });
    }

    const currentUser = await getCurrentUser(currentUserId);
    const targetUser = await getCurrentUser(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // التحقق من أن المستخدم محظور بالفعل
    const alreadyBlocked = currentUser.relationships.blockedUsers.some(
      blocked => blocked.userId === targetUser.userId
    );

    if (alreadyBlocked) {
      return res.status(400).json({ error: 'المستخدم محظور بالفعل' });
    }

    // إضافة المستخدم إلى قائمة المحظورين
    const blockedUser = {
      userId: targetUser.userId,
      username: targetUser.username,
      blockedAt: new Date(),
      reason: reason || 'لا يوجد سبب محدد'
    };

    currentUser.relationships.blockedUsers.push(blockedUser);

    // إزالة من قائمة الأصدقاء إذا كانوا أصدقاء
    const friendIndex = currentUser.relationships.friends.findIndex(
      friend => friend.userId === targetUser.userId
    );
    if (friendIndex !== -1) {
      currentUser.relationships.friends.splice(friendIndex, 1);
    }

    // إزالة طلبات الصداقة
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from === targetUser.userId
    );
    if (requestIndex !== -1) {
      currentUser.relationships.friendRequests.splice(requestIndex, 1);
    }

    await currentUser.save();

    res.json({
      success: true,
      message: `تم حظر ${targetUser.username} بنجاح`
    });

  } catch (error) {
    console.error('خطأ في حظر المستخدم:', error);
    res.status(500).json({ error: 'خطأ في حظر المستخدم' });
  }
});

// إلغاء حظر مستخدم
router.post('/unblock-user', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { userId: targetUserId } = req.body;
    const currentUserId = req.user.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    const currentUser = await getCurrentUser(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

    // البحث عن المستخدم المحظور
    const blockedIndex = currentUser.relationships.blockedUsers.findIndex(
      blocked => blocked.userId === targetUserId
    );

    if (blockedIndex === -1) {
      return res.status(404).json({ error: 'المستخدم غير محظور' });
    }

    // إزالة من قائمة المحظورين
    currentUser.relationships.blockedUsers.splice(blockedIndex, 1);
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

// إزالة صديق
router.post('/remove-friend', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { userId: friendUserId } = req.body;
    const currentUserId = req.user.userId;

    if (!friendUserId) {
      return res.status(400).json({ error: 'معرف الصديق مطلوب' });
    }

    const currentUser = await getCurrentUser(currentUserId);
    const friendUser = await getCurrentUser(friendUserId);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!friendUser.relationships) friendUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!friendUser.relationships.friends) friendUser.relationships.friends = [];

    // البحث عن الصديق في قائمة الأصدقاء
    const friendIndex = currentUser.relationships.friends.findIndex(
      friend => friend.userId === friendUser.userId
    );

    if (friendIndex === -1) {
      return res.status(404).json({ error: 'المستخدم ليس في قائمة الأصدقاء' });
    }

    // إزالة من قائمة الأصدقاء لكلا المستخدمين
    currentUser.relationships.friends.splice(friendIndex, 1);
    
    const currentUserFriendIndex = friendUser.relationships.friends.findIndex(
      friend => friend.userId === currentUser.userId
    );
    if (currentUserFriendIndex !== -1) {
      friendUser.relationships.friends.splice(currentUserFriendIndex, 1);
    }

    await currentUser.save();
    await friendUser.save();

    res.json({
      success: true,
      message: `تم إزالة ${friendUser.username} من قائمة الأصدقاء`
    });

  } catch (error) {
    console.error('خطأ في إزالة الصديق:', error);
    res.status(500).json({ error: 'خطأ في إزالة الصديق' });
  }
});

// الحصول على قائمة الأصداقاء
router.get('/friends', verifyToken, async (req, res) => {
  try {
    console.log('🔍 محاولة جلب قائمة الأصدقاء...');
    
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      console.log('❌ المستخدم غير موجود في الطلب');
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const currentUserId = req.user.userId;
    console.log('👤 معرف المستخدم الحالي:', currentUserId);

    const currentUser = await getCurrentUser(currentUserId);

    if (!currentUser) {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات');
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    console.log('✅ تم العثور على المستخدم:', currentUser.username);

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];

    console.log('📊 عدد الأصدقاء:', currentUser.relationships.friends.length);

    // تحميل بيانات الأصدقاء بشكل منفصل لتجنب مشاكل populate
    const friendsData = [];
    
    for (const friend of currentUser.relationships.friends) {
      try {
        console.log('🔍 البحث عن الصديق:', friend.userId);
        const friendUser = await getCurrentUser(friend.userId)
          .select('userId username profile.displayName profile.avatar stats.score');
        
        if (friendUser) {
          friendsData.push({
            userId: friendUser.userId,
            username: friendUser.username,
            displayName: friendUser.profile?.displayName || friendUser.username,
            avatar: friendUser.profile?.avatar || 'images/default-avatar.png',
            score: friendUser.stats?.score || 0,
            addedAt: friend.addedAt
          });
          console.log('✅ تم إضافة الصديق:', friendUser.username);
        } else {
          console.log('⚠️ الصديق غير موجود:', friend.userId);
        }
      } catch (friendError) {
        console.error('❌ خطأ في تحميل بيانات الصديق:', friendError);
        // تجاهل الأصدقاء الذين لا يمكن تحميل بياناتهم
        continue;
      }
    }

    console.log('✅ تم تحميل', friendsData.length, 'صديق بنجاح');

    res.json({
      friends: friendsData,
      total: friendsData.length
    });

  } catch (error) {
    console.error('❌ خطأ في جلب قائمة الأصداقاء:', error);
    res.status(500).json({ error: 'خطأ في جلب قائمة الأصداقاء' });
  }
});

// الحصول على طلبات الصداقة
router.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const currentUserId = req.user.userId;

    const currentUser = await getCurrentUser(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // طلبات الصداقة المرسلة (حيث from = currentUserId)
    const sentRequests = currentUser.relationships.friendRequests
      .filter(request => request.from === currentUser.userId)
      .map(request => ({
        id: request._id,
        toUserId: request.toUserId || request.from, // fallback
        toUsername: request.toUsername || 'مستخدم غير معروف',
        status: request.status || 'pending',
        sentAt: request.sentAt
      }));

    // طلبات الصداقة المستلمة (حيث to = currentUserId أو من المستخدمين الآخرين)
    const receivedRequests = currentUser.relationships.friendRequests
      .filter(request => request.from !== currentUser.userId)
      .map(request => ({
        id: request._id,
        fromUserId: request.from,
        fromUsername: request.fromUsername || 'مستخدم غير معروف',
        status: request.status || 'pending',
        sentAt: request.sentAt
      }));

    res.json({
      sent: sentRequests,
      received: receivedRequests,
      totalSent: sentRequests.length,
      totalReceived: receivedRequests.length
    });

  } catch (error) {
    console.error('خطأ في جلب طلبات الصداقة:', error);
    res.status(500).json({ error: 'خطأ في جلب طلبات الصداقة' });
  }
});

// الحصول على قائمة المستخدمين المحظورين
router.get('/blocked-users', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const currentUserId = req.user.userId;

    const currentUser = await getCurrentUser(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

    const blockedUsers = currentUser.relationships.blockedUsers
      .filter(block => block.userId) // التأكد من وجود userId
      .map(block => ({
        userId: block.userId,
        username: block.username,
        blockedAt: block.blockedAt
      }));

    res.json({
      blockedUsers,
      total: blockedUsers.length
    });

  } catch (error) {
    console.error('خطأ في جلب قائمة المستخدمين المحظورين:', error);
    res.status(500).json({ error: 'خطأ في جلب قائمة المستخدمين المحظورين' });
  }
});

// البحث عن مستخدمين
router.get('/search-users', verifyToken, async (req, res) => {
  try {
    const { query, userId } = req.query;
    const currentUserId = req.user.userId;
    
    // الحصول على المستخدم الحالي مع علاقاته
    const currentUser = await getCurrentUser(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    let users = [];
    
    if (userId && !isNaN(userId)) {
      // البحث بالرقم فقط
      const user = await User.findOne({ userId: parseInt(userId) });
      if (user) users = [user];
    } else if (query) {
      // البحث بالنص
      users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { 'profile.displayName': { $regex: query, $options: 'i' } }
        ]
      });
    }

    // إضافة معلومات حالة الصداقة لكل مستخدم
    const usersWithStatus = users.map(user => {
      // التحقق من أن المستخدم ليس هو نفسه
      if (user.userId === currentUser.userId) {
        return null; // تجاهل المستخدم الحالي
      }

      // التحقق من حالة الصداقة
      const isFriend = currentUser.relationships.friends.some(friend => 
        friend.userId === user.userId
      );
      
      // التحقق من وجود طلب صداقة مستلم من هذا المستخدم
      const hasPendingRequest = currentUser.relationships.friendRequests.some(request => 
        request.from === user.userId
      );
      
      // التحقق من وجود طلب صداقة مرسل إلى هذا المستخدم
      const hasSentRequest = currentUser.relationships.friendRequests.some(request => 
        request.from === currentUser.userId && request.toUserId === user.userId
      );

      return {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || 'images/default-avatar.png',
        level: user.profile?.level || 1,
        isFriend,
        hasFriendRequest: hasPendingRequest || hasSentRequest,
        canSendRequest: !isFriend && !hasPendingRequest && !hasSentRequest
      };
    }).filter(user => user !== null); // إزالة المستخدمين الفارغين

    res.json({ 
      users: usersWithStatus,
      total: usersWithStatus.length 
    });
    
  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في البحث عن المستخدمين' });
  }
});

// إلغاء طلب صداقة
router.post('/cancel-friend-request', verifyToken, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { userId: targetUserId } = req.body;
    const currentUserId = req.user.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    const currentUser = await getCurrentUser(currentUserId);
    const targetUser = await getCurrentUser(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];
    if (!targetUser.relationships) targetUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!targetUser.relationships.friendRequests) targetUser.relationships.friendRequests = [];

    // البحث عن الطلب في قائمة المستخدم الحالي
    const currentUserRequestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from === currentUser.userId
    );

    if (currentUserRequestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    // البحث عن الطلب في قائمة المستخدم المستهدف
    const targetUserRequestIndex = targetUser.relationships.friendRequests.findIndex(
      request => request.from === currentUser.userId
    );

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(currentUserRequestIndex, 1);
    if (targetUserRequestIndex !== -1) {
      targetUser.relationships.friendRequests.splice(targetUserRequestIndex, 1);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: 'تم إلغاء طلب الصداقة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إلغاء طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في إلغاء طلب الصداقة' });
  }
});

module.exports = router; 