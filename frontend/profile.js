// إعدادات عامة
const BACKEND_URL = 'https://mygame25bita-7eqw.onrender.com';
let currentUser = null;

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    setupEventListeners();
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
        case 'viewStats':
            window.location.href = 'stats.html';
            break;
        case 'viewFriends':
            window.location.href = 'friends.html';
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

    // المستوى
    const userLevel = document.getElementById('user-level');
    if (userLevel) {
        userLevel.textContent = user.profile.level || 1;
    }

    // عدد الأصدقاء فقط
    const friendsCount = document.getElementById('friends-count');
    if (friendsCount) {
        friendsCount.textContent = user.relationships?.friends?.length || 0;
    }

    // حالة الدرع
    displayShieldStatus(user.shield);

    // الإنجازات
    displayAchievements(user.achievements || []);
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
    const shieldName = document.getElementById('shield-name');
    const shieldDuration = document.getElementById('shield-duration');

    if (!shieldStatus || !shieldName || !shieldDuration) {
        console.warn('⚠️ عناصر الدرع غير موجودة في الصفحة');
        return;
    }

    if (shield && shield.currentShield && shield.currentShield.isActive) {
        shieldName.textContent = shield.currentShield.type || 'درع نشط';
        shieldDuration.textContent = `متبقي: ${formatDuration(shield.currentShield.expiresAt)}`;
        shieldStatus.style.display = 'flex';
    } else {
        shieldName.textContent = 'بدون درع';
        shieldDuration.textContent = '-';
        shieldStatus.style.display = 'flex';
    }
}

// عرض الإنجازات
function displayAchievements(achievements) {
    const achievementsGrid = document.getElementById('achievements-grid');
    
    if (achievements.length === 0) {
        achievementsGrid.innerHTML = '<div class="achievement-placeholder">لا توجد إنجازات بعد</div>';
        return;
    }

    const achievementsHTML = achievements.map(achievement => `
        <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
            <div class="achievement-icon">${achievement.icon || '🏆'}</div>
            <div class="achievement-name">${achievement.name}</div>
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
}

// معاينة الصورة الشخصية
function previewAvatar(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('avatarPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
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

        const file = fileInput.files[0];
        const imageData = await fileToBase64(file);
        
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
            throw new Error('فشل في تحديث الصورة الشخصية');
        }

        const result = await response.json();
        showAlert('تم تحديث الصورة الشخصية بنجاح', 'success');
        
        // تحديث الصورة في الواجهة
        document.getElementById('user-avatar').src = imageData;
        
        closeAvatarModal();
        loadUserProfile(); // إعادة تحميل البيانات

    } catch (error) {
        console.error('خطأ في تحديث الصورة الشخصية:', error);
        showAlert('خطأ في تحديث الصورة الشخصية', 'error');
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