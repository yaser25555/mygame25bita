const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
      default: 'مرحباً! أنا لاعب في VoiceBoom 🎮'
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
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
        bombs: { type: Number, default: 0 },
        stars: { type: Number, default: 0 },
        bats: { type: Number, default: 0 }
      },
      requestedItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        bombs: { type: Number, default: 0 },
        stars: { type: Number, default: 0 },
        bats: { type: Number, default: 0 }
      },
      message: String,
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
        bombs: { type: Number, default: 0 },
        stars: { type: Number, default: 0 },
        bats: { type: Number, default: 0 }
      },
      requestedItems: {
        score: { type: Number, default: 0 },
        pearls: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        keys: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        bombs: { type: Number, default: 0 },
        stars: { type: Number, default: 0 },
        bats: { type: Number, default: 0 }
      },
      message: String,
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
    
    // سجل التداولات المكتملة
    tradeHistory: [{
      tradeId: String,
      partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      partnerUsername: String,
      tradedItems: {
        given: {
          score: { type: Number, default: 0 },
          pearls: { type: Number, default: 0 },
          gems: { type: Number, default: 0 },
          keys: { type: Number, default: 0 },
          coins: { type: Number, default: 0 },
          bombs: { type: Number, default: 0 },
          stars: { type: Number, default: 0 },
          bats: { type: Number, default: 0 }
        },
        received: {
          score: { type: Number, default: 0 },
          pearls: { type: Number, default: 0 },
          gems: { type: Number, default: 0 },
          keys: { type: Number, default: 0 },
          coins: { type: Number, default: 0 },
          bombs: { type: Number, default: 0 },
          stars: { type: Number, default: 0 },
          bats: { type: Number, default: 0 }
        }
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
      allowScoreTrading: {
        type: Boolean,
        default: true
      },
      allowPearlTrading: {
        type: Boolean,
        default: true
      },
      allowItemTrading: {
        type: Boolean,
        default: true
      },
      minTradeAmount: {
        type: Number,
        default: 10
      },
      maxTradeAmount: {
        type: Number,
        default: 10000
      },
      autoRejectTrades: {
        type: Boolean,
        default: false
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
      cancelledTrades: {
        type: Number,
        default: 0
      },
      totalTradedScore: {
        type: Number,
        default: 0
      },
      totalTradedPearls: {
        type: Number,
        default: 0
      },
      totalTradedGems: {
        type: Number,
        default: 0
      },
      reputation: {
        type: Number,
        default: 100
      }
    }
  }
}, {
  timestamps: true // إضافة createdAt و updatedAt تلقائياً
});

// Middleware لتحديث الإحصائيات
UserSchema.pre('save', function(next) {
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
});

// Indexes للأداء
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'profile.status': 1 });
UserSchema.index({ 'stats.score': -1 });
UserSchema.index({ 'profile.level': -1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
