const express = require('express');
const { generateTokenWithAccount } = require('./agoraToken');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token مطلوب' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token غير صحيح' });
    }
};

// Route to get Agora token
router.post('/token', verifyToken, (req, res) => {
    try {
        const { channelName, username } = req.body;
        
        if (!channelName || !username) {
            return res.status(400).json({ 
                message: 'اسم القناة واسم المستخدم مطلوبان' 
            });
        }
        
        // Generate token using username as account
        const token = generateTokenWithAccount(channelName, username);
        
        if (!token) {
            return res.status(500).json({ 
                message: 'فشل في إنشاء token' 
            });
        }
        
        res.json({
            token: token,
            appId: '852ff5f55a7a49b081b799358f2fc329',
            channelName: channelName,
            username: username
        });
        
    } catch (error) {
        console.error('❌ Error in voice token route:', error);
        res.status(500).json({ 
            message: 'خطأ داخلي في الخادم' 
        });
    }
});

// Route to get voice chat status
router.get('/status', verifyToken, (req, res) => {
    try {
        res.json({
            status: 'active',
            appId: '852ff5f55a7a49b081b799358f2fc329',
            message: 'Voice Chat متاح'
        });
    } catch (error) {
        console.error('❌ Error in voice status route:', error);
        res.status(500).json({ 
            message: 'خطأ داخلي في الخادم' 
        });
    }
});

module.exports = router; 