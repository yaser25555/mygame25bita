const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker مسجل بنجاح:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ فشل في تسجيل Service Worker:', error);
            });
    });
}

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
    const adminLoginForm = document.getElementById('admin-login-form');
    const goToGameBtn = document.getElementById('go-to-game-btn');
    const goToAdminBtn = document.getElementById('go-to-admin-btn');
    const logoutTab = document.getElementById('logout-tab');
    const gameTab = document.getElementById('game-tab');
    const closeAdminModal = document.getElementById('close-admin-modal');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
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
    
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', closeAdminModalFunction);
    }
}

// إعداد تبديل الألسنة
function setupTabSwitching() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const adminLoginTab = document.getElementById('admin-login-tab');
    const contactTab = document.getElementById('contact-tab');
    const logoutTab = document.getElementById('logout-tab');
    
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const adminLoginSection = document.getElementById('admin-login-section');
    const contactSection = document.getElementById('contact-section-content');
    
    if (loginTab) loginTab.addEventListener('click', () => switchTab(loginTab, loginSection));
    if (registerTab) registerTab.addEventListener('click', () => switchTab(registerTab, registerSection));
    if (adminLoginTab) adminLoginTab.addEventListener('click', () => switchTab(adminLoginTab, adminLoginSection));
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
    messageBox.className = `message-box ${isError ? 'error' : 'success'}`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// إخفاء رسالة
function hideMessage() {
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.style.display = 'none';
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
function closeAdminModalFunction() {
    const modal = document.getElementById('admin-choice-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// معالجة تسجيل دخول المشرف
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const adminLoginButton = document.getElementById('admin-login-button');
    const username = document.getElementById('admin-login-username').value.trim();
    const password = document.getElementById('admin-login-password').value;
    
    if (!username || !password) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', true);
        return;
    }
    
    // إظهار حالة التحميل
    adminLoginButton.classList.add('loading');
    adminLoginButton.disabled = true;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            // التحقق من أن المستخدم مشرف
            if (data.isAdmin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('isAdmin', 'true');
                
                showMessage(`مرحباً بك أيها المشرف ${data.username}!`);
                console.log('👑 تم تسجيل دخول المشرف بنجاح:', data.username);
                
                // إظهار مودال خيارات المشرف
                setTimeout(() => {
                    showAdminChoiceModal();
                }, 1000);
                
            } else {
                showMessage('هذا الحساب ليس حساب مشرف. يرجى استخدام قسم تسجيل الدخول العادي.', true);
                console.log('❌ محاولة تسجيل دخول مشرف بحساب عادي:', username);
            }
        } else {
            showMessage(data.message || 'فشل في تسجيل دخول المشرف', true);
            console.log('❌ فشل في تسجيل دخول المشرف:', data.message);
        }
    } catch (error) {
        console.error('❌ خطأ في تسجيل دخول المشرف:', error);
        showMessage('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', true);
    } finally {
        // إخفاء حالة التحميل
        adminLoginButton.classList.remove('loading');
        adminLoginButton.disabled = false;
    }
}

// معالجة تسجيل الدخول العادي
async function handleLogin(event) {
    event.preventDefault();
    
    const loginButton = document.getElementById('login-button');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', true);
        return;
    }
    
    // إظهار حالة التحميل
    loginButton.classList.add('loading');
    loginButton.disabled = true;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
            
            showMessage(`مرحباً بك ${data.username}! تم تسجيل الدخول بنجاح.`);
            console.log('✅ تم تسجيل الدخول بنجاح:', data.username, 'مشرف:', data.isAdmin);
            
            // إذا كان المستخدم مشرف، إظهار مودال الخيارات
            if (data.isAdmin) {
                setTimeout(() => {
                    showAdminChoiceModal();
                }, 1000);
            } else {
                // للمستخدمين العاديين، إظهار أزرار اللعبة وتسجيل الخروج
                setTimeout(() => {
                    showGameButton(data.username);
                    showLogoutButton(data.username);
                }, 1000);
            }
            
        } else {
            showMessage(data.message || 'فشل في تسجيل الدخول', true);
            console.log('❌ فشل في تسجيل الدخول:', data.message);
        }
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        showMessage('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', true);
    } finally {
        // إخفاء حالة التحميل
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
    }
}

// معالجة التسجيل
async function handleRegister(event) {
    event.preventDefault();
    
    const registerButton = document.getElementById('register-button');
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (!username || !email || !password) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', true);
        return;
    }
    
    if (password.length < 6) {
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', true);
        return;
    }
    
    // إظهار حالة التحميل
    registerButton.classList.add('loading');
    registerButton.disabled = true;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.');
            console.log('✅ تم التسجيل بنجاح:', username);
            
            // مسح النموذج
            document.getElementById('register-form').reset();
            
            // الانتقال إلى تبويب تسجيل الدخول
            const loginTab = document.getElementById('login-tab');
            const loginSection = document.getElementById('login-section');
            if (loginTab && loginSection) {
                switchTab(loginTab, loginSection);
            }
            
        } else {
            showMessage(data.message || 'فشل في التسجيل', true);
            console.log('❌ فشل في التسجيل:', data.message);
        }
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        showMessage('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', true);
    } finally {
        // إخفاء حالة التحميل
        registerButton.classList.remove('loading');
        registerButton.disabled = false;
    }
}

// معالجة تسجيل الخروج
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    
    showMessage('تم تسجيل الخروج بنجاح');
    console.log('✅ تم تسجيل الخروج');
    
    // إخفاء الأزرار
    hideLogoutButton();
    hideGameButton();
    
    // إغلاق مودال المشرف إذا كان مفتوحاً
    closeAdminModalFunction();
    
    // الانتقال إلى تبويب تسجيل الدخول
    const loginTab = document.getElementById('login-tab');
    const loginSection = document.getElementById('login-section');
    if (loginTab && loginSection) {
        switchTab(loginTab, loginSection);
    }
} 