// إعدادات عامة
const BACKEND_URL = 'https://mygame25bita-7eqw.onrender.com';
let currentUser = null;

// متغير لتخزين اسم المستخدم الجاري الدردشة معه
let privateChatUser = null;
let privateChatMessages = [];

// ========== نظام المحادثة الخاصة الحديثة ========== //
let socket = null;
let chatUserId = null;
let chatUserData = null;
let chatMessages = [];
let typingTimeout = null;
let messageSound = null;
let soundEnabled = true;

// إعداد الصوت للإشعارات
let notificationSound;
try {
  notificationSound = new Audio('sounds/MSG.mp3');
} catch (error) {
  console.warn('لا يمكن تحميل ملف الصوت:', error);
}

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    setupEventListeners();
    initSocketChat();
    initMessageSound();
    setupSoundToggle();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أزرار التنقل
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', handleAction);
    });

    // إغلاق Modal عند النقر خارجه
    window.onclick = function(event) {
        const avatarModal = document.getElementById('avatarModal');
        const profileModal = document.getElementById('profileModal');
        
        if (event.target === avatarModal) {
            closeAvatarModal();
        }
        if (event.target === profileModal) {
            closeProfileModal();
        }
    }
}

// معالجة الإجراءات
function handleAction(event) {
    const action = event.target.dataset.action;
    
    switch (action) {
        case 'goBack':
            window.history.back();
            break;
        case 'editProfile':
            openProfileModal();
            break;
        case 'editAvatar':
            openAvatarModal();
            break;
        case 'playGame':
            window.location.href = 'game.html';
            break;
        case 'privateChat':
            openPrivateChat('صديق');
            break;
        case 'viewFriends':
            showAlert('ميزة الأصدقاء قيد التطوير', 'info');
            break;
    }
}

// تحميل بروفايل المستخدم
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('يجب تسجيل الدخول أولاً', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب بيانات المستخدم');
        }

        const data = await response.json();
        console.log('📥 البيانات المستلمة من الخادم:', data);
        
        // البيانات تأتي مباشرة وليس في user object
        currentUser = data;
        displayUserProfile(data);

    } catch (error) {
        console.error('خطأ في تحميل البروفايل:', error);
        showAlert('خطأ في تحميل البروفايل', 'error');
    }
}

