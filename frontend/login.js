const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 تحميل صفحة تسجيل الدخول...');
    
    // التحقق من وجود token صالح عند تحميل الصفحة
    checkExistingToken();
    
    setupEventListeners();
    setupTabSwitching();
    
    console.log('✅ تم تحميل صفحة تسجيل الدخول بنجاح');
});

// التحقق من وجود token صالح
async function checkExistingToken() {
    const token = localStorage.getItem('token');
    console.log('🔍 فحص token:', token ? 'موجود' : 'غير موجود');
    
    if (!token) {
        console.log('❌ لا يوجد token، عرض صفحة تسجيل الدخول');
        hideLogoutButton();
        hideGameButton();
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ token صالح، المستخدم:', data.username);
            
            // إظهار الأزرار المناسبة حسب نوع المستخدم
            if (data.isAdmin) {
                showLogoutButton(data.username);
                showMessage(`مرحباً بعودتك ${data.username}! يمكنك تسجيل الدخول مرة أخرى أو تسجيل الخروج.`);
                console.log('👑 المستخدم مشرف، يمكنه تسجيل الدخول مرة أخرى أو تسجيل الخروج');
            } else {
                showGameButton(data.username);
                showLogoutButton(data.username);
                showMessage(`مرحباً بعودتك ${data.username}! يمكنك الدخول للعبة أو تسجيل الخروج.`);
                console.log('👤 المستخدم عادي، يمكنه الدخول للعبة أو تسجيل الخروج');
            }
            
        } else {
            console.log('❌ token غير صالح، حذفه');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('isAdmin');
            hideLogoutButton();
        }
    } catch (error) {
        console.error('❌ خطأ في التحقق من التوكن:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        hideLogoutButton();
    }
}

// إظهار زر تسجيل الخروج
function showLogoutButton(username) {
    const logoutTab = document.getElementById('logout-tab');
    if (logoutTab) {
        logoutTab.style.display = 'inline-block';
        logoutTab.textContent = `تسجيل الخروج (${username})`;
    }
}

// إظهار زر الدخول للعبة
function showGameButton(username) {
    const gameTab = document.getElementById('game-tab');
    if (gameTab) {
        gameTab.style.display = 'inline-block';
        gameTab.textContent = `🎮 الدخول للعبة (${username})`;
    }
}

// إخفاء زر تسجيل الخروج
function hideLogoutButton() {
    const logoutTab = document.getElementById('logout-tab');
    if (logoutTab) {
        logoutTab.style.display = 'none';
    }
}

// إخفاء زر الدخول للعبة
function hideGameButton() {
    const gameTab = document.getElementById('game-tab');
    if (gameTab) {
        gameTab.style.display = 'none';
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const goToGameBtn = document.getElementById('go-to-game-btn');
    const goToAdminBtn = document.getElementById('go-to-admin-btn');
    const logoutTab = document.getElementById('logout-tab');
    const gameTab = document.getElementById('game-tab');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (goToGameBtn) {
        goToGameBtn.addEventListener('click', () => {
            window.location.href = 'game.html';
        });
    }
    
    if (goToAdminBtn) {
        goToAdminBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }
    
    if (logoutTab) {
        logoutTab.addEventListener('click', handleLogout);
    }
    
    if (gameTab) {
        gameTab.addEventListener('click', () => {
            window.location.href = 'game.html';
        });
    }
}

// إعداد تبديل الألسنة
function setupTabSwitching() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const contactTab = document.getElementById('contact-tab');
    const logoutTab = document.getElementById('logout-tab');
    
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const contactSection = document.getElementById('contact-section-content');
    
    if (loginTab) loginTab.addEventListener('click', () => switchTab(loginTab, loginSection));
    if (registerTab) registerTab.addEventListener('click', () => switchTab(registerTab, registerSection));
    if (contactTab) contactTab.addEventListener('click', () => switchTab(contactTab, contactSection));
    if (logoutTab) logoutTab.addEventListener('click', handleLogout);
}

