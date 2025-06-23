const express = require('express');
const router = express.Router();

// نموذج تخزين مؤقت للبيانات (في الواقع ستحتاج إلى استخدام قاعدة بيانات)
const userDataStore = {};

router.post('/', async (req, res) => {
    try {
        const { username } = req.user; // افترض أن لديك نظام مصادقة
        const userData = req.body;
        
        // حفظ البيانات في المتجر المؤقت
        userDataStore[username] = userData;
        
        res.status(200).json({ 
            success: true,
            message: 'تم حفظ بيانات المستخدم بنجاح'
        });
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في حفظ بيانات المستخدم'
        });
    }
});

module.exports = router;