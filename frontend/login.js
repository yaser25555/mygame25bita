const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com"; // Use your actual backend URL

// نظام الإشعارات المتقدم لصفحة تسجيل الدخول
class LoginNotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'login-notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);

        // تأثير ظهور
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // إزالة تلقائية
        setTimeout(() => {
            this.remove(notification);
        }, duration);
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `login-notification ${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            cursor: pointer;
            font-family: 'Noto Naskh Arabic', sans-serif;
            font-size: 14px;
            position: relative;
            overflow: hidden;
        `;

        // إضافة أيقونة
        const icon = document.createElement('span');
        icon.innerHTML = this.getIcon(type);
        icon.style.marginLeft = '10px';
        notification.appendChild(icon);

        // إضافة النص
        const text = document.createElement('span');
        text.textContent = message;
        notification.appendChild(text);

        // زر الإغلاق
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            left: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
        `;
        closeBtn.onclick = () => this.remove(notification);
        notification.appendChild(closeBtn);

        return notification;
    }

    getBackgroundColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[type] || colors.info;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    remove(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// تهيئة نظام الإشعارات
const loginNotifications = new LoginNotificationSystem();

document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const instructionsTab = document.getElementById('instructions-tab');
    const contactTab = document.getElementById('contact-tab');

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const instructionsSectionContent = document.getElementById('instructions-section-content');
    const contactSectionContent = document.getElementById('contact-section-content');

    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');

    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const registerButton = document.getElementById('register-button');

    const messageBox = document.getElementById('message-box');
    const getTipButton = document.getElementById('get-tip-button');
    const gameTipOutput = document.getElementById('game-tip-output');

    const adminChoiceModal = document.getElementById('admin-choice-modal');
    const goToGameBtn = document.getElementById('go-to-game-btn');
    const goToAdminBtn = document.getElementById('go-to-admin-btn');

    const avatarSection = document.getElementById('avatar-section');
    const avatarForm = document.getElementById('avatarForm');
    const avatarInput = document.getElementById('avatarInput');
    const profileAvatar = document.getElementById('profileAvatar');

    // Force hide admin modal on page load
    if (adminChoiceModal) {
        adminChoiceModal.style.display = 'none';
    }

    // تحسين دالة إظهار الرسائل
    function showMessage(message, isError = false) {
        // إظهار رسالة في الصندوق التقليدي
        messageBox.textContent = message;
        messageBox.classList.remove('success', 'error');
        if (isError) {
            messageBox.classList.add('error');
        } else {
            messageBox.classList.add('success');
        }
        messageBox.classList.add('show');
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, 5000);

        // إظهار إشعار متقدم
        loginNotifications.show(message, isError ? 'error' : 'success');
    }

    // تحسين دالة تحميل الأزرار
    function setButtonLoading(button, isLoading) {
        button.disabled = isLoading;
        if (isLoading) {
            button.classList.add('loading');
            button.querySelector('.btn-text').textContent = 'جاري التحميل...';
        } else {
            button.classList.remove('loading');
            // إعادة النص الأصلي حسب نوع الزر
            if (button.id === 'login-button') {
                button.querySelector('.btn-text').textContent = 'تسجيل الدخول';
            } else if (button.id === 'register-button') {
                button.querySelector('.btn-text').textContent = 'تسجيل';
            }
        }
    }

    // تحسين دالة تبديل التبويبات
    function switchTab(activeTab) {
        // Hide all sections and remove active class from all tabs
        [loginTab, registerTab, instructionsTab, contactTab].forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        [loginSection, registerSection, instructionsSectionContent, contactSectionContent].forEach(section => {
            if (section) section.classList.remove('active');
        });

        // Show the correct section based on the active tab
        if (activeTab) {
            activeTab.classList.add('active');
            const targetSectionId = activeTab.id.replace('-tab', '-section');
            const targetSection = document.getElementById(targetSectionId) || document.getElementById(targetSectionId + '-content');
            if (targetSection) {
                targetSection.classList.add('active');
            }
        }
        messageBox.classList.remove('show');
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // تحسين دالة تسجيل الدخول مع ميزات أمان إضافية
    async function handleLogin() {
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();
        const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
        
        console.log('🔐 محاولة تسجيل دخول:', { username, password: password ? '***' : 'فارغة', rememberMe });
        
        if (!username || !password) {
            showMessage('الرجاء إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور.', true);
            console.error('Login error: missing username or password');
            return;
        }

        // التحقق من قوة كلمة المرور
        if (password.length < 6) {
            showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', true);
            return;
        }
        
        setButtonLoading(loginButton, true);
        console.log('🌐 إرسال طلب إلى:', `${BACKEND_URL}/api/auth/login`);
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            
            console.log('📡 استجابة الخادم:', response.status, response.statusText);
            
            const data = await response.json();
            console.log('📄 بيانات الاستجابة:', data);
            
            if (response.ok) {
                // حفظ البيانات بشكل آمن
                localStorage.setItem('token', data.token);
                localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
                localStorage.setItem('username', data.username);
                localStorage.setItem('loginTime', new Date().toISOString());
                
                // حفظ بيانات تذكرني
                saveLoginData(username, rememberMe);
                
                showMessage('تم تسجيل الدخول بنجاح!', false);
                console.log('✅ تسجيل الدخول ناجح، إعادة توجيه...');
                
                // تأخير قصير لإظهار رسالة النجاح
                setTimeout(() => {
                    if (data.isAdmin) {
                        adminChoiceModal.style.display = 'flex';
                    } else {
                        window.location.href = 'game.html';
                    }
                }, 1000);
            } else {
                showMessage(`فشل تسجيل الدخول: ${data.message || 'خطأ غير معروف'}`, true);
                console.error('Login failed:', data);
            }
        } catch (error) {
            console.error('❌ خطأ في الاتصال بالخادم:', error);
            showMessage('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقًا.', true);
        } finally {
            setButtonLoading(loginButton, false);
        }
    }

    // تحسين دالة التسجيل مع تحقق إضافي
    async function handleRegister() {
        const username = registerUsernameInput.value.trim();
        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value.trim();
        const agreeTerms = agreeTermsCheckbox ? agreeTermsCheckbox.checked : false;
        
        if (!username || !email || !password) {
            showMessage('الرجاء تعبئة جميع الحقول للتسجيل.', true);
            console.error('Register error: missing fields');
            return;
        }

        // التحقق من صحة البريد الإلكتروني
        if (!/\S+@\S+\.\S+/.test(email)) {
            showMessage('الرجاء إدخال بريد إلكتروني صالح.', true);
            console.error('Register error: invalid email');
            return;
        }

        // التحقق من قوة كلمة المرور
        if (password.length < 6) {
            showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', true);
            return;
        }

        // التحقق من طول اسم المستخدم
        if (username.length < 3) {
            showMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل.', true);
            return;
        }

        // التحقق من الموافقة على الشروط
        if (!agreeTerms) {
            showMessage('يجب الموافقة على الشروط والأحكام للمتابعة.', true);
            return;
        }

        // فحص قوة كلمة المرور
        const passwordCheck = checkPasswordStrength(password);
        if (passwordCheck.score < 3) {
            showMessage('كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.', true);
            return;
        }

        setButtonLoading(registerButton, true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                showMessage('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.', false);
                switchTab(loginTab);
                loginUsernameInput.value = username;
                loginPasswordInput.value = '';
                // تفعيل تذكرني تلقائياً بعد التسجيل الناجح
                if (rememberMeCheckbox) {
                    rememberMeCheckbox.checked = true;
                }
            } else {
                showMessage(`فشل التسجيل: ${data.message || 'خطأ غير معروف'}`, true);
                console.error('Register failed:', data);
            }
        } catch (error) {
            console.error('خطأ في الاتصال بالخادم:', error);
            showMessage('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقًا.', true);
        } finally {
            setButtonLoading(registerButton, false);
        }
    }

    // دالة للتحقق من حالة الاتصال
    async function checkConnection() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn('Connection check failed:', error);
            return false;
        }
    }

    // دالة لتنظيف البيانات المحفوظة
    function clearStoredData() {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
    }

    // التحقق من الجلسة المحفوظة
    function checkStoredSession() {
        const token = localStorage.getItem('token');
        const loginTime = localStorage.getItem('loginTime');
        
        if (token && loginTime) {
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            // إذا مر أكثر من 24 ساعة، احذف الجلسة
            if (hoursDiff > 24) {
                clearStoredData();
                showMessage('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', true);
            }
        }
    }

    // تشغيل فحص الجلسة عند تحميل الصفحة
    checkStoredSession();

    // دالة إظهار/إخفاء كلمة المرور
    function togglePasswordVisibility(inputId, toggleId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // دالة فحص قوة كلمة المرور
    function checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        const strengthContainer = document.getElementById('password-strength');
        
        if (!password) {
            strengthContainer.classList.remove('show');
            return;
        }
        
        strengthContainer.classList.add('show');
        
        let score = 0;
        let feedback = [];
        
        // طول كلمة المرور
        if (password.length >= 8) score += 2;
        else if (password.length >= 6) score += 1;
        else feedback.push('كلمة المرور قصيرة جداً');
        
        // وجود أحرف كبيرة
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('أضف حروف كبيرة');
        
        // وجود أحرف صغيرة
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('أضف حروف صغيرة');
        
        // وجود أرقام
        if (/\d/.test(password)) score += 1;
        else feedback.push('أضف أرقام');
        
        // وجود رموز خاصة
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        else feedback.push('أضف رموز خاصة');
        
        // تحديد القوة
        let strength = 'weak';
        let strengthMessage = 'ضعيفة جداً';
        
        if (score >= 5) {
            strength = 'very-strong';
            strengthMessage = 'قوية جداً';
        } else if (score >= 4) {
            strength = 'strong';
            strengthMessage = 'قوية';
        } else if (score >= 3) {
            strength = 'medium';
            strengthMessage = 'متوسطة';
        } else {
            strength = 'weak';
            strengthMessage = 'ضعيفة';
        }
        
        // تحديث المؤشر البصري
        strengthBar.className = `strength-fill ${strength}`;
        strengthText.textContent = `قوة كلمة المرور: ${strengthMessage}`;
        
        return { score, strength, feedback };
    }

    // دالة حفظ بيانات تسجيل الدخول
    function saveLoginData(username, rememberMe) {
        if (rememberMe) {
            localStorage.setItem('rememberedUsername', username);
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberedUsername');
            localStorage.removeItem('rememberMe');
        }
    }

    // دالة استرجاع بيانات تسجيل الدخول
    function loadLoginData() {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        const rememberMe = localStorage.getItem('rememberMe');
        
        if (rememberedUsername && rememberMe === 'true') {
            loginUsernameInput.value = rememberedUsername;
            document.getElementById('remember-me').checked = true;
        }
    }

    // تحميل البيانات المحفوظة عند تحميل الصفحة
    loadLoginData();

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // مستمعي أحداث إظهار/إخفاء كلمة المرور
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            togglePasswordVisibility('login-password', 'toggle-password');
        });
    }

    if (toggleRegisterPasswordBtn) {
        toggleRegisterPasswordBtn.addEventListener('click', () => {
            togglePasswordVisibility('register-password', 'toggle-register-password');
        });
    }

    // مستمع حدث فحص قوة كلمة المرور
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const agreeTermsCheckbox = document.getElementById('agree-terms');

    // إضافة مستمعي الأحداث للتحسينات الجديدة
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');
    // ----------------------------------------------------
    // ميزة: الحصول على نصيحة للعبة باستخدام Gemini API
    // ----------------------------------------------------
    async function getMagicGameTip() {
        setButtonLoading(getTipButton, true);
        gameTipOutput.textContent = 'جاري توليد نصيحة سحرية...';
        
        try {
            const prompt = "Please provide a short, single-sentence, motivational, or strategic tip for playing a game called 'INFINITY BOX VOICEBOOM'. The game involves opening mysterious boxes to get points, but some boxes might reduce points. Players can collect points at any time or proceed to the next round. The game also has special powers. The tip should be in Arabic.";
            
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                gameTipOutput.textContent = text;
            } else {
                gameTipOutput.textContent = 'عذراً، لم أتمكن من توليد نصيحة الآن. يرجى المحاولة لاحقاً.';
                console.error('Gemini API returned an unexpected response structure:', result);
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            gameTipOutput.textContent = 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.';
        } finally {
            setButtonLoading(getTipButton, false);
        }
    }

    // إظهار قسم الصورة الرمزية فقط إذا كان المستخدم مسجلاً الدخول
    if (localStorage.getItem('token')) {
        avatarSection.style.display = 'block';
        // جلب الصورة الحالية من السيرفر
        fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
        .then(res => res.json())
        .then(data => {
            if (data.avatar) {
                profileAvatar.src = data.avatar;
            }
        });
    }

    avatarForm.onsubmit = async function(e) {
        e.preventDefault();
        if (!avatarInput.files[0]) return;
        const formData = new FormData();
        formData.append('avatar', avatarInput.files[0]);
        const res = await fetch(`${BACKEND_URL}/api/users/upload-avatar`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            body: formData
        });
        const data = await res.json();
        if (data.avatar) {
            profileAvatar.src = data.avatar;
            showMessage('تم رفع الصورة بنجاح!');
        } else {
            showMessage('حدث خطأ أثناء رفع الصورة', true);
        }
    };

    // حدث النقر على ألسنة التبويب
    if (loginTab) loginTab.addEventListener('click', () => switchTab(loginTab));
    if (registerTab) registerTab.addEventListener('click', () => switchTab(registerTab));
    if (instructionsTab) instructionsTab.addEventListener('click', () => switchTab(instructionsTab));
    if (contactTab) contactTab.addEventListener('click', () => switchTab(contactTab));

    // أحداث النقر على الأزرار
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
    if (registerButton) {
        registerButton.addEventListener('click', handleRegister);
    }
    if (getTipButton) {
        getTipButton.addEventListener('click', getMagicGameTip);
    }

    if(goToGameBtn) {
        goToGameBtn.addEventListener('click', () => {
            window.location.href = 'game.html';
        });
    }

    if(goToAdminBtn) {
        goToAdminBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }

    // السماح بالضغط على Enter لإرسال النماذج
    loginUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginButton.click();
    });
    loginPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginButton.click();
    });
    registerUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerButton.click();
    });
    registerEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerButton.click();
    });
    registerPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerButton.click();
    });

    // إخفاء زر تسجيل دخول المسؤول القديم إذا كان موجوداً
    const oldAdminLoginButton = document.getElementById('adminLoginButton');
    if (oldAdminLoginButton) {
        oldAdminLoginButton.style.display = 'none';
    }

    // افتراضيًا, إظهار قسم تسجيل الدخول عند تحميل الصفحة
    switchTab(loginTab);

    // استماع على إرسال نموذج تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }
    // استماع على إرسال نموذج التسجيل
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister();
        });
    }
}); 