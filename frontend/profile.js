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
    
    // إعدادات الخصوصية
    setupPrivacySettings();
    
    // إعدادات الإشعارات
    setupNotificationSettings();
    
    // إعدادات اللعبة
    setupGameSettings();
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
    if (currentUser.profile?.avatar && currentUser.profile.avatar !== 'default-avatar.png') {
        avatarImg.src = currentUser.profile.avatar;
    }
    
    // حالة الاتصال
    const onlineStatus = document.getElementById('online-status');
    if (onlineStatus) {
        onlineStatus.className = `online-status ${currentUser.profile?.status || 'offline'}`;
    }
    
    // الإحصائيات الأساسية
    document.getElementById('friends-count').textContent = currentUser.relationships?.friends?.filter(f => f.status === 'accepted').length || 0;
    document.getElementById('games-played').textContent = currentUser.stats?.gamesPlayed || 0;
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

// فتح نافذة تعديل البروفايل
function editProfile() {
    if (!currentUser) return;
    
    document.getElementById('edit-display-name').value = currentUser.profile?.displayName || currentUser.username;
    document.getElementById('edit-bio').value = currentUser.profile?.bio || '';
    document.getElementById('edit-country').value = currentUser.profile?.country || '';
    document.getElementById('edit-timezone').value = currentUser.profile?.timezone || '';
    
    openModal('edit-profile-modal');
}

// معالجة تعديل البروفايل
async function handleEditProfile(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const formData = {
            displayName: document.getElementById('edit-display-name').value,
            bio: document.getElementById('edit-bio').value,
            country: document.getElementById('edit-country').value,
            timezone: document.getElementById('edit-timezone').value
        };
        
        const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            currentUser.profile = result.profile;
            updateProfileDisplay();
            closeModal('edit-profile-modal');
            showMessage('تم تحديث البروفايل بنجاح');
        } else {
            throw new Error('فشل في تحديث البروفايل');
        }
    } catch (error) {
        console.error('خطأ في تحديث البروفايل:', error);
        showMessage('خطأ في تحديث البروفايل', true);
    }
}

// البحث عن مستخدمين
function searchUsers() {
    openModal('search-users-modal');
}

// البحث الفوري
async function searchUsersRealTime() {
    const query = document.getElementById('search-input').value;
    const resultsContainer = document.getElementById('search-results');
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}&limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const users = await response.json();
            displaySearchResults(users);
        }
    } catch (error) {
        console.error('خطأ في البحث:', error);
    }
}

// عرض نتائج البحث
function displaySearchResults(users) {
    const resultsContainer = document.getElementById('search-results');
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<p class="no-data">لا توجد نتائج</p>';
        return;
    }
    
    resultsContainer.innerHTML = users.map(user => `
        <div class="search-result-item">
            <img src="${user.profile?.avatar || 'images/default-avatar.png'}" alt="${user.username}" class="search-result-avatar">
            <div class="search-result-info">
                <div class="search-result-name">${user.profile?.displayName || user.username}</div>
                <div class="search-result-status">المستوى ${user.profile?.level || 1}</div>
            </div>
            <button class="friend-btn primary" onclick="sendFriendRequest('${user.username}')">إرسال طلب صداقة</button>
        </div>
    `).join('');
}

// إرسال طلب صداقة
async function sendFriendRequest(username) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/friend-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username })
        });
        
        if (response.ok) {
            showMessage('تم إرسال طلب الصداقة بنجاح');
            closeModal('search-users-modal');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'فشل في إرسال طلب الصداقة');
        }
    } catch (error) {
        console.error('خطأ في إرسال طلب الصداقة:', error);
        showMessage(error.message, true);
    }
}

// قبول طلب صداقة
async function acceptFriendRequest(fromUserId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/friend-request/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fromUserId })
        });
        
        if (response.ok) {
            showMessage('تم قبول طلب الصداقة بنجاح');
            loadFriendRequests();
            loadFriends();
        } else {
            throw new Error('فشل في قبول طلب الصداقة');
        }
    } catch (error) {
        console.error('خطأ في قبول طلب الصداقة:', error);
        showMessage('خطأ في قبول طلب الصداقة', true);
    }
}

// رفض طلب صداقة
async function rejectFriendRequest(fromUserId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/friend-request/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fromUserId })
        });
        
        if (response.ok) {
            showMessage('تم رفض طلب الصداقة');
            loadFriendRequests();
        } else {
            throw new Error('فشل في رفض طلب الصداقة');
        }
    } catch (error) {
        console.error('خطأ في رفض طلب الصداقة:', error);
        showMessage('خطأ في رفض طلب الصداقة', true);
    }
}

// إزالة صديق
async function removeFriend(friendId) {
    if (!confirm('هل أنت متأكد من إزالة هذا الصديق؟')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/friend/${friendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showMessage('تم إزالة الصديق بنجاح');
            loadFriends();
        } else {
            throw new Error('فشل في إزالة الصديق');
        }
    } catch (error) {
        console.error('خطأ في إزالة الصديق:', error);
        showMessage('خطأ في إزالة الصديق', true);
    }
}

// إلغاء حظر مستخدم
async function unblockUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/users/block/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showMessage('تم إلغاء حظر المستخدم بنجاح');
            loadBlockedUsers();
        } else {
            throw new Error('فشل في إلغاء حظر المستخدم');
        }
    } catch (error) {
        console.error('خطأ في إلغاء حظر المستخدم:', error);
        showMessage('خطأ في إلغاء حظر المستخدم', true);
    }
}

// عرض بروفايل صديق
function viewFriendProfile(username) {
    // يمكن إضافة منطق عرض بروفايل الصديق هنا
    console.log('عرض بروفايل:', username);
}

// تحديث عدد الأصدقاء
function updateFriendsCount() {
    const friendsCount = document.getElementById('friends-count');
    if (friendsCount) {
        friendsCount.textContent = friends.length;
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