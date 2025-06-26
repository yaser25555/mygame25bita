const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// متغيرات عامة
let currentUser = null;
let friends = [];
let friendRequests = [];
let blockedUsers = [];
let achievements = [];

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 تحميل صفحة البروفايل...');
    
    // التحقق من تسجيل الدخول
    checkAuth();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // تحميل بيانات المستخدم
    loadUserProfile();
    
    console.log('✅ تم تحميل صفحة البروفايل بنجاح');
});

// التحقق من تسجيل الدخول
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('يجب تسجيل الدخول أولاً', true);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // التبويبات
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // تبويبات الأصدقاء
    document.querySelectorAll('.friend-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchFriendTab(tab.dataset.friendTab);
        });
    });
    
    // نموذج تعديل البروفايل
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
    
    // عداد الأحرف للسيرة الذاتية
    const bioTextarea = document.getElementById('edit-bio');
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateCharCount);
    }
    
    // نافذة رفع الصور
    setupImageUpload();
    
    // إعدادات الخصوصية
    setupPrivacySettings();
    
    // إعدادات الإشعارات
    setupNotificationSettings();
    
    // إعدادات اللعبة
    setupGameSettings();
    
    // إضافة مستمعي الأحداث للـ data attributes
    setupDataActionListeners();
}

// إعداد مستمعي الأحداث للـ data attributes
function setupDataActionListeners() {
    // مستمع عام للأزرار مع data-action
    document.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;
        
        switch (action) {
            case 'goBack':
                goBack();
                break;
            case 'openSettings':
                openSettings();
                break;
            case 'editProfile':
                editProfile();
                break;
            case 'viewStats':
                viewStats();
                break;
            case 'viewFriends':
                viewFriends();
                break;
            case 'searchUsers':
                searchUsers();
                break;
            case 'editProfileImage':
                editProfileImage();
                break;
            case 'editCoverImage':
                editCoverImage();
                break;
            case 'resetImageUpload':
                resetImageUpload();
                break;
            case 'uploadImage':
                uploadImage();
                break;
            case 'closeModal':
                const modalId = e.target.dataset.modal;
                if (modalId) {
                    closeModal(modalId);
                }
                break;
        }
    });
    
    // مستمع للبحث المباشر
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', searchUsersRealTime);
    }
}

// تبديل التبويبات
function switchTab(tabName) {
    // إزالة الفئة النشطة من جميع التبويبات
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إخفاء جميع الأقسام
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // تفعيل التبويب المحدد
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.getElementById(tabName);
    
    if (activeTab && activePanel) {
        activeTab.classList.add('active');
        activePanel.classList.add('active');
        
        // تحميل البيانات حسب التبويب
        switch(tabName) {
            case 'friends':
                loadFriends();
                break;
            case 'achievements':
                loadAchievements();
                break;
            case 'stats':
                loadDetailedStats();
                break;
        }
    }
}

// تبديل تبويبات الأصدقاء
function switchFriendTab(tabName) {
    // إزالة الفئة النشطة من جميع التبويبات
    document.querySelectorAll('.friend-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إخفاء جميع الأقسام
    document.querySelectorAll('.friend-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // تفعيل التبويب المحدد
    const activeTab = document.querySelector(`[data-friend-tab="${tabName}"]`);
    const activePanel = document.getElementById(tabName === 'friends' ? 'friends-list' : 
                                             tabName === 'requests' ? 'friend-requests' : 'blocked-users');
    
    if (activeTab && activePanel) {
        activeTab.classList.add('active');
        activePanel.classList.add('active');
        
        // تحميل البيانات حسب التبويب
        switch(tabName) {
            case 'friends':
                loadFriendsList();
                break;
            case 'requests':
                loadFriendRequests();
                break;
            case 'blocked':
                loadBlockedUsers();
                break;
        }
    }
}

// تحميل بروفايل المستخدم
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateProfileDisplay();
            loadUserStats();
        } else {
            throw new Error('فشل في تحميل بيانات المستخدم');
        }
    } catch (error) {
        console.error('خطأ في تحميل البروفايل:', error);
        showMessage('خطأ في تحميل بيانات البروفايل', true);
    }
}