// عرض بروفايل المستخدم
function displayUserProfile(user) {
    console.log('📋 بيانات المستخدم المستلمة:', user);
    console.log('🔍 تفاصيل البيانات:', {
        hasUser: !!user,
        userType: typeof user,
        hasProfile: user ? !!user.profile : false,
        hasStats: user ? !!user.stats : false,
        username: user ? user.username : 'غير محدد'
    });
    
    // التحقق من وجود البيانات المطلوبة
    if (!user) {
        console.error('❌ بيانات المستخدم مفقودة');
        showAlert('خطأ في تحميل بيانات المستخدم', 'error');
        return;
    }

    // تهيئة profile إذا لم يكن موجوداً
    if (!user.profile) {
        console.log('⚠️ المستخدم لا يحتوي على profile، سيتم إنشاء واحد افتراضي');
        user.profile = {
            avatar: 'images/default-avatar.png',
            displayName: user.username,
            level: 1
        };
    }

    // تهيئة stats إذا لم يكن موجوداً
    if (!user.stats) {
        console.log('⚠️ المستخدم لا يحتوي على stats، سيتم إنشاء واحد افتراضي');
        user.stats = {
            score: 0
        };
    }

    console.log('✅ البيانات جاهزة للعرض:', {
        username: user.username,
        profile: user.profile,
        stats: user.stats
    });

    // تطبيق الألوان حسب الجنس
    applyGenderColors(user.profile?.gender);

    // تحديث الكلاسات على الحاويات الرئيسية
    const genderClass = user.profile?.gender === 'female' ? 'female' : 'male';
    document.querySelector('.profile-header').classList.remove('male', 'female');
    document.querySelector('.profile-header').classList.add(genderClass);
    document.querySelector('.info-container').classList.remove('male', 'female');
    document.querySelector('.info-container').classList.add(genderClass);
    document.getElementById('shield-status').classList.remove('male', 'female');
    document.getElementById('shield-status').classList.add(genderClass);

    // الصورة الشخصية
    const avatar = document.getElementById('user-avatar');
    if (avatar) {
        avatar.src = user.profile.avatar || 'images/default-avatar.png';
        avatar.alt = user.username;
    }

    // الاسم المعروض
    const displayName = document.getElementById('display-name');
    if (displayName) {
        displayName.textContent = user.profile.displayName || user.username;
    }

    // معرف المستخدم
    const userId = document.getElementById('user-id');
    if (userId) {
        userId.textContent = `ID: ${user.userId || 'غير محدد'}`;
    }

    // العملات
    const coinsElement = document.getElementById('user-coins');
    if (coinsElement) {
        const coins = user.stats?.coins || 0;
        coinsElement.textContent = `${coins.toLocaleString()} عملة`;
        coinsElement.title = `رصيدك الحالي: ${coins.toLocaleString()} عملة نقدية`;
    }

    // اللؤلؤ
    const pearlsElement = document.getElementById('user-pearls');
    if (pearlsElement) {
        const pearls = user.stats?.pearls || 0;
        pearlsElement.textContent = `${pearls} لؤلؤ`;
        pearlsElement.title = `رصيدك الحالي: ${pearls} لؤلؤ`;
    }

    // مدة التواجد
    const timeOnlineElement = document.getElementById('user-time-online');
    if (timeOnlineElement && user.timeOnline) {
        const { days, hours, minutes } = user.timeOnline;
        let timeText = '';
        if (days > 0) {
            timeText += `${days} يوم `;
        }
        if (hours > 0) {
            timeText += `${hours} ساعة `;
        }
        if (minutes > 0) {
            timeText += `${minutes} دقيقة`;
        }
        if (!timeText) {
            timeText = 'أقل من دقيقة';
        }
        timeOnlineElement.textContent = timeText;
        timeOnlineElement.title = `مدة تواجدك في اللعبة: ${timeText}`;
    }

    // حالة الجوائز اليومية
    displayDailyRewardStatus(user.dailyRewards);

    // حالة الدرع
    displayShieldStatus(user.shield);

    // الإنجازات
    displayAchievements(user.achievements || []);

    // الأصدقاء
    displayFriends(user.relationships?.friends || []);
}

// تطبيق الألوان حسب الجنس
function applyGenderColors(gender) {
    const profileHeader = document.querySelector('.profile-header');
    if (!profileHeader) return;

    // إزالة الألوان السابقة
    profileHeader.classList.remove('male', 'female', 'default');

    // تطبيق الألوان حسب الجنس
    if (gender === 'male') {
        profileHeader.classList.add('male');
        console.log('🎨 تطبيق ألوان الذكور');
    } else if (gender === 'female') {
        profileHeader.classList.add('female');
        console.log('🎨 تطبيق ألوان الإناث');
    } else {
        profileHeader.classList.add('default');
        console.log('🎨 تطبيق الألوان الافتراضية');
    }
}

// عرض حالة الدرع
function displayShieldStatus(shield) {
    const shieldStatus = document.getElementById('shield-status');
    const shieldDuration = document.getElementById('shield-duration');
    
    if (!shieldStatus) return; // إذا لم يكن العنصر موجوداً
    
    if (!shield || !shield.active) {
        // الدرع غير فعال
        shieldStatus.className = 'shield-status inactive';
        if (shieldDuration) shieldDuration.textContent = '-';
    } else {
        // الدرع فعال
        shieldStatus.className = 'shield-status active';
        
        if (shield.expiresAt && shieldDuration) {
            const duration = formatDuration(shield.expiresAt);
            shieldDuration.textContent = duration;
        } else if (shieldDuration) {
            shieldDuration.textContent = 'غير محدد';
        }
    }
}

