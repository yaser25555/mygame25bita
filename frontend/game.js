// ملف اللعبة الرئيسي
// BACKEND_URL يتم تعريفه في navigation.js

// أصوات
const sounds = {
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    buttonClick: new Audio('sounds/click.mp3'),
    singleShot: new Audio('sounds/single_shot.mp3'),
    tripleShot: new Audio('sounds/triple_shot.mp3'),
    hammerShot: new Audio('sounds/hammer_shot.mp3')
};

let isMuted = false;
let chatVolume = 0.5;

// دالة تشغيل الصوت
function playSound(soundName) {
    if (isMuted) return;
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

// تصدير دالة playSound للاستخدام العام
window.playSound = playSound;

// دالة تحديث بيانات المستخدم في اللعبة
function updateGameUserData() {
    console.log('🎮 تحديث بيانات المستخدم في اللعبة...');
    
    // محاولة الحصول على بيانات المستخدم من navigation.js
    if (window.currentUser) {
        displayGameUserData(window.currentUser);
    } else {
        // إذا لم تكن متاحة، نحاول تحميلها
        loadGameUserData();
    }
}

// عرض بيانات المستخدم في اللعبة
function displayGameUserData(userData) {
    console.log('📊 عرض بيانات المستخدم في اللعبة:', userData);
    
    // عرض اسم المستخدم
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = userData.username || userData.displayName || 'مستخدم';
    }
    
    // عرض الرصيد
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay) {
        const balance = userData.balance || userData.stats?.score || 0;
        balanceDisplay.textContent = balance.toLocaleString();
    }
    
    // عرض اللآلئ
    const pearlBalance = document.getElementById('pearl-balance');
    if (pearlBalance) {
        const pearls = userData.pearls || userData.stats?.pearls || 0;
        pearlBalance.textContent = pearls.toLocaleString();
    }
    
    console.log('✅ تم تحديث بيانات اللعبة بنجاح');
}

// تحميل بيانات المستخدم للعبة
async function loadGameUserData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            window.currentUser = userData;
            displayGameUserData(userData);
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات اللعبة:', error);
    }
}

// تصدير الدوال للاستخدام العام
window.updateGameUserData = updateGameUserData;
window.displayGameUserData = displayGameUserData;

// تحديث بيانات المستخدم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 تحميل صفحة اللعبة...');
    
    // تحديث البيانات بعد تحميل الصفحة
    setTimeout(() => {
        updateGameUserData();
    }, 1000);
    
    // تحديث البيانات كل 30 ثانية
    setInterval(() => {
        updateGameUserData();
    }, 30000);
}); 