// تحديث عرض البروفايل
function updateProfileDisplay() {
    if (!currentUser) return;
    
    // معلومات البروفايل الأساسية
    document.getElementById('display-name').textContent = currentUser.profile?.displayName || currentUser.username;
    document.getElementById('user-bio').textContent = currentUser.profile?.bio || 'مرحباً! أنا لاعب في VoiceBoom 🎮';
    document.getElementById('user-level').textContent = currentUser.profile?.level || 1;
    
    // الصورة الشخصية
    const avatarImg = document.getElementById('user-avatar');
    if (currentUser.profile?.profileImage) {
        avatarImg.src = currentUser.profile.profileImage;
    } else if (currentUser.profile?.avatar && currentUser.profile.avatar !== 'default-avatar.png') {
        avatarImg.src = currentUser.profile.avatar;
    }
    
    // صورة الغلاف
    const coverImg = document.getElementById('cover-image');
    if (currentUser.profile?.coverImage) {
        coverImg.src = currentUser.profile.coverImage;
    }
    
    // معلومات إضافية
    updateProfileDetails();
    
    // حالة الاتصال
    const onlineStatus = document.getElementById('online-status');
    if (onlineStatus) {
        onlineStatus.className = `online-status ${currentUser.profile?.status || 'offline'}`;
    }
    
    // الإحصائيات الأساسية
    document.getElementById('friends-count').textContent = currentUser.relationships?.friends?.filter(f => f.status === 'accepted').length || 0;
    document.getElementById('games-played').textContent = currentUser.stats?.gamesPlayed || 0;
    
    // تحديث معلومات النظرة العامة
    updateOverviewInfo();
}

// تحديث تفاصيل البروفايل
function updateProfileDetails() {
    const ageElement = document.getElementById('user-age');
    const countryElement = document.getElementById('user-country');
    const genderElement = document.getElementById('user-gender');
    
    if (currentUser.profile?.age) {
        ageElement.textContent = `${currentUser.profile.age} سنة`;
        ageElement.style.display = 'inline';
    } else {
        ageElement.style.display = 'none';
    }
    
    if (currentUser.profile?.country) {
        countryElement.textContent = currentUser.profile.country;
        countryElement.style.display = 'inline';
    } else {
        countryElement.style.display = 'none';
    }
    
    if (currentUser.profile?.gender && currentUser.profile.gender !== 'prefer-not-to-say') {
        const genderText = {
            'male': 'ذكر',
            'female': 'أنثى',
            'other': 'آخر'
        };
        genderElement.textContent = genderText[currentUser.profile.gender];
        genderElement.style.display = 'inline';
    } else {
        genderElement.style.display = 'none';
    }
}

// تحديث معلومات النظرة العامة
function updateOverviewInfo() {
    if (!currentUser) return;
    
    // معلومات شخصية
    document.getElementById('overview-display-name').textContent = currentUser.profile?.displayName || currentUser.username;
    document.getElementById('overview-age').textContent = currentUser.profile?.age ? `${currentUser.profile.age} سنة` : '-';
    document.getElementById('overview-gender').textContent = currentUser.profile?.gender && currentUser.profile.gender !== 'prefer-not-to-say' ? 
        (currentUser.profile.gender === 'male' ? 'ذكر' : currentUser.profile.gender === 'female' ? 'أنثى' : 'آخر') : '-';
    document.getElementById('overview-country').textContent = currentUser.profile?.country || '-';
    document.getElementById('overview-timezone').textContent = currentUser.profile?.timezone || '-';
    document.getElementById('overview-join-date').textContent = currentUser.profile?.joinDate ? formatDate(currentUser.profile.joinDate) : '-';
    
    // الاهتمامات
    updateInterestsDisplay();
    
    // الألعاب المفضلة
    updateGamesDisplay();
    
    // روابط التواصل الاجتماعي
    updateSocialLinksDisplay();
}