// عرض الإنجازات
function displayAchievements(achievements) {
    const achievementsGrid = document.getElementById('achievements-grid');
    const genderClass = document.querySelector('.profile-header').classList.contains('female') ? 'female' : 'male';
    if (achievements.length === 0) {
        achievementsGrid.innerHTML = '<div class="achievement-placeholder">لا توجد إنجازات بعد</div>';
        return;
    }
    const achievementsHTML = achievements.map(achievement => `
        <div class="achievement-item ${genderClass} ${achievement.unlocked ? 'unlocked' : ''}">
            <div class="achievement-icon">${achievement.icon || '🏆'}</div>
            <div class="achievement-name">${achievement.name || ''}</div>
        </div>
    `).join('');
    achievementsGrid.innerHTML = achievementsHTML;
}

// تنسيق المدة الزمنية
function formatDuration(expiresAt) {
    if (!expiresAt) return '-';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'منتهي';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}س ${minutes}د`;
    } else {
        return `${minutes}د`;
    }
}

// فتح Modal تعديل الصورة الشخصية
function openAvatarModal() {
    document.getElementById('avatarModal').style.display = 'block';
    document.getElementById('avatarForm').reset();
    document.getElementById('avatarPreview').style.display = 'none';
}

// إغلاق Modal تعديل الصورة الشخصية
function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
    
    // إعادة تعيين حالة تحديد مساحة الظهور
    const cropOverlay = document.getElementById('cropOverlay');
    const cropControls = document.getElementById('cropControls');
    const preview = document.getElementById('avatarPreview');
    
    if (cropOverlay) cropOverlay.style.display = 'none';
    if (cropControls) cropControls.style.display = 'none';
    if (preview) preview.style.display = 'none';
    
    // إعادة تعيين البيانات
    cropData = {
        scale: 1,
        x: 0,
        y: 0,
        isDragging: false,
        startX: 0,
        startY: 0
    };
}

// معاينة الصورة الشخصية
function previewAvatar(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('avatarPreview');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropControls = document.getElementById('cropControls');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            cropOverlay.style.display = 'block';
            cropControls.style.display = 'flex';
            
            // تهيئة تحديد مساحة الظهور
            initCrop();
        };
        reader.readAsDataURL(file);
    }
}

// متغيرات لتحديد مساحة الظهور
let cropData = {
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    startX: 0,
    startY: 0
};

// تهيئة تحديد مساحة الظهور
function initCrop() {
    const cropFrame = document.getElementById('cropFrame');
    const cropOverlay = document.getElementById('cropOverlay');
    
    // إضافة مستمعي الأحداث للسحب
    cropFrame.addEventListener('mousedown', startDrag);
    cropOverlay.addEventListener('mousemove', drag);
    cropOverlay.addEventListener('mouseup', stopDrag);
    
    // إضافة مستمعي الأحداث للمس (للأجهزة المحمولة)
    cropFrame.addEventListener('touchstart', startDrag);
    cropOverlay.addEventListener('touchmove', drag);
    cropOverlay.addEventListener('touchend', stopDrag);
}

// بدء السحب
function startDrag(e) {
    e.preventDefault();
    cropData.isDragging = true;
    const rect = e.target.getBoundingClientRect();
    cropData.startX = (e.clientX || e.touches[0].clientX) - rect.left;
    cropData.startY = (e.clientY || e.touches[0].clientY) - rect.top;
}

// السحب
function drag(e) {
    if (!cropData.isDragging) return;
    e.preventDefault();
    
    const cropFrame = document.getElementById('cropFrame');
    const cropOverlay = document.getElementById('cropOverlay');
    const rect = cropOverlay.getBoundingClientRect();
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left - cropData.startX;
    const y = (e.clientY || e.touches[0].clientY) - rect.top - cropData.startY;
    
    // حدود المنطقة
    const maxX = rect.width - cropFrame.offsetWidth;
    const maxY = rect.height - cropFrame.offsetHeight;
    
    cropData.x = Math.max(0, Math.min(x, maxX));
    cropData.y = Math.max(0, Math.min(y, maxY));
    
    cropFrame.style.left = cropData.x + 'px';
    cropFrame.style.top = cropData.y + 'px';
    cropFrame.style.transform = 'none';
}

// إيقاف السحب
function stopDrag() {
    cropData.isDragging = false;
}

// تعديل التكبير/التصغير
function adjustCrop(action) {
    const cropFrame = document.getElementById('cropFrame');
    const preview = document.getElementById('avatarPreview');
    
    if (action === 'zoom-in') {
        cropData.scale = Math.min(cropData.scale * 1.1, 3);
    } else if (action === 'zoom-out') {
        cropData.scale = Math.max(cropData.scale * 0.9, 0.5);
    }
    
    preview.style.transform = `scale(${cropData.scale})`;
}

// إعادة تعيين تحديد مساحة الظهور
function resetCrop() {
    const cropFrame = document.getElementById('cropFrame');
    const preview = document.getElementById('avatarPreview');
    
    cropData = {
        scale: 1,
        x: 0,
        y: 0,
        isDragging: false,
        startX: 0,
        startY: 0
    };
    
    cropFrame.style.left = '50%';
    cropFrame.style.top = '50%';
    cropFrame.style.transform = 'translate(-50%, -50%)';
    preview.style.transform = 'scale(1)';
}

// تحويل الصورة المحددة إلى Base64
function cropImageToBase64() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const preview = document.getElementById('avatarPreview');
        const cropFrame = document.getElementById('cropFrame');
        
        // حجم الصورة النهائية
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        
        // حساب إحداثيات القطع
        const rect = cropFrame.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        
        const scaleX = preview.naturalWidth / previewRect.width;
        const scaleY = preview.naturalHeight / previewRect.height;
        
        const sourceX = (rect.left - previewRect.left) * scaleX;
        const sourceY = (rect.top - previewRect.top) * scaleY;
        const sourceSize = rect.width * scaleX;
        
        // رسم الصورة المقطوعة
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.drawImage(
            preview,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, size, size
        );
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
    });
}

// تحويل الملف إلى Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// عرض التنبيهات
function showAlert(message, type) {
    // إنشاء عنصر التنبيه
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // تحديد لون الخلفية حسب النوع
    if (type === 'success') {
        alertDiv.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        alertDiv.style.backgroundColor = '#dc3545';
    } else {
        alertDiv.style.backgroundColor = '#007bff';
    }

    // إضافة التنبيه للصفحة
    document.body.appendChild(alertDiv);

    // إزالة التنبيه بعد 5 ثوانٍ
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// تحديث الصورة الشخصية
async function updateAvatar(event) {
    event.preventDefault();
    
    try {
        const fileInput = document.getElementById('avatarFile');
        if (!fileInput.files[0]) {
            showAlert('يرجى اختيار صورة', 'error');
            return;
        }

        // تحويل الصورة المحددة إلى Base64
        const imageData = await cropImageToBase64();
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/update-avatar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                avatar: imageData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'فشل في تحديث الصورة الشخصية');
        }

        const result = await response.json();
        showAlert('تم تحديث الصورة الشخصية بنجاح', 'success');
        
        // تحديث الصورة في الواجهة
        document.getElementById('user-avatar').src = imageData;
        
        closeAvatarModal();
        loadUserProfile(); // إعادة تحميل البيانات

    } catch (error) {
        console.error('خطأ في تحديث الصورة الشخصية:', error);
        showAlert(`خطأ في تحديث الصورة الشخصية: ${error.message}`, 'error');
    }
}

// فتح Modal تعديل البروفايل
function openProfileModal() {
    document.getElementById('profileModal').style.display = 'block';
    document.getElementById('displayNameInput').value = currentUser.profile?.displayName || currentUser.username;
    document.getElementById('genderSelect').value = currentUser.profile?.gender || 'prefer-not-to-say';
}

// إغلاق Modal تعديل البروفايل
function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

// تحديث البروفايل
async function updateProfile(event) {
    event.preventDefault();
    
    try {
        const displayName = document.getElementById('displayNameInput').value.trim();
        const gender = document.getElementById('genderSelect').value;
        
        if (!displayName) {
            showAlert('يرجى إدخال الاسم المعروض', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/update-profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayName: displayName,
                gender: gender
            })
        });

        if (!response.ok) {
            throw new Error('فشل في تحديث البروفايل');
        }

        const result = await response.json();
        showAlert('تم تحديث البروفايل بنجاح', 'success');
        
        // تحديث البيانات المحلية
        if (currentUser.profile) {
            currentUser.profile.displayName = displayName;
            currentUser.profile.gender = gender;
        } else {
            currentUser.profile = {
                displayName: displayName,
                gender: gender
            };
        }
        
        // تطبيق الألوان الجديدة
        applyGenderColors(gender);
        
        // تحديث العرض
        displayUserProfile(currentUser);
        
        closeProfileModal();

    } catch (error) {
        console.error('خطأ في تحديث البروفايل:', error);
        showAlert('خطأ في تحديث البروفايل', 'error');
    }
}

// الأصدقاء
function displayFriends(friends) {
    const friendsGrid = document.getElementById('friends-grid');
    const genderClass = document.querySelector('.profile-header').classList.contains('female') ? 'female' : 'male';
    if (!friends || friends.length === 0) {
        friendsGrid.innerHTML = '<div class="friends-placeholder">لا توجد أصدقاء بعد</div>';
        return;
    }
    const friendsHTML = friends.map(friend => `
        <div class="friend-item ${genderClass}" onclick="openPrivateChat('${friend.username}')">
            <img class="friend-avatar" src="${friend.avatar || 'images/default-avatar.png'}" alt="${friend.username}">
            <div class="friend-name">${friend.username}</div>
            <div class="friend-status ${friend.online ? 'online' : 'offline'}">
                ${friend.online ? '🟢 متصل' : '🔴 غير متصل'}
            </div>
        </div>
    `).join('');
    friendsGrid.innerHTML = friendsHTML;
}

// فتح المحادثة الخاصة
function openPrivateChat(username) {
    privateChatUser = username;
    document.getElementById('privateChatTitle').textContent = `محادثة مع ${username}`;
    document.getElementById('privateChatModal').style.display = 'block';
    document.getElementById('privateChatInput').value = '';
    renderPrivateChatMessages();
}

// غلق المحادثة الخاصة
function closePrivateChat() {
    document.getElementById('privateChatModal').style.display = 'none';
}

// إرسال رسالة خاصة
function sendPrivateMessage(event) {
    event.preventDefault();
    const input = document.getElementById('privateChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    // أضف الرسالة كمحاكاة محلية
    privateChatMessages.push({ sender: 'أنا', text: msg, me: true });
    renderPrivateChatMessages();
    input.value = '';
    // محاكاة رد تلقائي
    setTimeout(() => {
        privateChatMessages.push({ sender: privateChatUser, text: '👍', me: false });
        renderPrivateChatMessages();
    }, 700);
}

// عرض رسائل المحادثة
function renderPrivateChatMessages() {
    const box = document.getElementById('privateChatMessages');
    box.innerHTML = privateChatMessages.map(msg => `
        <div class="private-message${msg.me ? ' me' : ''}">
            <div class="sender">${msg.sender}</div>
            <div>${msg.text}</div>
        </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
}

