// ملف التنقل - يتعامل مع أزرار التنقل بين الصفحات
const BACKEND_URL = "https://mygame25bita-1-4ue6.onrender.com";

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
    
    // التحذير عند محاولة إغلاق التبويب/المتصفح
    window.addEventListener('beforeunload', function(e) {
        // التحقق من أن المستخدم مسجل دخول
        if (window.currentUser) {
            const message = 'هل تريد الخروج من الموقع؟ سيتم فقدان تقدمك في اللعبة.';
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });
    
    // التحذير عند محاولة العودة للصفحة السابقة
    window.addEventListener('popstate', function(e) {
        if (window.currentUser) {
            e.preventDefault();
            showExitConfirmation();
        }
    });
    
    // منع استخدام زر العودة في المتصفح
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function() {
        if (window.currentUser) {
            history.pushState(null, null, location.href);
            showExitConfirmation();
        }
    });
    
    console.log('✅ تم إعداد تحذير الخروج');
}

// عرض تأكيد الخروج
function showExitConfirmation() {
    const confirmed = confirm('هل تريد الخروج من الموقع؟\n\n✅ البقاء - للاستمرار في اللعبة\n❌ الخروج - للعودة للصفحة السابقة');
    
    if (confirmed) {
        // إذا اختار الخروج، نسمح بالعودة
        window.history.back();
    } else {
        // إذا اختار البقاء، نبقى في الصفحة الحالية
        console.log('👤 المستخدم اختار البقاء في الموقع');
    }
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
    if (userIdDisplay && userData.userId) {
        userIdDisplay.textContent = `ID: ${userData.userId}`;
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
    const buttons = {
        profile: document.getElementById('profile-button'),
        trading: document.getElementById('trading-button'),
        gifts: document.getElementById('gifts-button'),
        shield: document.getElementById('shield-button'),
        logout: document.getElementById('logout-button')
    };
    
    // إظهار جميع الأزرار للمستخدمين العاديين
    Object.values(buttons).forEach(button => {
        if (button) {
            button.style.display = 'flex';
            button.disabled = false;
        }
    });
    
    // إضافة تأثيرات بصرية للأزرار
    Object.values(buttons).forEach(button => {
        if (button) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    });
    
    console.log('✅ تم إظهار أزرار التنقل للمستخدم:', userData.username);
}

// إخفاء جميع أزرار التنقل
function hideAllNavigationButtons() {
    const buttons = [
        'profile-button',
        'trading-button', 
        'gifts-button',
        'shield-button',
        'logout-button'
    ];
    
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'none';
            button.disabled = true;
        }
    });
    
    console.log('❌ تم إخفاء جميع أزرار التنقل');
}

// معالجة تسجيل الخروج
function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        // حذف البيانات المحلية
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        
        // حذف بيانات المستخدم من الذاكرة
        window.currentUser = null;
        
        // إخفاء أزرار التنقل
        hideAllNavigationButtons();
        
        // إعادة التوجيه لصفحة تسجيل الدخول
        window.location.href = 'index.html';
        
        console.log('✅ تم تسجيل الخروج بنجاح');
    }
}

// دالة لعرض الرسائل
function showMessage(message, type = 'info') {
    // البحث عن عنصر عرض الرسائل
    let messageContainer = document.getElementById('message-box') || 
                          document.getElementById('message-area') ||
                          document.querySelector('.message-area');
    
    if (messageContainer) {
        // إزالة الرسائل السابقة
        messageContainer.innerHTML = '';
        
        // إنشاء رسالة جديدة
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // إضافة الرسالة للحاوية
        messageContainer.appendChild(messageElement);
        
        // إزالة الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    } else {
        // إذا لم نجد حاوية للرسائل، نستخدم alert
        alert(message);
    }
}

// دالة لتحديث حالة الأزرار بناءً على بيانات الخادم
async function refreshNavigationStatus() {
    console.log('🔄 تحديث حالة أزرار التنقل...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        hideAllNavigationButtons();
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            window.currentUser = userData;
            showNavigationButtons(userData);
            
            // تحديث عرض بيانات المستخدم
            displayUserData(userData);
        } else {
            hideAllNavigationButtons();
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة التنقل:', error);
        hideAllNavigationButtons();
    }
}

// تصدير الدوال للاستخدام في ملفات أخرى
window.Navigation = {
    initialize: initializeNavigation,
    refresh: refreshNavigationStatus,
    showMessage: showMessage,
    handleLogout: handleLogout,
    showExitConfirmation: showExitConfirmation,
    displayUserData: displayUserData
};

// دالة لتحديث بيانات المستخدم يدوياً
function refreshUserData() {
    if (window.currentUser) {
        displayUserData(window.currentUser);
    } else {
        checkAuthStatus();
    }
}

// تصدير دالة تحديث البيانات
window.refreshUserData = refreshUserData;

// تهيئة التنقل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 تحميل نظام التنقل...');
    initializeNavigation();
    
    // تحديث البيانات بعد ثانيتين للتأكد من تحميل جميع العناصر
    setTimeout(() => {
        refreshUserData();
    }, 2000);
});

// تحديث حالة التنقل كل 5 دقائق
setInterval(() => {
    if (window.currentUser) {
        refreshNavigationStatus();
    }
}, 5 * 60 * 1000); 