// تحديث عرض الاهتمامات
function updateInterestsDisplay() {
    const interestsSection = document.getElementById('interests-section');
    const interestsTags = document.getElementById('interests-tags');
    
    if (currentUser.profile?.interests && currentUser.profile.interests.length > 0) {
        interestsTags.innerHTML = currentUser.profile.interests.map(interest => 
            `<span class="interest-tag">${interest.trim()}</span>`
        ).join('');
        interestsSection.style.display = 'block';
    } else {
        interestsSection.style.display = 'none';
    }
}

// تحديث عرض الألعاب المفضلة
function updateGamesDisplay() {
    const gamesSection = document.getElementById('games-section');
    const gamesTags = document.getElementById('games-tags');
    
    if (currentUser.profile?.favoriteGames && currentUser.profile.favoriteGames.length > 0) {
        gamesTags.innerHTML = currentUser.profile.favoriteGames.map(game => 
            `<span class="game-tag">${game.trim()}</span>`
        ).join('');
        gamesSection.style.display = 'block';
    } else {
        gamesSection.style.display = 'none';
    }
}

// تحديث عرض روابط التواصل الاجتماعي
function updateSocialLinksDisplay() {
    const socialLinksSection = document.getElementById('social-links');
    const socialIcons = document.getElementById('social-icons');
    
    if (currentUser.profile?.socialLinks) {
        const links = [];
        const socialLinks = currentUser.profile.socialLinks;
        
        if (socialLinks.discord) {
            links.push(`<a href="https://discord.com/users/${socialLinks.discord}" target="_blank" class="social-icon discord">📱 Discord</a>`);
        }
        if (socialLinks.twitter) {
            links.push(`<a href="https://twitter.com/${socialLinks.twitter}" target="_blank" class="social-icon twitter">🐦 Twitter</a>`);
        }
        if (socialLinks.instagram) {
            links.push(`<a href="https://instagram.com/${socialLinks.instagram}" target="_blank" class="social-icon instagram">📸 Instagram</a>`);
        }
        if (socialLinks.youtube) {
            links.push(`<a href="${socialLinks.youtube}" target="_blank" class="social-icon youtube">📺 YouTube</a>`);
        }
        
        if (links.length > 0) {
            socialIcons.innerHTML = links.join('');
            socialLinksSection.style.display = 'block';
        } else {
            socialLinksSection.style.display = 'none';
        }
    } else {
        socialLinksSection.style.display = 'none';
    }
}

// تحميل إحصائيات المستخدم
async function loadUserStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// تحديث عرض الإحصائيات
function updateStatsDisplay(stats) {
    // إحصائيات اللعب
    document.getElementById('total-score').textContent = stats.stats?.score || 0;
    document.getElementById('high-score').textContent = stats.stats?.highScore || 0;
    document.getElementById('win-rate').textContent = `${stats.stats?.winRate || 0}%`;
    document.getElementById('avg-score').textContent = stats.stats?.averageScore || 0;
    
    // إحصائيات الأسلحة
    document.getElementById('single-shots').textContent = stats.weapons?.singleShotsUsed || 0;
    document.getElementById('triple-shots').textContent = stats.weapons?.tripleShotsUsed || 0;
    document.getElementById('hammer-shots').textContent = stats.weapons?.hammerShotsUsed || 0;
    document.getElementById('accuracy').textContent = `${stats.weapons?.accuracy || 0}%`;
    
    // العناصر المجمعة
    document.getElementById('gems-count').textContent = stats.itemsCollected?.gems || 0;
    document.getElementById('keys-count').textContent = stats.itemsCollected?.keys || 0;
    document.getElementById('coins-count').textContent = stats.itemsCollected?.coins || 0;
    document.getElementById('bats-hit').textContent = stats.batsHit || 0;
    
    // الإحصائيات المفصلة
    document.getElementById('detailed-score').textContent = stats.stats?.score || 0;
    document.getElementById('detailed-pearls').textContent = stats.stats?.pearls || 0;
    document.getElementById('detailed-boxes').textContent = stats.stats?.boxesOpened || 0;
    document.getElementById('detailed-games').textContent = stats.stats?.gamesPlayed || 0;
    document.getElementById('detailed-wins').textContent = stats.stats?.gamesWon || 0;
    document.getElementById('detailed-playtime').textContent = `${stats.stats?.totalPlayTime || 0} دقيقة`;
}