// إعداد زر الصوت
function setupSoundToggle() {
    const soundBtn = document.getElementById('soundToggleBtn');
    if (!soundBtn) return;
    
    // تحميل حالة الصوت المحفوظة
    soundEnabled = localStorage.getItem('chatSoundEnabled') !== 'false';
    updateSoundButton();
    
    soundBtn.onclick = function() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('chatSoundEnabled', soundEnabled);
        updateSoundButton();
        
        // إشعار للمستخدم
        showAlert(soundEnabled ? 'تم تشغيل الصوت' : 'تم إيقاف الصوت', 'info');
    };
}

// تحديث شكل زر الصوت
function updateSoundButton() {
    const soundBtn = document.getElementById('soundToggleBtn');
    if (!soundBtn) return;
    
    if (soundEnabled) {
        soundBtn.textContent = '🔊';
        soundBtn.classList.remove('muted');
        soundBtn.title = 'إيقاف الصوت';
    } else {
        soundBtn.textContent = '🔇';
        soundBtn.classList.add('muted');
        soundBtn.title = 'تشغيل الصوت';
    }
}

// تهيئة صوت الرسائل
function initMessageSound() {
    messageSound = new Audio('sounds/MSG.mp3');
    messageSound.volume = 0.6; // مستوى الصوت 60%
    messageSound.preload = 'auto';
}

