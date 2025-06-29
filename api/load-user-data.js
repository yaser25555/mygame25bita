const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('./auth');

router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // تهيئة الحقول المطلوبة تلقائياً لمنع أخطاء المزامنة
        if (!user.stats) user.stats = { score: 0, pearls: 0, highScore: 0, roundNumber: 0, personalScore: 50, boxesOpened: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0, totalPlayTime: 0, averageScore: 0 };
        if (!user.itemsCollected) user.itemsCollected = { gems: 0, keys: 0, coins: 0, pearls: 0, bombs: 0, stars: 0, bat: 0 };
        if (!user.weapons) user.weapons = { singleShotsUsed: 0, tripleShotsUsed: 0, hammerShotsUsed: 0, totalShots: 0, accuracy: 0 };
        if (!user.settings) user.settings = { gameSettings: { numBoxes: 10, boxValues: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, privacy: {}, notifications: {} };
        if (!user.boxValues) user.boxValues = [];
        if (!user.achievements) user.achievements = [];
        if (!user.badges) user.badges = [];
        if (!user.relationships) user.relationships = { friends: [], friendRequests: [], blockedUsers: [], followers: [], following: [] };
        if (!user.gifts) user.gifts = { sentGifts: [], receivedGifts: [], giftStats: { totalGiftsSent: 0, positiveGiftsSent: 0, negativeGiftsSent: 0, totalGiftsReceived: 0, positiveGiftsReceived: 0, negativeGiftsReceived: 0, lastGiftAt: null }, giftHistory: [], giftSettings: { allowGifts: true, allowNegativeGifts: true, allowBombsAndBats: true } };
        if (!user.trading) user.trading = { sentTrades: [], receivedTrades: [], tradingStats: { totalTrades: 0, successfulTrades: 0, failedTrades: 0 }, tradingSettings: { allowTrades: true, autoAccept: false, tradeLimits: { maxItems: 10, maxValue: 1000 } } };
        if (!user.shield) user.shield = { currentShield: null, shieldHistory: [], shieldStats: { totalShieldsUsed: 0, totalGiftsBlocked: 0, averageShieldDuration: 0 } };

        // حفظ التغييرات إذا تمت التهيئة
        await user.save();
        
        const userData = {
            personalScore: user.stats.personalScore || 50,
            highScore: user.stats.highScore || 0,
            roundNumber: user.stats.roundNumber || 0,
            settings: user.settings || {},
            singleShotsUsed: user.weapons.singleShotsUsed || 0,
            tripleShotsUsed: user.weapons.tripleShotsUsed || 0,
            hammerShotsUsed: user.weapons.hammerShotsUsed || 0,
            stats: user.stats,
            itemsCollected: user.itemsCollected,
            weapons: user.weapons,
            boxValues: user.boxValues,
            achievements: user.achievements,
            badges: user.badges,
            relationships: user.relationships,
            gifts: user.gifts,
            trading: user.trading,
            shield: user.shield
        };
        
        res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحميل بيانات المستخدم'
        });
    }
});

module.exports = router;