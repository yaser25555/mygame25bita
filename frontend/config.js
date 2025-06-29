// ملف التكوين المركزي للمشروع
const CONFIG = {
    // عنوان الخادم الرئيسي
    BACKEND_URL: 'https://mygame25bita-7eqw.onrender.com',
    
    // إعدادات WebSocket
    SOCKET_URL: 'https://mygame25bita-7eqw.onrender.com',
    
    // إعدادات الصوت
    SOUND_ENABLED: true,
    SOUND_FILE: './sounds/MSG.mp3',
    
    // إعدادات التخزين المؤقت
    CACHE_VERSION: 'voiceboom-v7',
    
    // إعدادات CSP
    CSP_CONNECT_SRC: 'https://mygame25bita-7eqw.onrender.com',
    
    // إعدادات التطبيق
    APP_NAME: 'INFINITY Kingdom of luck',
    APP_VERSION: '2.0.0'
};

// تصدير التكوين للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
