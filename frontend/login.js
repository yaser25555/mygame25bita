const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com"; // Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const instructionsTab = document.getElementById('instructions-tab');
    // تم إزالة appsTab من هنا
    const contactTab = document.getElementById('contact-tab');

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const instructionsSectionContent = document.getElementById('instructions-section-content');
    // تم إزالة appsSectionContent من هنا
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

    async function handleLogin() {
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();
        
        console.log('🔐 محاولة تسجيل دخول:', { username, password: password ? '***' : 'فارغة' });
        
        if (!username || !password) {
            showMessage('الرجاء إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور.', true);
            console.error('Login error: missing username or password');
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
                localStorage.setItem('token', data.token);
                localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
                localStorage.setItem('username', data.username);
                showMessage('تم تسجيل الدخول بنجاح!', false);
                console.log('✅ تسجيل الدخول ناجح، إعادة توجيه...');
                setTimeout(() => {
                    if (data.isAdmin) {
                        adminChoiceModal.style.display = 'flex';
                    } else {
                        window.location.href = 'game.html';
                    }
                }, 500);
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

    async function handleRegister() {
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
            setButtonLoading(registerButton, false);
        }
    }

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
    // تم إزالة حدث النقر لـ appsTab
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