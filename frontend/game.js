// ملف اللعبة الرئيسي
// BACKEND_URL معرف في navigation.js

// متغيرات اللعبة
let gameState = {
    isPlaying: false,
    score: 0,
    level: 1,
    lives: 3,
    isMuted: false
};

// دالة تشغيل الصوت
function playSound(soundName) {
    if (gameState.isMuted) return;
    
    try {
        const sounds = {
            buttonClick: document.getElementById('buttonClick'),
            win: document.getElementById('winSound'),
            lose: document.getElementById('loseSound'),
            hammer: document.getElementById('hammerSound'),
            single: document.getElementById('singleSound'),
            triple: document.getElementById('tripleSound')
        };
        
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    } catch (error) {
        console.log('لا يمكن تشغيل الصوت:', soundName);
    }
}

// دالة كتم/إلغاء كتم الصوت
function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.textContent = gameState.isMuted ? '🔇' : '🔊';
    }
    console.log(gameState.isMuted ? '🔇 تم كتم الصوت' : '🔊 تم إلغاء كتم الصوت');
}

// تحديث بيانات المستخدم في اللعبة
function updateUserDataInGame() {
    console.log('🎮 تحديث بيانات المستخدم في اللعبة...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ لا يوجد token، لا يمكن تحديث البيانات');
        return;
    }
    
    fetch(`${BACKEND_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(userData => {
        console.log('📊 عرض بيانات المستخدم في اللعبة:', userData);
        
        // تحديث اسم المستخدم
        const usernameElement = document.getElementById('game-username');
        if (usernameElement) {
            usernameElement.textContent = userData.username || 'مستخدم';
        }
        
        // تحديث معرف المستخدم
        const userIdElement = document.getElementById('user-id-display');
        if (userIdElement && userData.userId) {
            userIdElement.textContent = `ID: ${userData.userId}`;
        }
        
        // تحديث الرصيد
        const balanceElement = document.getElementById('game-balance');
        if (balanceElement) {
            const balance = userData.balance || userData.stats?.score || 0;
            balanceElement.textContent = balance.toLocaleString();
        }
        
        // تحديث اللآلئ
        const pearlsElement = document.getElementById('game-pearls');
        if (pearlsElement) {
            const pearls = userData.pearls || userData.stats?.pearls || 0;
            pearlsElement.textContent = pearls.toLocaleString();
        }
        
        // حفظ بيانات المستخدم في الذاكرة
        window.currentUser = userData;
        
        console.log('✅ تم تحديث بيانات اللعبة بنجاح');
    })
    .catch(error => {
        console.error('❌ خطأ في تحديث بيانات اللعبة:', error);
    });
}

// دالة بدء اللعبة
function startGame() {
    console.log('🎮 بدء اللعبة...');
    
    if (!window.currentUser) {
        showMessage('يرجى تسجيل الدخول أولاً', 'error');
        return;
    }
    
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.lives = 3;
    
    // إخفاء شاشة البداية
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    
    // إظهار منطقة اللعبة
    const gameArea = document.getElementById('game-area');
    if (gameArea) {
        gameArea.style.display = 'block';
    }
    
    // بدء حلقة اللعبة
    gameLoop();
    
    console.log('✅ تم بدء اللعبة بنجاح');
}

// دالة إيقاف اللعبة
function stopGame() {
    console.log('⏹️ إيقاف اللعبة...');
    
    gameState.isPlaying = false;
    
    // إظهار شاشة النتائج
    showGameResults();
    
    console.log('✅ تم إيقاف اللعبة');
}

// دالة عرض نتائج اللعبة
function showGameResults() {
    const resultsScreen = document.getElementById('results-screen');
    if (resultsScreen) {
        // تحديث النتائج
        const finalScoreElement = document.getElementById('final-score');
        if (finalScoreElement) {
            finalScoreElement.textContent = gameState.score.toLocaleString();
        }
        
        // إظهار الشاشة
        resultsScreen.style.display = 'block';
    }
}

// دالة إعادة تشغيل اللعبة
function restartGame() {
    console.log('🔄 إعادة تشغيل اللعبة...');
    
    // إخفاء شاشة النتائج
    const resultsScreen = document.getElementById('results-screen');
    if (resultsScreen) {
        resultsScreen.style.display = 'none';
    }
    
    // إعادة تعيين حالة اللعبة
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    
    // بدء اللعبة من جديد
    startGame();
}

// دالة العودة للقائمة الرئيسية
function backToMainMenu() {
    console.log('🏠 العودة للقائمة الرئيسية...');
    
    // إيقاف اللعبة
    gameState.isPlaying = false;
    
    // إخفاء جميع شاشات اللعبة
    const screens = ['start-screen', 'game-area', 'results-screen'];
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.style.display = 'none';
        }
    });
    
    // إظهار شاشة البداية
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'block';
    }
    
    console.log('✅ تم العودة للقائمة الرئيسية');
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    if (!gameState.isPlaying) return;
    
    // تحديث اللعبة
    updateGame();
    
    // رسم اللعبة
    drawGame();
    
    // استمرار الحلقة
    requestAnimationFrame(gameLoop);
}

// دالة تحديث اللعبة
function updateGame() {
    // هنا يتم تحديث منطق اللعبة
    // مثل حركة الكائنات، التصادمات، إلخ
}

// دالة رسم اللعبة
function drawGame() {
    // هنا يتم رسم عناصر اللعبة
    // مثل اللاعب، الأعداء، الخلفية، إلخ
}

// دالة إضافة نقاط
function addScore(points) {
    gameState.score += points;
    
    // تحديث عرض النقاط
    const scoreElement = document.getElementById('current-score');
    if (scoreElement) {
        scoreElement.textContent = gameState.score.toLocaleString();
    }
    
    console.log(`➕ تم إضافة ${points} نقطة. المجموع: ${gameState.score}`);
}

// دالة خسارة حياة
function loseLife() {
    gameState.lives--;
    
    // تحديث عرض الحياة
    const livesElement = document.getElementById('current-lives');
    if (livesElement) {
        livesElement.textContent = gameState.lives;
    }
    
    console.log(`💔 خسرت حياة. المتبقي: ${gameState.lives}`);
    
    if (gameState.lives <= 0) {
        gameOver();
    }
}

// دالة انتهاء اللعبة
function gameOver() {
    console.log('💀 انتهت اللعبة');
    
    playSound('lose');
    stopGame();
    
    // حفظ النتيجة في الخادم
    saveGameResult();
}

// دالة حفظ نتيجة اللعبة
async function saveGameResult() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/update-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                score: gameState.score,
                level: gameState.level
            })
        });
        
        if (response.ok) {
            console.log('✅ تم حفظ النتيجة بنجاح');
            // تحديث بيانات المستخدم
            updateUserDataInGame();
        } else {
            console.error('❌ فشل في حفظ النتيجة');
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ النتيجة:', error);
    }
}

// دالة عرض رسالة
function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // يمكن تحسين هذه الدالة لتعرض رسائل أكثر جمالاً
    const messageContainer = document.getElementById('game-message');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000);
    }
}

// إعداد أحداث اللعبة
function setupGameEvents() {
    // زر بدء اللعبة
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', () => {
            playSound('buttonClick');
            startGame();
        });
    }
    
    // زر إعادة التشغيل
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            playSound('buttonClick');
            restartGame();
        });
    }
    
    // زر العودة للقائمة
    const menuButton = document.getElementById('menu-button');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            playSound('buttonClick');
            backToMainMenu();
        });
    }
    
    // زر كتم الصوت
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            toggleMute();
        });
    }
    
    console.log('✅ تم إعداد أحداث اللعبة');
}

// تصدير الدوال للاستخدام العام
window.playSound = playSound;
window.toggleMute = toggleMute;
window.startGame = startGame;
window.stopGame = stopGame;
window.restartGame = restartGame;
window.backToMainMenu = backToMainMenu;
window.addScore = addScore;
window.loseLife = loseLife;
window.showMessage = showMessage;

// تهيئة اللعبة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 تحميل صفحة اللعبة...');
    
    // تحديث بيانات المستخدم
    updateUserDataInGame();
    
    // إعداد أحداث اللعبة
    setupGameEvents();
    
    console.log('✅ تم تحميل صفحة اللعبة بنجاح');
}); 