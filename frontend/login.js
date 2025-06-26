const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود token صالح عند تحميل الصفحة
    checkExistingToken();
    
    setupEventListeners();
    setupTabSwitching();
});

// التحقق من وجود token صالح
async function checkExistingToken() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
                showAdminChoiceModal();
            } else {
                window.location.href = 'game.html';
            }
        } else {
            // Token غير صالح، حذفه
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('isAdmin');
        }
    } catch (error) {
        console.error('خطأ في التحقق من التوكن:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const goToGameBtn = document.getElementById('go-to-game-btn');
    const goToAdminBtn = document.getElementById('go-to-admin-btn');
    
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
}

// إعداد تبديل الألسنة
function setupTabSwitching() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const contactTab = document.getElementById('contact-tab');
    
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const contactSection = document.getElementById('contact-section-content');
    
    if (loginTab) loginTab.addEventListener('click', () => switchTab(loginTab, loginSection));
    if (registerTab) registerTab.addEventListener('click', () => switchTab(registerTab, registerSection));
    if (contactTab) contactTab.addEventListener('click', () => switchTab(contactTab, contactSection));
}

function switchTab(activeTab, activeSection) {
    // إزالة الفئة النشطة من جميع الألسنة والأقسام
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
    // إضافة الفئة النشطة للعنصر المحدد
    activeTab.classList.add('active');
    activeSection.classList.add('active');
    
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

// معالجة تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
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
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // حفظ البيانات
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
            
            showMessage('تم تسجيل الدخول بنجاح!');
            
            // التوجيه بعد ثانية
            setTimeout(() => {
                if (data.isAdmin) {
                    showAdminChoiceModal();
                } else {
                    window.location.href = 'game.html';
                }
            }, 1000);
        } else {
            showMessage(data.message || 'فشل تسجيل الدخول', true);
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
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