function switchTab(activeTab, activeSection) {
    // إزالة الفئة النشطة من جميع الألسنة والأقسام
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
    // إضافة الفئة النشطة للعنصر المحدد
    activeTab.classList.add('active');
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // إخفاء رسائل الخطأ
    hideMessage();
}

// إظهار رسالة
function showMessage(message, isError = false) {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) return;
    
    messageBox.textContent = message;
    messageBox.className = `message-box ${isError ? 'error' : 'success'} show`;
    
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// إخفاء رسالة
function hideMessage() {
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.classList.remove('show');
    }
}

// إظهار مودال خيارات المشرف
function showAdminChoiceModal() {
    const modal = document.getElementById('admin-choice-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// إغلاق مودال خيارات المشرف
function closeAdminModal() {
    const modal = document.getElementById('admin-choice-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// معالجة تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    console.log('🔐 محاولة تسجيل دخول للمستخدم:', username);
    
    if (!username || !password) {
        showMessage('الرجاء إدخال اسم المستخدم وكلمة المرور', true);
        return;
    }
    
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="loading-spinner"></span><span class="btn-text">جاري تسجيل الدخول...</span>';
    }
    
    try {
        console.log('🌐 إرسال طلب تسجيل الدخول للخادم...');
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        console.log('📡 استجابة الخادم:', response.status, data);
        
        if (response.ok) {
            // حفظ البيانات
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
            
            console.log('✅ تم تسجيل الدخول بنجاح');
            showMessage('تم تسجيل الدخول بنجاح!');
            
            // التوجيه بعد ثانية
            setTimeout(() => {
                if (data.isAdmin) {
                    console.log('👑 المستخدم مشرف، عرض خيارات المشرف');
                    showAdminChoiceModal();
                } else {
                    console.log('🎮 توجيه المستخدم العادي إلى اللعبة');
                    window.location.href = 'game.html';
                }
            }, 1000);
        } else {
            console.log('❌ فشل تسجيل الدخول:', data.message);
            showMessage(data.message || 'فشل تسجيل الدخول', true);
        }
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        showMessage('خطأ في الاتصال بالخادم', true);
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = '<span class="btn-text">تسجيل الدخول</span>';
        }
    }
}

// معالجة التسجيل
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    
    if (!username || !email || !password) {
        showMessage('الرجاء تعبئة جميع الحقول', true);
        return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
        showMessage('الرجاء إدخال بريد إلكتروني صالح', true);
        return;
    }
    
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.disabled = true;
        registerButton.innerHTML = '<span class="loading-spinner"></span><span class="btn-text">جاري التسجيل...</span>';
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.');
            
            // التبديل إلى صفحة تسجيل الدخول
            const loginTab = document.getElementById('login-tab');
            const loginSection = document.getElementById('login-section');
            if (loginTab && loginSection) {
                switchTab(loginTab, loginSection);
            }
            
            // تعبئة اسم المستخدم
            const loginUsernameInput = document.getElementById('login-username');
            if (loginUsernameInput) {
                loginUsernameInput.value = username;
            }
        } else {
            showMessage(data.message || 'فشل التسجيل', true);
        }
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        showMessage('خطأ في الاتصال بالخادم', true);
    } finally {
        if (registerButton) {
            registerButton.disabled = false;
            registerButton.innerHTML = '<span class="btn-text">تسجيل</span>';
        }
    }
}

// معالجة تسجيل الخروج
function handleLogout() {
    try {
        console.log('🚪 جاري تسجيل الخروج...');
        
        // حذف البيانات المحلية
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        
        // إخفاء جميع الأزرار
        hideLogoutButton();
        hideGameButton();
        
        // إظهار رسالة نجاح
        showMessage('تم تسجيل الخروج بنجاح');
        
        console.log('✅ تم تسجيل الخروج بنجاح');
        
        // إعادة تحميل الصفحة بعد ثانية
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
        showMessage('خطأ في تسجيل الخروج', true);
    }
} 