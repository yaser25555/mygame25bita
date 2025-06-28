const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // معرف المستخدم المخصص (يبدأ من 1500)
  userId: {
    type: Number,
    unique: true,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  
  // معلومات البروفايل الأساسية
  profile: {
    displayName: {
      type: String,
      default: function() {
        return this.username;
      }
    },
    bio: {
      type: String,
      default: 'مرحباً! أنا لاعب في VoiceBoom 🎮',
      maxlength: 500
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    // إضافة دعم الصور الشخصية
    profileImage: {
      type: String,
      default: null
    },
    coverImage: {
      type: String,
      default: null
    },
    // معلومات إضافية للبروفايل
    age: {
      type: Number,
      min: 13,
      max: 100
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say'
    },
    interests: [{
      type: String,
      maxlength: 50
    }],
    favoriteGames: [{
      type: String,
      maxlength: 100
    }],
    socialLinks: {
      discord: String,
      twitter: String,
      instagram: String,
      youtube: String
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline'
    },
    country: {
      type: String,
      default: ''
    },
    timezone: {
      type: String,
      default: ''
    },
    // إعدادات البحث عن الأصدقاء
    searchable: {
      type: Boolean,
      default: true
    },
    showInSearch: {
      type: Boolean,
      default: true
    },
    allowFriendRequests: {
      type: Boolean,
      default: true
    },
    allowMessages: {
      type: Boolean,
      default: true
    }
  },
  
  // إحصائيات اللعب
  stats: {
    score: {
      type: Number,
      default: 0,
    },
    pearls: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 100000, // هدية ترحيب للمستخدمين الجدد
    },
    boxesOpened: {
      type: Number,
      default: 0,
    },
    personalScore: {
      type: Number,
      default: 50,
    },
    highScore: {
      type: Number,
      default: 0,
    },
    roundNumber: {
      type: Number,
      default: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    totalPlayTime: {
      type: Number,
      default: 0 // بالدقائق
    },
    averageScore: {
      type: Number,
      default: 0
    }
  },
  
  // إحصائيات الأسلحة
  weapons: {
    singleShotsUsed: {
      type: Number,
      default: 0,
    },
    tripleShotsUsed: {
      type: Number,
      default: 0,
    },
    hammerShotsUsed: {
      type: Number,
      default: 0,
    },
    totalShots: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0
    }
  },
  
  // إعدادات اللعبة
  settings: {
    gameSettings: {
      numBoxes: {
        type: Number,
        default: 10,
      },
      boxValues: {
        type: [Number],
        default: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      },
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showStats: {
        type: Boolean,
        default: true
      },
      allowFriendRequests: {
        type: Boolean,
        default: true
      },
      allowMessages: {
        type: Boolean,
        default: true
      }
    },
    notifications: {
      friendRequests: {
        type: Boolean,
        default: true
      },
      messages: {
        type: Boolean,
        default: true
      },
      gameInvites: {
        type: Boolean,
        default: true
      },
      achievements: {
        type: Boolean,
        default: true
      }
    }
  },
  
  boxValues: {
    type: [Number],
    default: [],
  },
  
  // العناصر المجمعة
  itemsCollected: {
    type: Object,
    default: {
      gems: 0,
      keys: 0,
      coins: 0,
      pearls: 0,
      bombs: 0,
      stars: 0,
      bat: 0
    }
  },
  collectedGems: {
    type: Number,
    default: 0
  },
  totalGemsCollected: {
    type: Number,
    default: 0
  },
  batsHit: {
    type: Number,
    default: 0
  },
  
  // نظام العلاقات والأصدقاء
  relationships: {
    friends: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      addedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending'
      }
    }],
    friendRequests: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fromUsername: String,
      sentAt: {
        type: Date,
        default: Date.now
      },
      message: {
        type: String,
        default: ''
      }
    }],
    blockedUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      blockedAt: {
        type: Date,
        default: Date.now
      },
      reason: String
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // نظام الإنجازات
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    maxProgress: {
      type: Number,
      default: 1
    }
  }],
  
  // نظام الرتب والألقاب
  badges: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // نظام الدعوات
  inviteCode: {
    type: String,
    unique: true,
    default: function() {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  },
  invitedBy: {
    type: String,
    default: null
  },
  invitedUsers: [{
    type: String,
    default: []
  }],
  inviteRewards: {
    type: Number,
    default: 0
  },
  lastInviteReward: {
    type: Date,
    default: null
  },
  
  // نظام الأمان والمراقبة
  suspiciousActivity: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    activities: [String],
    oldScore: Number,
    newScore: Number,
    ip: String
  }],
  totalSpent: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  bannedAt: {
    type: Date,
    default: null
  },
  
  // معلومات إضافية
  preferences: {
    language: {
      type: String,
      default: 'ar'
    },
    theme: {
      type: String,
      default: 'dark'
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    musicEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  // نظام التداول
  trading: {
    // طلبات التداول المرسلة
    sentTrades: [{
      tradeId: {
        type: String,
        unique: true
      },
      toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      toUsername: String,
      offeredItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
          type: String,
          count: Number
        }]
      },
      requestedItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
          type: String,
          count: Number
        }]
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: function() {
          return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة
        }
      }
    }],
    
    // طلبات التداول المستلمة
    receivedTrades: [{
      tradeId: {
        type: String,
        unique: true
      },
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fromUsername: String,
      offeredItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
          type: String,
          count: Number
        }]
      },
      requestedItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
          type: String,
          count: Number
        }]
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: function() {
          return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة
        }
      }
    }],
    
    // سجل التداول
    tradeHistory: [{
      tradeId: String,
      partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      partnerUsername: String,
      type: {
        type: String,
        enum: ['sent', 'received'],
        required: true
      },
      offeredItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
          type: String,
          count: Number
        }]
      },
      receivedItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
          type: String,
          count: Number
        }]
      },
      status: {
        type: String,
        enum: ['completed', 'cancelled', 'expired'],
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // إعدادات التداول
    tradingSettings: {
      allowTrades: {
        type: Boolean,
        default: true
      },
      allowGifts: {
        type: Boolean,
        default: true
      },
      allowNegativeItems: {
        type: Boolean,
        default: true
      },
      autoAcceptGifts: {
        type: Boolean,
        default: false
      },
      maxTradeValue: {
        type: Number,
        default: 10000
      }
    },
    
    // إحصائيات التداول
    tradingStats: {
      totalTrades: {
        type: Number,
        default: 0
      },
      successfulTrades: {
        type: Number,
        default: 0
      },
      totalValueTraded: {
        type: Number,
        default: 0
      },
      giftsSent: {
        type: Number,
        default: 0
      },
      giftsReceived: {
        type: Number,
        default: 0
      },
      lastTradeAt: {
        type: Date,
        default: null
      }
    }
  },
  
  // نظام الهدايا الجديد
  gifts: {
    // الهدايا المرسلة
    sentGifts: [{
      giftId: {
        type: String,
        unique: true
      },
      toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      toUsername: String,
      giftType: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        required: true
      },
      giftCategory: {
        type: String,
        enum: ['currency', 'item', 'effect', 'bomb', 'bat'],
        required: true
      },
      giftName: String,
      giftValue: Number,
      giftCount: {
        type: Number,
        default: 1
      },
      message: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'auto_executed', 'expired', 'blocked_by_shield'],
        default: 'pending'
      },
      requiresAcceptance: {
        type: Boolean,
        default: true
      },
      autoExecute: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: function() {
          return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام
        }
      },
      executedAt: {
        type: Date,
        default: null
      }
    }],
    
    // الهدايا المستلمة
    receivedGifts: [{
      giftId: {
        type: String,
        unique: true
      },
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fromUsername: String,
      giftType: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        required: true
      },
      giftCategory: {
        type: String,
        enum: ['currency', 'item', 'effect', 'bomb', 'bat'],
        required: true
      },
      giftName: String,
      giftValue: Number,
      giftCount: {
        type: Number,
        default: 1
      },
      message: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'auto_executed', 'expired', 'blocked_by_shield'],
        default: 'pending'
      },
      requiresAcceptance: {
        type: Boolean,
        default: true
      },
      autoExecute: {
        type: Boolean,
        default: false
      },
      receivedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: function() {
          return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام
        }
      },
      executedAt: {
        type: Date,
        default: null
      }
    }],
    
    // سجل الهدايا
    giftHistory: [{
      giftId: String,
      partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      partnerUsername: String,
      type: {
        type: String,
        enum: ['sent', 'received'],
        required: true
      },
      giftType: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        required: true
      },
      giftCategory: {
        type: String,
        enum: ['currency', 'item', 'effect', 'bomb', 'bat'],
        required: true
      },
      giftName: String,
      giftValue: Number,
      giftCount: Number,
      message: String,
      status: {
        type: String,
        enum: ['accepted', 'rejected', 'auto_executed', 'expired', 'blocked_by_shield'],
        required: true
      },
      executedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // إعدادات الهدايا
    giftSettings: {
      allowGifts: {
        type: Boolean,
        default: true
      },
      allowNegativeGifts: {
        type: Boolean,
        default: true
      },
      allowBombsAndBats: {
        type: Boolean,
        default: true
      },
      autoAcceptPositiveGifts: {
        type: Boolean,
        default: false
      },
      maxGiftValue: {
        type: Number,
        default: 5000
      },
      dailyGiftLimit: {
        type: Number,
        default: 10
      }
    },
    
    // إحصائيات الهدايا
    giftStats: {
      totalGiftsSent: {
        type: Number,
        default: 0
      },
      totalGiftsReceived: {
        type: Number,
        default: 0
      },
      positiveGiftsSent: {
        type: Number,
        default: 0
      },
      negativeGiftsSent: {
        type: Number,
        default: 0
      },
      positiveGiftsReceived: {
        type: Number,
        default: 0
      },
      negativeGiftsReceived: {
        type: Number,
        default: 0
      },
      totalGiftValue: {
        type: Number,
        default: 0
      },
      lastGiftAt: {
        type: Date,
        default: null
      }
    }
  },
  
  // نظام الدرع
  shield: {
    // معلومات الدرع الحالي
    currentShield: {
      isActive: {
        type: Boolean,
        default: false
      },
      activatedAt: {
        type: Date,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      type: {
        type: String,
        enum: ['basic', 'premium', 'extended', 'ultimate'],
        default: 'basic'
      },
      protectionLevel: {
        type: Number,
        default: 1
      }
    },
    
    // سجل استخدام الدرع
    shieldHistory: [{
      shieldId: {
        type: String,
        unique: true
      },
      type: {
        type: String,
        enum: ['basic', 'premium', 'extended', 'ultimate'],
        required: true
      },
      cost: {
        type: Number,
        required: true
      },
      duration: {
        type: Number, // بالدقائق
        required: true
      },
      activatedAt: {
        type: Date,
        default: Date.now
      },
      expiredAt: {
        type: Date,
        default: null
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
      },
      giftsBlocked: {
        type: Number,
        default: 0
      }
    }],
    
    // إحصائيات الدرع
    shieldStats: {
      totalShieldsActivated: {
        type: Number,
        default: 0
      },
      totalCoinsSpent: {
        type: Number,
        default: 0
      },
      totalGiftsBlocked: {
        type: Number,
        default: 0
      },
      totalProtectionTime: {
        type: Number, // بالدقائق
        default: 0
      },
      lastShieldAt: {
        type: Date,
        default: null
      }
    },
    
    // إعدادات الدرع
    shieldSettings: {
      autoRenew: {
        type: Boolean,
        default: false
      },
      autoRenewType: {
        type: String,
        enum: ['basic', 'premium', 'extended', 'ultimate'],
        default: 'basic'
      },
      notifications: {
        type: Boolean,
        default: true
      },
      blockAllNegativeGifts: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true // إضافة createdAt و updatedAt تلقائياً
});

// Middleware لتحديث الإحصائيات
UserSchema.pre('save', async function(next) {
  try {
    // توليد معرف المستخدم إذا كان جديداً ولم يتم تحديده
    if (this.isNew && !this.userId) {
      console.log('🔄 توليد userId تلقائياً للمستخدم الجديد:', this.username);
      await this.generateUserId();
      console.log('✅ تم توليد userId:', this.userId);
    }
    
    // تحديث winRate
    if (this.stats.gamesPlayed > 0) {
      this.stats.winRate = Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
    }
    
    // تحديث averageScore
    if (this.stats.gamesPlayed > 0) {
      this.stats.averageScore = Math.round(this.stats.score / this.stats.gamesPlayed);
    }
    
    // تحديث totalShots و accuracy
    this.weapons.totalShots = this.weapons.singleShotsUsed + this.weapons.tripleShotsUsed + this.weapons.hammerShotsUsed;
    if (this.weapons.totalShots > 0) {
      this.weapons.accuracy = Math.round((this.batsHit / this.weapons.totalShots) * 100);
    }
    
    // تحديث lastSeen
    this.profile.lastSeen = new Date();
    
    next();
  } catch (error) {
    console.error('❌ خطأ في middleware:', error);
    next(error);
  }
});

// دالة لتوليد معرف المستخدم
UserSchema.methods.generateUserId = async function() {
  try {
    console.log('🔍 البحث عن أعلى userId موجود...');
    
    // البحث عن أعلى معرف موجود
    const lastUser = await this.constructor.findOne({}, { userId: 1 })
      .sort({ userId: -1 })
      .limit(1);
    
    let newUserId;
    
    // إذا لم يوجد مستخدمين، ابدأ من 1500
    if (!lastUser || !lastUser.userId) {
      newUserId = 1500;
      console.log('📝 لا يوجد مستخدمين، البدء من:', newUserId);
    } else {
      // خذ المعرف التالي
      newUserId = lastUser.userId + 1;
      console.log('📝 أعلى userId موجود:', lastUser.userId, '، المعرف الجديد:', newUserId);
    }
    
    // التحقق من عدم وجود تعارض
    const existingUser = await this.constructor.findOne({ userId: newUserId });
    if (existingUser) {
      console.log('⚠️ يوجد تعارض في userId، البحث عن معرف متاح...');
      // البحث عن معرف متاح
      let counter = 1;
      while (true) {
        const testUserId = newUserId + counter;
        const testUser = await this.constructor.findOne({ userId: testUserId });
        if (!testUser) {
          newUserId = testUserId;
          console.log('✅ تم العثور على userId متاح:', newUserId);
          break;
        }
        counter++;
        if (counter > 100) {
          // في حالة الطوارئ، استخدم timestamp
          newUserId = Math.floor(Date.now() / 1000) + 1500;
          console.log('🚨 استخدام timestamp كـ userId:', newUserId);
          break;
        }
      }
    }
    
    this.userId = newUserId;
    console.log('✅ تم تعيين userId:', this.userId, 'للمستخدم:', this.username);
    
  } catch (error) {
    console.error('❌ خطأ في توليد معرف المستخدم:', error);
    // في حالة الخطأ، استخدم timestamp كبديل
    this.userId = Math.floor(Date.now() / 1000) + 1500;
    console.log('🔄 استخدام timestamp كبديل:', this.userId);
  }
};

// Indexes للأداء
UserSchema.index({ userId: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'profile.status': 1 });
UserSchema.index({ 'stats.score': -1 });
UserSchema.index({ 'profile.level': -1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
