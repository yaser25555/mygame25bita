const mongoose = require('mongoose');

const deletedUserSchema = new mongoose.Schema({
  originalUserId: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  originalData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  deletedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: 'حذف بواسطة المشرف'
  },
  canRestore: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// إنشاء فهارس للبحث السريع
deletedUserSchema.index({ originalUserId: 1 });
deletedUserSchema.index({ username: 1 });
deletedUserSchema.index({ deletedAt: -1 });
deletedUserSchema.index({ deletedBy: 1 });

module.exports = mongoose.model('DeletedUser', deletedUserSchema); 