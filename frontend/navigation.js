// ملف محفوظ بترميز UTF-8 بدون BOM
// ملف التنقل - يتعامل مع أزرار التنقل بين الصفحات
const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// دالة تشغيل الصوت (مؤقتة لحل مشكلة ReferenceError)
function playSound(soundName) {
    try {
        // محاولة الوصول لدالة playSound من game.js إذا كانت متاحة
        if (typeof window.playSound === 'function') {
            window.playSound(soundName);
            return;
        }
        
        // إذا لم تكن متاحة، استخدم الأصوات المباشرة
        const sounds = {
            buttonClick: document.getElementById('buttonClick'),
            win: document.getElementById('winSound'),
            lose: document.getElementById('loseSound')
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

// دالة تهيئة أزرار التنقل
function initializeNavigation() {
    console.log('🚀 تهيئة أزرار التنقل...');
    
    // التحقق من حالة تسجيل الدخول أولاً
    checkAuthStatus().then(() => {
        setupNavigationButtons();
        setupExitWarning(); // إضافة التحذير عند الخروج
    });
}

// إعداد التحذير عند محاولة الخروج
function setupExitWarning() {
    console.log('⚠️ إعداد تحذير الخروج...');
    
    // التحذير عند محاولة إغلاق التبويب/المتصفح فقط
    window.addEventListener('beforeunload', function(e) {
        // التحقق من أن المستخدم مسجل دخول
        if (window.currentUser) {
            const message = 'هل تريد الخروج من الموقع؟ سيتم فقدان تقدمك في اللعبة.';
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });
    
    // إزالة التحذيرات من التنقل الداخلي (popstate)
    // لا نضع أي event listeners للـ popstate لتجنب التحذيرات عند التنقل الداخلي
    
    console.log('✅ تم إعداد تحذير الخروج (فقط عند مغادرة الموقع)');
}

// التحقق من حالة المصادقة من الخادم
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('❌ لا يوجد token، إخفاء أزرار التنقل');
        hideAllNavigationButtons();
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ تم التحقق من المصادقة:', userData.username);
            
            // حفظ بيانات المستخدم في الذاكرة (وليس localStorage)
            window.currentUser = userData;
            
            // إظهار الأزرار المناسبة حسب نوع المستخدم
            showNavigationButtons(userData);
            
            // عرض بيانات المستخدم في الواجهة
            displayUserData(userData);
            
        } else {
            console.log('❌ token غير صالح، إخفاء أزرار التنقل');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('isAdmin');
            hideAllNavigationButtons();
        }
    } catch (error) {
        console.error('❌ خطأ في التحقق من المصادقة:', error);
        hideAllNavigationButtons();
    }
}

// عرض بيانات المستخدم في الواجهة
function displayUserData(userData) {
    console.log('📊 عرض بيانات المستخدم:', userData);
    
    // عرض اسم المستخدم
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = userData.username || userData.displayName || 'مستخدم';
        console.log('✅ تم تحديث اسم المستخدم:', usernameDisplay.textContent);
    }
    
    // عرض الرصيد
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay) {
        const balance = userData.balance || userData.stats?.score || 0;
        balanceDisplay.textContent = balance.toLocaleString();
        console.log('✅ تم تحديث الرصيد:', balance);
    }
    
    // عرض اللآلئ
    const pearlBalance = document.getElementById('pearl-balance');
    if (pearlBalance) {
        const pearls = userData.pearls || userData.stats?.pearls || 0;
        pearlBalance.textContent = pearls.toLocaleString();
        console.log('✅ تم تحديث اللآلئ:', pearls);
    }
    
    // عرض معرف المستخدم إذا كان متوفراً
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) {
        console.log('🔍 البحث عن معرف المستخدم في البيانات:', userData);
        console.log('🔍 userData.userId:', userData.userId);
        console.log('🔍 userData._id:', userData._id);
        
        if (userData.userId) {
            userIdDisplay.textContent = `ID: ${userData.userId}`;
            console.log('✅ تم عرض معرف المستخدم:', userData.userId);
        } else if (userData._id) {
            userIdDisplay.textContent = `ID: ${userData._id}`;
            console.log('✅ تم عرض معرف المستخدم (من _id):', userData._id);
        } else {
            userIdDisplay.textContent = 'ID: غير محدد';
            console.log('⚠️ معرف المستخدم غير متوفر في البيانات');
        }
    } else {
        console.log('❌ عنصر user-id-display غير موجود في الصفحة');
    }
    
    console.log('✅ تم عرض جميع بيانات المستخدم بنجاح');
}

