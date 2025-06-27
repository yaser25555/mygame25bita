const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('./auth');

// إرسال طلب صداقة
router.post('/send-friend-request', auth, async (req, res) => {
  try {
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
      request => request.fromUserId.toString() === targetUserId || request.toUserId.toString() === targetUserId
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'يوجد طلب صداقة مسبق' });
    }

    // إضافة طلب الصداقة
    const friendRequest = {
      fromUserId: currentUserId,
      toUserId: targetUserId,
      fromUsername: currentUser.username,
      toUsername: targetUser.username,
      status: 'pending',
      sentAt: new Date()
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
    const { requestId } = req.body;
    const currentUserId = req.user.userId;

    if (!requestId) {
      return res.status(400).json({ error: 'معرف الطلب مطلوب' });
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
      request => request._id.toString() === requestId && request.toUserId.toString() === currentUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    const request = currentUser.relationships.friendRequests[requestIndex];
    const fromUser = await User.findById(request.fromUserId);

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
      addedAt: new Date()
    };

    const fromUserFriend = {
      userId: currentUser._id,
      username: currentUser.username,
      addedAt: new Date()
    };

    currentUser.relationships.friends.push(currentUserFriend);
    fromUser.relationships.friends.push(fromUserFriend);

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(requestIndex, 1);
    const fromUserRequestIndex = fromUser.relationships.friendRequests.findIndex(
      req => req._id.toString() === requestId
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
    const { requestId } = req.body;
    const currentUserId = req.user.userId;

    if (!requestId) {
      return res.status(400).json({ error: 'معرف الطلب مطلوب' });
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
      request => request._id.toString() === requestId && request.toUserId.toString() === currentUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب الصداقة غير موجود' });
    }

    const request = currentUser.relationships.friendRequests[requestIndex];
    const fromUser = await User.findById(request.fromUserId);

    // إزالة الطلب من كلا المستخدمين
    currentUser.relationships.friendRequests.splice(requestIndex, 1);
    if (fromUser) {
      // تهيئة الحقول المطلوبة للمستخدم المرسل
      if (!fromUser.relationships) fromUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
      if (!fromUser.relationships.friendRequests) fromUser.relationships.friendRequests = [];
      
      const fromUserRequestIndex = fromUser.relationships.friendRequests.findIndex(
        req => req._id.toString() === requestId
      );
      if (fromUserRequestIndex !== -1) {
        fromUser.relationships.friendRequests.splice(fromUserRequestIndex, 1);
      }
      await fromUser.save();
    }

    await currentUser.save();

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
router.post('/block-user', auth, async (req, res) => {
  try {
    const { userId: userToBlock } = req.body;
    const currentUserId = req.user.userId;

    if (!userToBlock) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    if (currentUserId === userToBlock) {
      return res.status(400).json({ error: 'لا يمكنك حظر نفسك' });
    }

    const currentUser = await User.findById(currentUserId);
    const userToBlockDoc = await User.findById(userToBlock);

    if (!currentUser || !userToBlockDoc) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // التحقق من أن المستخدم محظور بالفعل
    const alreadyBlocked = currentUser.relationships.blockedUsers.some(
      blocked => blocked.userId.toString() === userToBlock
    );

    if (alreadyBlocked) {
      return res.status(400).json({ error: 'المستخدم محظور بالفعل' });
    }

    // إضافة المستخدم لقائمة المحظورين
    const blockedUser = {
      userId: userToBlockDoc._id,
      username: userToBlockDoc.username,
      blockedAt: new Date()
    };

    currentUser.relationships.blockedUsers.push(blockedUser);

    // إزالة الصداقة إذا كانت موجودة
    const friendIndex = currentUser.relationships.friends.findIndex(
      friend => friend.userId.toString() === userToBlock
    );
    if (friendIndex !== -1) {
      currentUser.relationships.friends.splice(friendIndex, 1);
    }

    // إزالة طلبات الصداقة
    currentUser.relationships.friendRequests = currentUser.relationships.friendRequests.filter(
      request => request.fromUserId.toString() !== userToBlock && request.toUserId.toString() !== userToBlock
    );

    await currentUser.save();

    res.json({
      success: true,
      message: `تم حظر ${userToBlockDoc.username} بنجاح`
    });

  } catch (error) {
    console.error('خطأ في حظر المستخدم:', error);
    res.status(500).json({ error: 'خطأ في حظر المستخدم' });
  }
});

// إلغاء حظر مستخدم
router.post('/unblock-user', auth, async (req, res) => {
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

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

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

// إزالة صديق
router.post('/remove-friend', auth, async (req, res) => {
  try {
    const { friendId } = req.body;
    const currentUserId = req.user.userId;

    if (!friendId) {
      return res.status(400).json({ error: 'معرف الصديق مطلوب' });
    }

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(friendId);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!friendUser.relationships) friendUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!friendUser.relationships.friends) friendUser.relationships.friends = [];

    // البحث عن الصداقة في قائمة المستخدم الحالي
    const currentUserFriendIndex = currentUser.relationships.friends.findIndex(
      friend => friend.userId.toString() === friendId
    );

    // البحث عن الصداقة في قائمة الصديق
    const friendUserFriendIndex = friendUser.relationships.friends.findIndex(
      friend => friend.userId.toString() === currentUserId
    );

    if (currentUserFriendIndex === -1) {
      return res.status(404).json({ error: 'الصداقة غير موجودة' });
    }

    // إزالة الصداقة من كلا المستخدمين
    if (currentUserFriendIndex !== -1) {
      currentUser.relationships.friends.splice(currentUserFriendIndex, 1);
    }

    if (friendUserFriendIndex !== -1) {
      friendUser.relationships.friends.splice(friendUserFriendIndex, 1);
    }

    await currentUser.save();
    await friendUser.save();

    res.json({
      success: true,
      message: 'تم إزالة الصديق بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إزالة الصديق:', error);
    res.status(500).json({ error: 'خطأ في إزالة الصديق' });
  }
});

// الحصول على قائمة الأصداقاء
router.get('/friends', auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId)
      .populate('relationships.friends.userId', 'username profile.displayName profile.avatar stats.score');

    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];

    const friends = currentUser.relationships.friends.map(friend => ({
      id: friend.userId._id,
      username: friend.userId.username,
      displayName: friend.userId.profile.displayName,
      avatar: friend.userId.profile.avatar,
      score: friend.userId.stats.score,
      addedAt: friend.addedAt
    }));

    res.json({
      friends,
      total: friends.length
    });

  } catch (error) {
    console.error('خطأ في جلب قائمة الأصداقاء:', error);
    res.status(500).json({ error: 'خطأ في جلب قائمة الأصداقاء' });
  }
});

// الحصول على طلبات الصداقة
router.get('/friend-requests', auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];

    // طلبات الصداقة المرسلة
    const sentRequests = currentUser.relationships.friendRequests
      .filter(request => request.fromUserId.toString() === currentUserId)
      .map(request => ({
        id: request._id,
        toUserId: request.toUserId,
        toUsername: request.toUsername,
        status: request.status,
        sentAt: request.sentAt
      }));

    // طلبات الصداقة المستلمة
    const receivedRequests = currentUser.relationships.friendRequests
      .filter(request => request.toUserId.toString() === currentUserId)
      .map(request => ({
        id: request._id,
        fromUserId: request.fromUserId,
        fromUsername: request.fromUsername,
        status: request.status,
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
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

    const blockedUsers = currentUser.relationships.blockedUsers.map(block => ({
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
    
    // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
    if (!currentUser.relationships) currentUser.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
    if (!currentUser.relationships.friends) currentUser.relationships.friends = [];
    if (!currentUser.relationships.friendRequests) currentUser.relationships.friendRequests = [];
    if (!currentUser.relationships.blockedUsers) currentUser.relationships.blockedUsers = [];

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

module.exports = router; 