// تشغيل نغمة الرسالة
function playMessageSound() {
    if (messageSound && soundEnabled) {
        messageSound.currentTime = 0; // إعادة تعيين الصوت
        messageSound.play().catch(e => console.log('لا يمكن تشغيل الصوت:', e));
    }
}

function initSocketChat() {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) return;
    // الاتصال بالسيرفر
    socket = io(BACKEND_URL, {
        transports: ['websocket'],
        withCredentials: true
    });
    // الانضمام باسم المستخدم
    socket.on('connect', () => {
        socket.emit('join', currentUser.userId);
        loadRecentChats();
    });
    // استقبال رسالة جديدة
    socket.on('new_message', (msg) => {
        if (msg.senderId == chatUserId || msg.senderId == currentUser.userId) {
            chatMessages.push(msg);
            renderChatMessages();
            if (msg.senderId != currentUser.userId) {
                markMessagesAsRead(chatUserId);
                // تشغيل نغمة التنبيه إذا كانت الرسالة من شخص آخر
                playMessageSound();
            }
        } else {
            // إشعار في الشريط الجانبي + نغمة تنبيه
            showSidebarNotification(msg.senderId);
            playMessageSound();
        }
    });
    // استقبال حالة الكتابة
    socket.on('user_typing', ({ userId }) => {
        if (userId == chatUserId) showTypingIndicator();
    });
    socket.on('user_stopped_typing', ({ userId }) => {
        if (userId == chatUserId) hideTypingIndicator();
    });
    // استقبال حالة القراءة
    socket.on('messages_read', ({ readerId }) => {
        if (readerId == chatUserId) markAllAsReadLocally();
    });
}