// تحميل الأصدقاء
async function loadFriends() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/friends`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            friends = await response.json();
            updateFriendsCount();
        }
    } catch (error) {
        console.error('خطأ في تحميل الأصدقاء:', error);
    }
}

// تحميل قائمة الأصدقاء
function loadFriendsList() {
    const friendsGrid = document.getElementById('friends-grid');
    if (!friendsGrid) return;
    
    if (friends.length === 0) {
        friendsGrid.innerHTML = '<p class="no-data">لا توجد أصدقاء حالياً</p>';
        return;
    }
    
    friendsGrid.innerHTML = friends.map(friend => `
        <div class="friend-card">
            <img src="${friend.avatar || 'images/default-avatar.png'}" alt="${friend.username}" class="friend-avatar">
            <div class="friend-name">${friend.displayName || friend.username}</div>
            <div class="friend-status">المستوى ${friend.level}</div>
            <div class="friend-actions">
                <button class="friend-btn primary" onclick="viewFriendProfile('${friend.username}')">عرض البروفايل</button>
                <button class="friend-btn secondary" onclick="removeFriend('${friend.id}')">إزالة</button>
            </div>
        </div>
    `).join('');
}

// تحميل طلبات الصداقة
async function loadFriendRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/friend-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            friendRequests = await response.json();
            updateFriendRequestsDisplay();
        }
    } catch (error) {
        console.error('خطأ في تحميل طلبات الصداقة:', error);
    }
}

// تحديث عرض طلبات الصداقة
function updateFriendRequestsDisplay() {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    if (friendRequests.length === 0) {
        requestsList.innerHTML = '<p class="no-data">لا توجد طلبات صداقة جديدة</p>';
        return;
    }
    
    requestsList.innerHTML = friendRequests.map(request => `
        <div class="friend-card">
            <img src="${request.avatar || 'images/default-avatar.png'}" alt="${request.username}" class="friend-avatar">
            <div class="friend-name">${request.displayName || request.username}</div>
            <div class="friend-status">${request.message || 'يريد إضافتك كصديق'}</div>
            <div class="friend-actions">
                <button class="friend-btn primary" onclick="acceptFriendRequest('${request.id}')">قبول</button>
                <button class="friend-btn secondary" onclick="rejectFriendRequest('${request.id}')">رفض</button>
            </div>
        </div>
    `).join('');
}

// تحميل المستخدمين المحظورين
async function loadBlockedUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/blocked-users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            blockedUsers = await response.json();
            updateBlockedUsersDisplay();
        }
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين المحظورين:', error);
    }
}

// تحديث عرض المستخدمين المحظورين
function updateBlockedUsersDisplay() {
    const blockedList = document.getElementById('blocked-list');
    if (!blockedList) return;
    
    if (blockedUsers.length === 0) {
        blockedList.innerHTML = '<p class="no-data">لا توجد مستخدمين محظورين</p>';
        return;
    }
    
    blockedList.innerHTML = blockedUsers.map(user => `
        <div class="friend-card">
            <img src="${user.avatar || 'images/default-avatar.png'}" alt="${user.username}" class="friend-avatar">
            <div class="friend-name">${user.displayName || user.username}</div>
            <div class="friend-status">محظور منذ ${formatDate(user.blockedAt)}</div>
            <div class="friend-actions">
                <button class="friend-btn primary" onclick="unblockUser('${user.id}')">إلغاء الحظر</button>
            </div>
        </div>
    `).join('');
}

// تحميل الإنجازات
async function loadAchievements() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            achievements = stats.achievements || [];
            updateAchievementsDisplay();
        }
    } catch (error) {
        console.error('خطأ في تحميل الإنجازات:', error);
    }
}

// تحديث عرض الإنجازات
function updateAchievementsDisplay() {
    const achievementsGrid = document.getElementById('achievements-grid');
    const unlockedCount = document.getElementById('achievements-unlocked');
    const totalCount = document.getElementById('achievements-total');
    
    if (!achievementsGrid) return;
    
    // إنجازات افتراضية
    const defaultAchievements = [
        { id: 'first-game', name: 'اللعبة الأولى', description: 'اكمل لعبتك الأولى', icon: '🎮', unlocked: true },
        { id: 'score-100', name: 'مائة نقطة', description: 'احصل على 100 نقطة', icon: '💯', unlocked: false },
        { id: 'score-500', name: 'خمسمائة نقطة', description: 'احصل على 500 نقطة', icon: '🏆', unlocked: false },
        { id: 'friend-1', name: 'صديق أول', description: 'أضف صديقك الأول', icon: '👥', unlocked: false },
        { id: 'games-10', name: 'لاعب نشط', description: 'العب 10 ألعاب', icon: '🎯', unlocked: false },
        { id: 'accuracy-80', name: 'دقة عالية', description: 'احصل على دقة 80%', icon: '🎯', unlocked: false }
    ];
    
    const allAchievements = [...defaultAchievements, ...achievements];
    const unlocked = allAchievements.filter(a => a.unlocked).length;
    
    if (unlockedCount) unlockedCount.textContent = unlocked;
    if (totalCount) totalCount.textContent = allAchievements.length;
    
    achievementsGrid.innerHTML = allAchievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
            <div class="achievement-progress-bar">
                <div class="achievement-progress-fill" style="width: ${achievement.unlocked ? 100 : 0}%"></div>
            </div>
        </div>
    `).join('');
}

