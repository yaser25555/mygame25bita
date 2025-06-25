// ملف game.js: يرجى نقل جميع أكواد الجافاسكريبت من <script> في game.html إلى هنا. 

const BACKEND_URL = 'https://mygame25bita.onrender.com';

// Game State
let score = 0;
let highScore = 0;
let roundNumber = 1;
let username = '';
let isProcessingShot = false;

// تفعيل ميزة الطي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تحميل الصفحة...');
    // تأخير قليل لضمان تحميل جميع العناصر
    setTimeout(() => {
        // The game is already initialized with initGame() call above
        // Just initialize the additional features
        initializeItemInfoModal();
        initializeCollapseFeatures();
        // Uncomment the line below to test effects on page load
        // testEffects();
    }, 500);
});

// ... existing code ... 