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
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