// تحميل المحادثات الأخيرة
async function loadRecentChats() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/chat/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    renderChatSidebar(data.chats || []);
}

// عرض الشريط الجانبي للمحادثات
function renderChatSidebar(chats) {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    if (!chats.length) {
        chatList.innerHTML = '<div style="padding:16px;color:#888;">لا توجد محادثات بعد</div>';
        return;
    }
    chatList.innerHTML = chats.map(chat => `
        <div class="chat-list-item${chat.userId == chatUserId ? ' active' : ''}" data-userid="${chat.userId}">
            <img class="chat-list-avatar" src="${chat.avatar || 'images/default-avatar.png'}" alt="${chat.username}">
            <div class="chat-list-info">
                <div class="chat-list-username">${chat.username}</div>
                <div class="chat-list-last">${chat.lastMessage ? chat.lastMessage.message : ''}</div>
            </div>
            ${chat.unreadCount > 0 ? `<span class="chat-list-unread">${chat.unreadCount}</span>` : ''}
        </div>
    `).join('');
    // إضافة مستمعي النقر
    document.querySelectorAll('.chat-list-item').forEach(item => {
        item.onclick = () => openChatWithUser(item.dataset.userid);
    });
}

// فتح محادثة مع مستخدم
async function openChatWithUser(userId) {
    chatUserId = userId;
    chatMessages = [];
    document.getElementById('chatInputForm').style.display = 'flex';
    // جلب بيانات المستخدم
    const chat = await getUserData(userId);
    chatUserData = chat;
    document.getElementById('chatWithName').textContent = chat.username;
    document.getElementById('chatStatus').textContent = chat.online ? '🟢 متصل' : '🔴 غير متصل';
    // جلب الرسائل
    await loadChatMessages(userId);
    // إبلاغ السيرفر أن الرسائل تمت قراءتها
    markMessagesAsRead(userId);
}

