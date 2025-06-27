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