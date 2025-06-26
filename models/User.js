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
  },
  boxValues: {
    type: [Number],
    default: [],
  },
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
  avatar: {
    type: String,
    default: ''
  },
  friends: [{
    type: String, // username of the friend
    default: []
  }],
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
  inviteCode: {
    type: String,
    unique: true,
    default: function() {
      // توليد كود دعوة فريد من 8 أحرف
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  },
  invitedBy: {
    type: String, // username of who invited this user
    default: null
  },
  invitedUsers: [{
    type: String, // usernames of users invited by this user
    default: []
  }],
  inviteRewards: {
    type: Number,
    default: 0 // إجمالي المكافآت من الدعوات
  },
  lastInviteReward: {
    type: Date,
    default: null
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