// إعداد أزرار التنقل
function setupNavigationButtons() {
    // زر البروفايل
    const profileButton = document.getElementById('profile-button');
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'profile.html';
            } else {
                showMessage('يرجى تسجيل الدخول أولاً', 'error');
            }
        });
    }
    
    // زر التداول
    const tradingButton = document.getElementById('trading-button');
    if (tradingButton) {
        tradingButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'trading.html';
            } else {
                showMessage('يرجى تسجيل الدخول أولاً', 'error');
            }
        });
    }
    
    // زر الهدايا
    const giftsButton = document.getElementById('gifts-button');
    if (giftsButton) {
        giftsButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'gifts.html';
            } else {
                showMessage('يرجى تسجيل الدخول أولاً', 'error');
            }
        });
    }
    
    // زر الدرع
    const shieldButton = document.getElementById('shield-button');
    if (shieldButton) {
        shieldButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'shield.html';
            } else {
                showMessage('يرجى تسجيل الدخول أولاً', 'error');
            }
        });
    }
    
    // زر تعبئة الرصيد
    const rechargeButton = document.getElementById('recharge-button');
    if (rechargeButton) {
        rechargeButton.addEventListener('click', () => {
            playSound('buttonClick');
            showMessage('لشحن الرصيد، تواصل معنا عبر الواتساب: 00966554593007', 'info');
        });
    }
    
    // زر المصباح
    const lampButton = document.getElementById('lamp-button');
    if (lampButton) {
        lampButton.addEventListener('click', () => {
            playSound('buttonClick');
            showMessage('ميزة المصباح قيد التطوير', 'info');
        });
    }
    
    // زر كتم الصوت
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            playSound('buttonClick');
            toggleMute();
        });
    }
    
    // زر تسجيل الخروج
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            playSound('buttonClick');
            handleLogout();
        });
    }
    
    console.log('✅ تم إعداد أزرار التنقل');
}

// إظهار أزرار التنقل حسب نوع المستخدم
function showNavigationButtons(userData) {
    console.log('✅ تم إظهار أزرار التنقل للمستخدم:', userData.username);
    
    // إظهار جميع الأزرار للمستخدمين العاديين
    const buttons = [
        'profile-button', 'trading-button', 'gifts-button', 
        'shield-button', 'recharge-button', 'lamp-button', 
        'logout-button', 'mute-button'
    ];
    
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'inline-block';
        }
    });
    
    // إذا كان المستخدم مشرف، إظهار أزرار إضافية
    if (userData.isAdmin) {
        const adminButtons = ['admin-button'];
        adminButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.style.display = 'inline-block';
            }
        });
    }
}

// إخفاء جميع أزرار التنقل
function hideAllNavigationButtons() {
    const buttons = [
        'profile-button', 'trading-button', 'gifts-button', 
        'shield-button', 'recharge-button', 'lamp-button', 
        'logout-button', 'mute-button', 'admin-button'
    ];
    
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'none';
        }
    });
}

// معالجة تسجيل الخروج
function handleLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        window.currentUser = null;
        
        showMessage('تم تسجيل الخروج بنجاح');
        
        // إعادة توجيه إلى صفحة تسجيل الدخول
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// عرض رسالة للمستخدم
function showMessage(message, type = 'info') {
    // يمكن تحسين هذه الدالة لتعرض رسائل أكثر جمالاً
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // إذا كان هناك عنصر لعرض الرسائل، استخدمه
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000);
    }
}

// تحديث حالة التنقل
async function refreshNavigationStatus() {
    console.log('🔄 تحديث حالة التنقل...');
    await checkAuthStatus();
}

// تحديث بيانات المستخدم
function refreshUserData() {
    if (window.currentUser) {
        displayUserData(window.currentUser);
    }
}

// تصدير الدوال للاستخدام العام
window.initializeNavigation = initializeNavigation;
window.refreshNavigationStatus = refreshNavigationStatus;
window.refreshUserData = refreshUserData;
window.showMessage = showMessage;

// تهيئة التنقل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 تحميل نظام التنقل...');
    initializeNavigation();
}); 