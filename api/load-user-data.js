const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { username } = req.user; // افترض أن لديك نظام مصادقة
        
        // جلب البيانات من المتجر المؤقت
        const userData = userDataStore[username] || {
            personalScore: 50,
            highScore: 0,
            roundNumber: 0,
            settings: {},
            singleShotsUsed: 0,
            tripleShotsUsed: 0,
            hammerShotsUsed: 0
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