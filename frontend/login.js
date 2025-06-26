const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com"; // Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const contactTab = document.getElementById('contact-tab');

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const contactSectionContent = document.getElementById('contact-section-content');

    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');

    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const registerButton = document.getElementById('register-button');

    const messageBox = document.getElementById('message-box');

    const adminChoiceModal = document.getElementById('admin-choice-modal');
    const goToGameBtn = document.getElementById('go-to-game-btn');
    const goToAdminBtn = document.getElementById('go-to-admin-btn');

    const avatarSection = document.getElementById('avatar-section');
    const avatarForm = document.getElementById('avatarForm');
    const avatarInput = document.getElementById('avatarInput');
    const profileAvatar = document.getElementById('profileAvatar');

    // متغيرات لمنع التكرار
    let isLoggingIn = false;
    let isRegistering = false;

    // Force hide admin modal on page load
    if (adminChoiceModal) {
        adminChoiceModal.style.display = 'none';
    }

    function showMessage(message, isError = false) {
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
    }

    function setButtonLoading(button, isLoading) {
        button.disabled = isLoading;
        if (isLoading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    }

    function switchTab(activeTab) {
        // Hide all sections and remove active class from all tabs
        [loginTab, registerTab, contactTab].forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        [loginSection, registerSection, contactSectionContent].forEach(section => {
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

    async function handleLogin() {
        // منع التكرار
        if (isLoggingIn) {
            console.log('Login already in progress, ignoring duplicate request');
            return;
        }

        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();
        
        console.log('🔐 محاولة تسجيل دخول:', { username, password: password ? '***' : 'فارغة' });
        
        if (!username || !password) {
            showMessage('الرجاء إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور.', true);
            console.error('Login error: missing username or password');
            return;
        }
        
        isLoggingIn = true;
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
                console.log('✅ تسجيل الدخول ناجح، حفظ البيانات...');
                
                // حفظ البيانات في localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
                localStorage.setItem('username', data.username);
                
                // التحقق من حفظ البيانات
                const savedToken = localStorage.getItem('token');
                const savedUsername = localStorage.getItem('username');
                const savedIsAdmin = localStorage.getItem('isAdmin');
                
                console.log('💾 البيانات المحفوظة:', {
                    token: savedToken ? 'موجود' : 'غير موجود',
                    username: savedUsername,
                    isAdmin: savedIsAdmin
                });
                
                showMessage('تم تسجيل الدخول بنجاح!', false);
                
                // منع المزيد من الطلبات
                loginButton.disabled = true;
                
                setTimeout(() => {
                    if (data.isAdmin) {
                        console.log('👑 المستخدم مشرف، إظهار خيارات المشرف');
                        adminChoiceModal.style.display = 'flex';
                    } else {
                        console.log('🎮 المستخدم لاعب عادي، إعادة توجيه للعبة');
                        window.location.href = 'game.html';
                    }
                }, 1500); // زيادة الوقت للتأكد من حفظ البيانات
            } else {
                showMessage(`فشل تسجيل الدخول: ${data.message || 'خطأ غير معروف'}`, true);
                console.error('Login failed:', data);
            }
        } catch (error) {
            console.error('❌ خطأ في الاتصال بالخادم:', error);
            showMessage('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقًا.', true);
        } finally {
            isLoggingIn = false;
            setButtonLoading(loginButton, false);
        }
    }

    async function handleRegister() {
        // منع التكرار
        if (isRegistering) {
            console.log('Registration already in progress, ignoring duplicate request');
            return;
        }

        const username = registerUsernameInput.value.trim();
        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value.trim();
        if (!username || !email || !password) {
            showMessage('الرجاء تعبئة جميع الحقول للتسجيل.', true);
            console.error('Register error: missing fields');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            showMessage('الرجاء إدخال بريد إلكتروني صالح.', true);
            console.error('Register error: invalid email');
            return;
        }
        
        isRegistering = true;
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
            } else {
                showMessage(`فشل التسجيل: ${data.message || 'خطأ غير معروف'}`, true);
                console.error('Register failed:', data);
            }
        } catch (error) {
            console.error('خطأ في الاتصال بالخادم:', error);
            showMessage('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقًا.', true);
        } finally {
            isRegistering = false;
            setButtonLoading(registerButton, false);
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

    // إزالة جميع الأحداث السابقة لمنع التكرار
    function removeAllEventListeners() {
        // إزالة أحداث النقر على ألسنة التبويب
        if (loginTab) {
            loginTab.replaceWith(loginTab.cloneNode(true));
        }
        if (registerTab) {
            registerTab.replaceWith(registerTab.cloneNode(true));
        }
        if (contactTab) {
            contactTab.replaceWith(contactTab.cloneNode(true));
        }

        // إزالة أحداث الأزرار
        if (loginButton) {
            loginButton.replaceWith(loginButton.cloneNode(true));
        }
        if (registerButton) {
            registerButton.replaceWith(registerButton.cloneNode(true));
        }

        // إزالة أحداث النماذج
        if (loginForm) {
            loginForm.replaceWith(loginForm.cloneNode(true));
        }
        if (registerForm) {
            registerForm.replaceWith(registerForm.cloneNode(true));
        }
    }

    // إزالة الأحداث السابقة
    removeAllEventListeners();

    // إعادة الحصول على العناصر بعد الاستبدال
    const newLoginTab = document.getElementById('login-tab');
    const newRegisterTab = document.getElementById('register-tab');
    const newContactTab = document.getElementById('contact-tab');
    const newLoginButton = document.getElementById('login-button');
    const newRegisterButton = document.getElementById('register-button');
    const newLoginForm = document.getElementById('login-form');
    const newRegisterForm = document.getElementById('register-form');

    // إضافة الأحداث الجديدة
    if (newLoginTab) newLoginTab.addEventListener('click', () => switchTab(newLoginTab));
    if (newRegisterTab) newRegisterTab.addEventListener('click', () => switchTab(newRegisterTab));
    if (newContactTab) newContactTab.addEventListener('click', () => switchTab(newContactTab));

    // أحداث النقر على الأزرار
    if (newLoginButton) {
        newLoginButton.addEventListener('click', handleLogin);
    }
    if (newRegisterButton) {
        newRegisterButton.addEventListener('click', handleRegister);
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
        if (e.key === 'Enter' && !isLoggingIn) {
            handleLogin();
        }
    });
    loginPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isLoggingIn) {
            handleLogin();
        }
    });
    registerUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isRegistering) {
            handleRegister();
        }
    });
    registerEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isRegistering) {
            handleRegister();
        }
    });
    registerPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isRegistering) {
            handleRegister();
        }
    });

    // إخفاء زر تسجيل دخول المسؤول القديم إذا كان موجوداً
    const oldAdminLoginButton = document.getElementById('adminLoginButton');
    if (oldAdminLoginButton) {
        oldAdminLoginButton.style.display = 'none';
    }

    // افتراضيًا, إظهار قسم تسجيل الدخول عند تحميل الصفحة
    switchTab(newLoginTab);

    // استماع على إرسال نموذج تسجيل الدخول
    if (newLoginForm) {
        newLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isLoggingIn) {
                handleLogin();
            }
        });
    }
    // استماع على إرسال نموذج التسجيل
    if (newRegisterForm) {
        newRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isRegistering) {
                handleRegister();
            }
        });
    }
}); 