// جلب بيانات مستخدم
async function getUserData(userId) {
    // من الشريط الجانبي أو API المستخدمين
    // هنا نستخدم الشريط الجانبي أولاً
    const sidebarItem = document.querySelector(`.chat-list-item[data-userid="${userId}"]`);
    if (sidebarItem) {
        return {
            userId,
            username: sidebarItem.querySelector('.chat-list-username').textContent,
            avatar: sidebarItem.querySelector('.chat-list-avatar').src,
            online: sidebarItem.querySelector('.chat-list-unread') ? true : false
        };
    }
    // أو جلب من API
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
}

// جلب رسائل المحادثة
async function loadChatMessages(otherUserId) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/chat/messages/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    chatMessages = data.messages || [];
    renderChatMessages();
}

// عرض الرسائل
function renderChatMessages() {
    const box = document.getElementById('chatMessages');
    if (!box) return;
    box.innerHTML = chatMessages.map(msg => `
        <div class="chat-bubble${msg.senderId == currentUser.userId ? ' me' : ' other'}">
            <img class="avatar" src="${msg.senderId == currentUser.userId ? currentUser.profile.avatar : chatUserData?.avatar || 'images/default-avatar.png'}" alt="avatar">
            <div>
                <div>${msg.message}</div>
                <div class="meta">${formatTime(msg.timestamp)}${msg.senderId == currentUser.userId ? renderReadStatus(msg) : ''}</div>
            </div>
        </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
}

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function renderReadStatus(msg) {
    return `<span class="read-status${msg.read ? '' : ' unread'}">${msg.read ? '✓✓' : '✓'}</span>`;
}

// إرسال رسالة
const chatInputForm = document.getElementById('chatInputForm');
if (chatInputForm) {
    chatInputForm.onsubmit = function(e) {
        e.preventDefault();
        sendChatMessage();
    };
    document.getElementById('chatInput').oninput = function() {
        if (socket && chatUserId) {
            socket.emit('typing_start', { receiverId: chatUserId });
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                socket.emit('typing_stop', { receiverId: chatUserId });
            }, 1200);
        }
    };
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg || !socket || !chatUserId) return;
    socket.emit('send_message', {
        receiverId: chatUserId,
        message: msg
    });
    input.value = '';
}

// حالة الكتابة
function showTypingIndicator() {
    let el = document.getElementById('typingIndicator');
    if (!el) {
        el = document.createElement('div');
        el.id = 'typingIndicator';
        el.className = 'typing-indicator';
        el.textContent = 'يكتب...';
        document.getElementById('chatMessages').appendChild(el);
    }
}
function hideTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

// حالة القراءة
function markMessagesAsRead(otherUserId) {
    if (!socket || !otherUserId) return;
    socket.emit('mark_read', { otherUserId });
}
function markAllAsReadLocally() {
    chatMessages.forEach(msg => {
        if (msg.receiverId == currentUser.userId) msg.read = true;
    });
    renderChatMessages();
}

// إشعار في الشريط الجانبي
function showSidebarNotification(userId) {
    const item = document.querySelector(`.chat-list-item[data-userid="${userId}"]`);
    if (item) item.classList.add('active');
}

// عرض حالة الجوائز اليومية
function displayDailyRewardStatus(dailyRewards) {
    const dailyRewardElement = document.getElementById('daily-reward-status');
    if (!dailyRewardElement) return;

    if (!dailyRewards || !dailyRewards.lastClaimDate) {
        // لم يحصل على جائزة من قبل
        dailyRewardElement.innerHTML = `
            <div class="daily-reward-available">
                <span class="reward-icon">🎁</span>
                <span class="reward-text">جائزة اليوم متاحة!</span>
                <button class="btn primary" onclick="claimDailyReward()">احصل على الجائزة</button>
            </div>
        `;
        return;
    }

    const lastClaim = new Date(dailyRewards.lastClaimDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
    
    if (lastClaimDay.getTime() === today.getTime()) {
        // حصل على الجائزة اليوم
        const nextReward = new Date(today);
        nextReward.setDate(nextReward.getDate() + 1);
        const timeUntilNext = nextReward.getTime() - now.getTime();
        const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
        const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
        
        dailyRewardElement.innerHTML = `
            <div class="daily-reward-claimed">
                <span class="reward-icon">✅</span>
                <span class="reward-text">تم الحصول على جائزة اليوم!</span>
                <span class="reward-streak">استمرارية: ${dailyRewards.streakDays} يوم</span>
                <span class="reward-next">الجائزة التالية: ${hoursUntilNext}س ${minutesUntilNext}د</span>
            </div>
        `;
    } else {
        // يمكن الحصول على الجائزة
        dailyRewardElement.innerHTML = `
            <div class="daily-reward-available">
                <span class="reward-icon">🎁</span>
                <span class="reward-text">جائزة اليوم متاحة!</span>
                <span class="reward-streak">استمرارية: ${dailyRewards.streakDays} يوم</span>
                <button class="btn primary" onclick="claimDailyReward()">احصل على الجائزة</button>
            </div>
        `;
    }
}

// دالة الحصول على الجائزة اليومية
async function claimDailyReward() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        const response = await fetch(`${BACKEND_URL}/api/auth/daily-reward`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            // إعادة تحميل البروفايل لتحديث البيانات
            loadUserProfile();
        } else {
            showAlert(data.message, 'error');
        }

    } catch (error) {
        console.error('خطأ في الحصول على الجائزة اليومية:', error);
        showAlert('خطأ في الحصول على الجائزة اليومية', 'error');
    }
}

// دالة عرض نافذة إضافة الأصدقاء
function showAddFriendModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'addFriendModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAddFriendModal()">&times;</span>
            <h3>إضافة صديق جديد</h3>
            <form id="addFriendForm" onsubmit="addFriend(event)">
                <div class="form-group">
                    <label for="friendUsername">اسم المستخدم أو معرف المستخدم:</label>
                    <input type="text" id="friendUsername" placeholder="أدخل اسم المستخدم أو المعرف" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn primary">➕ إضافة صديق</button>
                    <button type="button" onclick="closeAddFriendModal()" class="btn secondary">❌ إلغاء</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // إغلاق النافذة عند النقر خارجها
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeAddFriendModal();
        }
    };
}

// دالة إغلاق نافذة إضافة الأصدقاء
function closeAddFriendModal() {
    const modal = document.getElementById('addFriendModal');
    if (modal) {
        modal.remove();
    }
}

// دالة إضافة صديق
async function addFriend(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        const friendUsername = document.getElementById('friendUsername').value.trim();
        if (!friendUsername) {
            showAlert('يرجى إدخال اسم المستخدم أو المعرف', 'error');
            return;
        }

        const response = await fetch(`${BACKEND_URL}/api/user/friends/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUsername: friendUsername })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            closeAddFriendModal();
            // إعادة تحميل قائمة الأصدقاء
            loadUserProfile();
        } else {
            showAlert(data.message, 'error');
        }

    } catch (error) {
        console.error('خطأ في إضافة الصديق:', error);
        showAlert('خطأ في إضافة الصديق', 'error');
    }
}