// تحميل الإحصائيات المفصلة
function loadDetailedStats() {
    // البيانات محملة مسبقاً في loadUserStats
    console.log('تم تحميل الإحصائيات المفصلة');
}

// إعداد إعدادات الخصوصية
function setupPrivacySettings() {
    const settings = ['show-profile', 'show-stats', 'allow-friend-requests', 'allow-messages'];
    
    settings.forEach(setting => {
        const checkbox = document.getElementById(setting);
        if (checkbox) {
            checkbox.addEventListener('change', updatePrivacySettings);
        }
    });
}

// تحديث إعدادات الخصوصية
async function updatePrivacySettings() {
    try {
        const token = localStorage.getItem('token');
        const settings = {
            showProfile: document.getElementById('show-profile')?.checked,
            showStats: document.getElementById('show-stats')?.checked,
            allowFriendRequests: document.getElementById('allow-friend-requests')?.checked,
            allowMessages: document.getElementById('allow-messages')?.checked
        };
        
        const response = await fetch(`${BACKEND_URL}/api/users/privacy-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showMessage('تم تحديث إعدادات الخصوصية بنجاح');
        } else {
            throw new Error('فشل في تحديث الإعدادات');
        }
    } catch (error) {
        console.error('خطأ في تحديث إعدادات الخصوصية:', error);
        showMessage('خطأ في تحديث الإعدادات', true);
    }
}

// إعداد إعدادات الإشعارات
function setupNotificationSettings() {
    const settings = ['notify-friend-requests', 'notify-messages', 'notify-game-invites', 'notify-achievements'];
    
    settings.forEach(setting => {
        const checkbox = document.getElementById(setting);
        if (checkbox) {
            checkbox.addEventListener('change', updateNotificationSettings);
        }
    });
}

// تحديث إعدادات الإشعارات
async function updateNotificationSettings() {
    // يمكن إضافة منطق تحديث إعدادات الإشعارات هنا
    console.log('تم تحديث إعدادات الإشعارات');
}

// إعداد إعدادات اللعبة
function setupGameSettings() {
    const settings = ['sound-enabled', 'music-enabled'];
    
    settings.forEach(setting => {
        const checkbox = document.getElementById(setting);
        if (checkbox) {
            checkbox.addEventListener('change', updateGameSettings);
        }
    });
}

// تحديث إعدادات اللعبة
async function updateGameSettings() {
    // يمكن إضافة منطق تحديث إعدادات اللعبة هنا
    console.log('تم تحديث إعدادات اللعبة');
}

// عداد الأحرف للسيرة الذاتية
function updateCharCount() {
    const textarea = document.getElementById('edit-bio');
    const charCount = document.querySelector('.char-count');
    if (textarea && charCount) {
        const count = textarea.value.length;
        charCount.textContent = `${count}/500`;
        charCount.style.color = count > 450 ? '#dc3545' : '#6c757d';
    }
}

// إعداد رفع الصور
function setupImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    
    if (uploadArea && imageInput) {
        // النقر على منطقة الرفع
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        // اختيار ملف
        imageInput.addEventListener('change', handleImageSelect);
        
        // السحب والإفلات
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImageFile(files[0]);
            }
        });
    }
}

// معالجة اختيار الصورة
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

// معالجة ملف الصورة
function handleImageFile(file) {
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        showMessage('يرجى اختيار ملف صورة صحيح', true);
        return;
    }
    
    // التحقق من حجم الملف (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('حجم الصورة يجب أن يكون أقل من 5MB', true);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// عرض معاينة الصورة
function showImagePreview(imageData) {
    const uploadArea = document.getElementById('upload-area');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    
    if (uploadArea && imagePreview && previewImage) {
        previewImage.src = imageData;
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
    }
}

// إعادة تعيين رفع الصورة
function resetImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    const imagePreview = document.getElementById('image-preview');
    const imageInput = document.getElementById('image-input');
    
    if (uploadArea && imagePreview && imageInput) {
        uploadArea.style.display = 'block';
        imagePreview.style.display = 'none';
        imageInput.value = '';
    }
}

// رفع الصورة
async function uploadImage() {
    const previewImage = document.getElementById('preview-image');
    const uploadImageTitle = document.getElementById('upload-image-title');
    
    if (!previewImage || !previewImage.src) {
        showMessage('لا توجد صورة للرفع', true);
        return;
    }
    
    try {
        const imageType = uploadImageTitle.textContent.includes('الشخصية') ? 'profileImage' : 'coverImage';
        const imageData = previewImage.src.split(',')[1]; // إزالة data:image/jpeg;base64,
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/upload-profile-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                imageData,
                imageType
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(result.message);
            
            // تحديث العرض
            if (imageType === 'profileImage') {
                document.getElementById('user-avatar').src = result.imageUrl;
            } else {
                document.getElementById('cover-image').src = result.imageUrl;
            }
            
            // إعادة تحميل بيانات المستخدم
            await loadUserProfile();
            
            // إغلاق النافذة
            closeModal('upload-image-modal');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'خطأ في رفع الصورة');
        }
    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        showMessage(error.message || 'خطأ في رفع الصورة', true);
    }
}

// تعديل الصورة الشخصية
function editProfileImage() {
    const uploadImageTitle = document.getElementById('upload-image-title');
    if (uploadImageTitle) {
        uploadImageTitle.textContent = 'تعديل الصورة الشخصية';
    }
    openModal('upload-image-modal');
    resetImageUpload();
}

// تعديل صورة الغلاف
function editCoverImage() {
    const uploadImageTitle = document.getElementById('upload-image-title');
    if (uploadImageTitle) {
        uploadImageTitle.textContent = 'تعديل صورة الغلاف';
    }
    openModal('upload-image-modal');
    resetImageUpload();
}

// تحديث دالة تعديل البروفايل
function editProfile() {
    if (!currentUser) return;
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('edit-display-name').value = currentUser.profile?.displayName || currentUser.username;
    document.getElementById('edit-bio').value = currentUser.profile?.bio || '';
    document.getElementById('edit-age').value = currentUser.profile?.age || '';
    document.getElementById('edit-gender').value = currentUser.profile?.gender || 'prefer-not-to-say';
    document.getElementById('edit-country').value = currentUser.profile?.country || '';
    document.getElementById('edit-timezone').value = currentUser.profile?.timezone || '';
    
    // الاهتمامات
    document.getElementById('edit-interests').value = currentUser.profile?.interests?.join(', ') || '';
    
    // الألعاب المفضلة
    document.getElementById('edit-favorite-games').value = currentUser.profile?.favoriteGames?.join(', ') || '';
    
    // روابط التواصل الاجتماعي
    if (currentUser.profile?.socialLinks) {
        document.getElementById('edit-discord').value = currentUser.profile.socialLinks.discord || '';
        document.getElementById('edit-twitter').value = currentUser.profile.socialLinks.twitter || '';
        document.getElementById('edit-instagram').value = currentUser.profile.socialLinks.instagram || '';
        document.getElementById('edit-youtube').value = currentUser.profile.socialLinks.youtube || '';
    }
    
    // إعدادات البحث والخصوصية
    document.getElementById('edit-searchable').checked = currentUser.profile?.searchable !== false;
    document.getElementById('edit-show-in-search').checked = currentUser.profile?.showInSearch !== false;
    document.getElementById('edit-allow-friend-requests').checked = currentUser.profile?.allowFriendRequests !== false;
    document.getElementById('edit-allow-messages').checked = currentUser.profile?.allowMessages !== false;
    
    // تحديث عداد الأحرف
    updateCharCount();
    
    openModal('edit-profile-modal');
}

// تحديث معالج تعديل البروفايل
async function handleEditProfile(event) {
    event.preventDefault();
    
    try {
        const formData = {
            displayName: document.getElementById('edit-display-name').value.trim(),
            bio: document.getElementById('edit-bio').value.trim(),
            age: parseInt(document.getElementById('edit-age').value) || null,
            gender: document.getElementById('edit-gender').value,
            country: document.getElementById('edit-country').value.trim(),
            timezone: document.getElementById('edit-timezone').value.trim(),
            interests: document.getElementById('edit-interests').value.split(',').map(i => i.trim()).filter(i => i),
            favoriteGames: document.getElementById('edit-favorite-games').value.split(',').map(g => g.trim()).filter(g => g),
            socialLinks: {
                discord: document.getElementById('edit-discord').value.trim(),
                twitter: document.getElementById('edit-twitter').value.trim(),
                instagram: document.getElementById('edit-instagram').value.trim(),
                youtube: document.getElementById('edit-youtube').value.trim()
            },
            searchable: document.getElementById('edit-searchable').checked,
            showInSearch: document.getElementById('edit-show-in-search').checked,
            allowFriendRequests: document.getElementById('edit-allow-friend-requests').checked,
            allowMessages: document.getElementById('edit-allow-messages').checked
        };
        
        const token = localStorage.getItem('token');
        
        // تحديث المعلومات الأساسية
        const response1 = await fetch(`${BACKEND_URL}/api/users/update-profile-info`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        // تحديث السيرة الذاتية
        const response2 = await fetch(`${BACKEND_URL}/api/users/update-bio`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bio: formData.bio })
        });
        
        // تحديث إعدادات البحث
        const response3 = await fetch(`${BACKEND_URL}/api/users/update-search-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                searchable: formData.searchable,
                showInSearch: formData.showInSearch,
                allowFriendRequests: formData.allowFriendRequests,
                allowMessages: formData.allowMessages
            })
        });
        
        if (response1.ok && response2.ok && response3.ok) {
            showMessage('تم تحديث البروفايل بنجاح');
            closeModal('edit-profile-modal');
            
            // إعادة تحميل بيانات المستخدم
            await loadUserProfile();
        } else {
            throw new Error('فشل في تحديث البروفايل');
        }
    } catch (error) {
        console.error('خطأ في تحديث البروفايل:', error);
        showMessage('خطأ في تحديث البروفايل', true);
    }
}

