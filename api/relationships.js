const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('./auth');

// إرسال طلب صداقة
router.post('/send-friend-request', auth, async (req, res) => {
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

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'لا يمكن إرسال طلب صداقة لنفسك' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
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
      friend => friend.userId.toString() === targetUserId
    );

    if (alreadyFriends) {
      return res.status(400).json({ error: 'أنتما أصدقاء بالفعل' });
    }

    // التحقق من وجود طلب صداقة مسبق
    const existingRequest = currentUser.relationships.friendRequests.some(
      request => request.from.toString() === targetUserId || request.from.toString() === currentUserId
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'يوجد طلب صداقة مسبق' });
    }

    // إضافة طلب الصداقة للمستخدم الحالي
    const friendRequest = {
      from: currentUserId,
      fromUsername: currentUser.username,
      sentAt: new Date(),
      message: ''
    };

    currentUser.relationships.friendRequests.push(friendRequest);
    targetUser.relationships.friendRequests.push(friendRequest);

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: `تم إرسال طلب صداقة إلى ${targetUser.username}`
    });

  } catch (error) {
    console.error('خطأ في إرسال طلب الصداقة:', error);
    res.status(500).json({ error: 'خطأ في إرسال طلب الصداقة' });
  }
});

// قبول طلب صداقة
router.post('/accept-friend-request', auth, async (req, res) => {
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

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // البحث عن الطلب
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from.toString() === fromUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    const request = currentUser.relationships.friendRequests[requestIndex];
    const fromUser = await User.findById(request.from);

    if (!fromUser) {
      return res.status(404).json({ error: 'المستخدم المرسل غير موجود' });
    }

    // تهيئة الحقول المطلوبة للمستخدم المرسل
    if (!fromUser.relationships) fromUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!fromUser.relationships.friends) fromUser.relationships.friends = [];
    if (!fromUser.relationships.friendRequests) fromUser.relationships.friendRequests = [];

    // إضافة الصداقة لكلا المستخدمين
    const currentUserFriend = {
      userId: fromUser._id,
      username: fromUser.username,
      addedAt: new Date(),
      status: 'accepted'
    };

    const fromUserFriend = {
      userId: currentUser._id,
      username: currentUser.username,
      addedAt: new Date(),
      status: 'accepted'
    };

    currentUser.relationships.friends.push(currentUserFriend);
    fromUser.relationships.friends.push(fromUserFriend);

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(requestIndex, 1);
    const fromUserRequestIndex = fromUser.relationships.friendRequests.findIndex(
      req => req.from.toString() === currentUserId
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
router.post('/reject-friend-request', auth, async (req, res) => {
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

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // البحث عن الطلب
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from.toString() === fromUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    const request = currentUser.relationships.friendRequests[requestIndex];
    const fromUser = await User.findById(request.from);

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(requestIndex, 1);
    if (fromUser) {
      // تهيئة الحقول المطلوبة للمستخدم المرسل
      if (!fromUser.relationships) fromUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
      if (!fromUser.relationships.friendRequests) fromUser.relationships.friendRequests = [];
      
      const fromUserRequestIndex = fromUser.relationships.friendRequests.findIndex(
        req => req.from.toString() === currentUserId
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
router.post('/block-user', auth, async (req, res) => {
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

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

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
      blocked => blocked.userId.toString() === targetUserId
    );

    if (alreadyBlocked) {
      return res.status(400).json({ error: 'المستخدم محظور بالفعل' });
    }

    // إضافة المستخدم إلى قائمة المحظورين
    const blockedUser = {
      userId: targetUser._id,
      username: targetUser.username,
      blockedAt: new Date(),
      reason: reason || 'لا يوجد سبب محدد'
    };

    currentUser.relationships.blockedUsers.push(blockedUser);

    // إزالة من قائمة الأصدقاء إذا كانوا أصدقاء
    const friendIndex = currentUser.relationships.friends.findIndex(
      friend => friend.userId.toString() === targetUserId
    );
    if (friendIndex !== -1) {
      currentUser.relationships.friends.splice(friendIndex, 1);
    }

    // إزالة طلبات الصداقة
    const requestIndex = currentUser.relationships.friendRequests.findIndex(
      request => request.from.toString() === targetUserId
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
router.post('/unblock-user', auth, async (req, res) => {
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

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

    // البحث عن المستخدم المحظور
    const blockedIndex = currentUser.relationships.blockedUsers.findIndex(
      blocked => blocked.userId.toString() === targetUserId
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
router.post('/remove-friend', auth, async (req, res) => {
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

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(friendUserId);

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
      friend => friend.userId.toString() === friendUserId
    );

    if (friendIndex === -1) {
      return res.status(404).json({ error: 'المستخدم ليس في قائمة الأصدقاء' });
    }

    // إزالة من قائمة الأصدقاء لكلا المستخدمين
    currentUser.relationships.friends.splice(friendIndex, 1);
    
    const currentUserFriendIndex = friendUser.relationships.friends.findIndex(
      friend => friend.userId.toString() === currentUserId
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
router.get('/friends', auth, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];

    // تحميل بيانات الأصدقاء بشكل منفصل لتجنب مشاكل populate
    const friendsData = [];
    
    for (const friend of currentUser.relationships.friends) {
      try {
        const friendUser = await User.findById(friend.userId)
          .select('username profile.displayName profile.avatar stats.score');
        
        if (friendUser) {
          friendsData.push({
            id: friendUser._id,
            username: friendUser.username,
            displayName: friendUser.profile?.displayName || friendUser.username,
            avatar: friendUser.profile?.avatar || 'images/default-avatar.png',
            score: friendUser.stats?.score || 0,
            addedAt: friend.addedAt
          });
        }
      } catch (friendError) {
        console.error('خطأ في تحميل بيانات الصديق:', friendError);
        // تجاهل الأصدقاء الذين لا يمكن تحميل بياناتهم
        continue;
      }
    }

    res.json({
      friends: friendsData,
      total: friendsData.length
    });

  } catch (error) {
    console.error('خطأ في جلب قائمة الأصداقاء:', error);
    res.status(500).json({ error: 'خطأ في جلب قائمة الأصداقاء' });
  }
});

// الحصول على طلبات الصداقة
router.get('/friend-requests', auth, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // طلبات الصداقة المرسلة (حيث from = currentUserId)
    const sentRequests = currentUser.relationships.friendRequests
      .filter(request => request.from && request.from.toString() === currentUserId)
      .map(request => ({
        id: request._id,
        toUserId: request.toUserId || request.from, // fallback
        toUsername: request.toUsername || 'مستخدم غير معروف',
        status: request.status || 'pending',
        sentAt: request.sentAt
      }));

    // طلبات الصداقة المستلمة (حيث to = currentUserId أو من المستخدمين الآخرين)
    const receivedRequests = currentUser.relationships.friendRequests
      .filter(request => request.from && request.from.toString() !== currentUserId)
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
router.get('/blocked-users', auth, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

    const blockedUsers = currentUser.relationships.blockedUsers
      .filter(block => block.userId) // التأكد من وجود userId
      .map(block => ({
        id: block.userId,
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
router.get('/search-users', auth, async (req, res) => {
  try {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { query } = req.query;
    const currentUserId = req.user.userId;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'يجب إدخال نص بحث مكون من حرفين على الأقل' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

    // البحث عن المستخدمين
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { isAdmin: false },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { 'profile.displayName': { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('userId username profile.displayName profile.avatar profile.bio profile.level profile.status');

    // تصفية النتائج بناءً على العلاقات
    const filteredUsers = users.map(user => {
      const isFriend = currentUser.relationships.friends.some(
        friend => friend.userId.toString() === user._id.toString()
      );
      
      const isBlocked = currentUser.relationships.blockedUsers.some(
        blocked => blocked.userId.toString() === user._id.toString()
      );

      const hasFriendRequest = currentUser.relationships.friendRequests.some(
        request => request.from.toString() === user._id.toString()
      );

      return {
        userId: user.userId,
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        avatar: user.profile?.avatar || 'default-avatar.png',
        bio: user.profile?.bio || '',
        level: user.profile?.level || 1,
        status: user.profile?.status || 'offline',
        isFriend,
        isBlocked,
        hasFriendRequest,
        canSendRequest: !isFriend && !isBlocked && !hasFriendRequest
      };
    });

    // إزالة المستخدمين المحظورين من النتائج
    const finalResults = filteredUsers.filter(user => !user.isBlocked);

    res.json({
      users: finalResults,
      total: finalResults.length
    });

  } catch (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في البحث عن المستخدمين' });
  }
});

// إلغاء طلب صداقة
router.post('/cancel-friend-request', auth, async (req, res) => {
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

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

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
      request => request.from.toString() === currentUserId && request.from.toString() !== targetUserId
    );

    if (currentUserRequestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    // البحث عن الطلب في قائمة المستخدم المستهدف
    const targetUserRequestIndex = targetUser.relationships.friendRequests.findIndex(
      request => request.from.toString() === currentUserId
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