// تحديث دالة البحث عن المستخدمين
async function searchUsersRealTime() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '<p class="search-placeholder">اكتب حرفين على الأقل للبحث</p>';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            displaySearchResults(data.users);
        } else {
            throw new Error('فشل في البحث');
        }
    } catch (error) {
        console.error('خطأ في البحث:', error);
        searchResults.innerHTML = '<p class="search-error">خطأ في البحث عن المستخدمين</p>';
    }
}

// تحديث عرض نتائج البحث
function displaySearchResults(users) {
    const searchResults = document.getElementById('search-results');
    
    if (!users || users.length === 0) {
        searchResults.innerHTML = '<p class="search-placeholder">لا توجد نتائج</p>';
        return;
    }
    
    const resultsHTML = users.map(user => {
        let actionButton = '';
        let buttonClass = '';
        let buttonText = '';
        
        if (user.isBlocked) {
            buttonClass = 'blocked';
            buttonText = 'محظور';
        } else if (user.isFriend) {
            buttonClass = 'friend';
            buttonText = 'صديق';
        } else if (user.hasPendingRequest) {
            buttonClass = 'pending';
            buttonText = 'طلب مرسل';
        } else if (user.hasSentRequest) {
            buttonClass = 'pending';
            buttonText = 'طلب مستلم';
        } else {
            buttonClass = 'add';
            buttonText = 'إضافة صديق';
        }
        
        actionButton = `<button class="btn-friend ${buttonClass}" onclick="handleFriendAction('${user._id}', '${user.username}', '${buttonClass}')">${buttonText}</button>`;
        
        return `
            <div class="user-result">
                <img src="${user.avatar || 'images/default-avatar.png'}" alt="${user.displayName}" class="user-result-avatar">
                <div class="user-result-info">
                    <div class="user-result-name">${user.displayName}</div>
                    <div class="user-result-bio">${user.bio || 'لا توجد نبذة شخصية'}</div>
                    <div class="user-result-stats">
                        <span>المستوى: ${user.level}</span>
                        <span>الحالة: ${user.status === 'online' ? 'متصل' : 'غير متصل'}</span>
                    </div>
                </div>
                <div class="user-result-actions">
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = resultsHTML;
}

// معالجة إجراءات الأصدقاء
async function handleFriendAction(userId, username, action) {
    try {
        const token = localStorage.getItem('token');
        
        switch (action) {
            case 'add':
                await sendFriendRequest(username);
                break;
            case 'pending':
                showMessage('تم إرسال طلب صداقة مسبقاً');
                break;
            case 'friend':
                showMessage('أنتما أصدقاء بالفعل');
                break;
            case 'blocked':
                showMessage('هذا المستخدم محظور');
                break;
        }
        
        // إعادة البحث لتحديث الأزرار
        await searchUsersRealTime();
    } catch (error) {
        console.error('خطأ في معالجة إجراء الصداقة:', error);
        showMessage('خطأ في معالجة الطلب', true);
    }
}

// فتح نافذة منبثقة
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// إغلاق نافذة منبثقة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// عرض رسالة
function showMessage(message, isError = false) {
    // يمكن إضافة منطق عرض الرسائل هنا
    console.log(isError ? '❌' : '✅', message);
    
    // إنشاء عنصر رسالة مؤقت
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isError ? 'error' : 'success'}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        background: ${isError ? 'var(--error-color)' : 'var(--success-color)'};
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// العودة للصفحة السابقة
function goBack() {
    window.history.back();
}

// فتح الإعدادات
function openSettings() {
    switchTab('settings');
}

// عرض الإحصائيات
function viewStats() {
    switchTab('stats');
}

// عرض الأصدقاء
function viewFriends() {
    switchTab('friends');
} 