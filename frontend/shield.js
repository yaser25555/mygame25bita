// استخدام ملف التكوين المركزي
const BACKEND_URL = CONFIG.BACKEND_URL;

// متغيرات عامة
let currentUser = null;
let shieldData = null;
let shieldHistory = [];
let currentTab = 'status';

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛡️ تحميل صفحة الدرع...');
    
    // التحقق من تسجيل الدخول
    checkAuth();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // تحميل بيانات المستخدم والدرع
    loadUserData();
    
    // إضافة تحذير الخروج
    setupExitWarning();
    
    console.log('✅ تم تحميل صفحة الدرع بنجاح');
});

// التحقق من تسجيل الدخول
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('يجب تسجيل الدخول أولاً', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // التبويبات
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // أزرار تفعيل الدرع
    document.querySelectorAll('.activate-shield-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const shieldType = btn.dataset.type;
            openActivationModal(shieldType);
        });
    });
    
    // إغلاق Modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeActivationModal);
    }
    
    // إغلاق Modal عند النقر خارجه
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('activation-modal');
        if (event.target === modal) {
            closeActivationModal();
        }
    });
    
    // مرشحات السجل
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterHistory(btn.dataset.filter);
        });
    });
}

// تبديل التبويبات
function switchTab(tabName) {
    // إزالة الفئة النشطة من جميع التبويبات
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // تفعيل التبويب المحدد
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeTab && activeContent) {
        activeTab.classList.add('active');
        activeContent.classList.add('active');
        currentTab = tabName;
        
        // تحميل البيانات حسب التبويب
        switch(tabName) {
            case 'status':
                loadShieldStatus();
                break;
            case 'history':
                loadShieldHistory();
                break;
            case 'settings':
                loadShieldSettings();
                break;
        }
    }
}

// تحميل بيانات المستخدم
async function loadUserData() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب بيانات المستخدم');
        }

        currentUser = await response.json();
        updateUserCoins();
        loadShieldStatus();
        
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        showNotification('خطأ في تحميل بيانات المستخدم', 'error');
    }
}

// تحديث عرض العملات
function updateUserCoins() {
    const coinsDisplay = document.getElementById('user-coins');
    if (coinsDisplay && currentUser) {
        coinsDisplay.innerHTML = `
            <div class="coins-amount">${currentUser.score?.toLocaleString() || 0}</div>
            <div class="coins-label">عملة</div>
        `;
    }
}

// تحميل حالة الدرع
async function loadShieldStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/shield/status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب حالة الدرع');
        }

        shieldData = await response.json();
        updateShieldStatusDisplay();
        updateShieldStats();
        
    } catch (error) {
        console.error('خطأ في تحميل حالة الدرع:', error);
        showNotification('خطأ في تحميل حالة الدرع', 'error');
    }
}

// تحديث عرض حالة الدرع
function updateShieldStatusDisplay() {
    const statusCard = document.getElementById('shield-status-card');
    if (!statusCard) return;

    if (!shieldData || !shieldData.isActive) {
        statusCard.innerHTML = `
            <div class="shield-inactive">
                <div class="shield-icon-large">🛡️</div>
                <h3>لا يوجد درع نشط</h3>
                <p>أنت غير محمي حالياً من الهدايا السلبية</p>
                <button class="btn btn-primary" onclick="switchTab('activate')">
                    تفعيل درع الآن
                </button>
            </div>
        `;
    } else {
        const remainingTime = calculateRemainingTime(shieldData.expiresAt);
        statusCard.innerHTML = `
            <div class="shield-active">
                <div class="shield-icon-large">🛡️</div>
                <h3>الدرع نشط</h3>
                <div class="shield-info">
                    <p><strong>النوع:</strong> ${getShieldTypeName(shieldData.type)}</p>
                    <p><strong>الوقت المتبقي:</strong> ${remainingTime}</p>
                    <p><strong>تاريخ الانتهاء:</strong> ${formatDate(shieldData.expiresAt)}</p>
                </div>
                <button class="btn btn-secondary" onclick="deactivateShield()">
                    إلغاء الدرع
                </button>
            </div>
        `;
    }
}

// تحديث إحصائيات الدرع
function updateShieldStats() {
    const statsGrid = document.getElementById('shield-stats');
    if (!statsGrid) return;

    const stats = shieldData?.stats || {
        totalActivations: 0,
        totalCost: 0,
        totalDuration: 0,
        currentStreak: 0
    };

    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stats.totalActivations}</div>
            <div class="stat-label">إجمالي التفعيلات</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.totalCost?.toLocaleString() || 0}</div>
            <div class="stat-label">إجمالي التكلفة</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.totalDuration || 0}</div>
            <div class="stat-label">إجمالي المدة (ساعة)</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.currentStreak || 0}</div>
            <div class="stat-label">التفعيلات المتتالية</div>
        </div>
    `;
}

// تحميل سجل الدرع
async function loadShieldHistory() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/shield/history`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب سجل الدرع');
        }

        const data = await response.json();
        shieldHistory = data.history || [];
        updateHistoryDisplay();
        
    } catch (error) {
        console.error('خطأ في تحميل سجل الدرع:', error);
        showNotification('خطأ في تحميل سجل الدرع', 'error');
    }
}

// تحديث عرض السجل
function updateHistoryDisplay() {
    const historyList = document.getElementById('shield-history-list');
    if (!historyList) return;

    if (shieldHistory.length === 0) {
        historyList.innerHTML = '<p class="no-data">لا يوجد سجل للدرع</p>';
        return;
    }

    historyList.innerHTML = shieldHistory.map(record => `
        <div class="history-item ${record.status}">
            <div class="history-header">
                <span class="history-type">${getShieldTypeName(record.type)}</span>
                <span class="history-status ${record.status}">${getStatusText(record.status)}</span>
            </div>
            <div class="history-details">
                <p><strong>التكلفة:</strong> ${record.cost?.toLocaleString()} عملة</p>
                <p><strong>المدة:</strong> ${record.duration} ساعة</p>
                <p><strong>تاريخ التفعيل:</strong> ${formatDate(record.activatedAt)}</p>
                ${record.expiresAt ? `<p><strong>تاريخ الانتهاء:</strong> ${formatDate(record.expiresAt)}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// تحميل إعدادات الدرع
async function loadShieldSettings() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/shield/settings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب إعدادات الدرع');
        }

        const settings = await response.json();
        updateSettingsDisplay(settings);
        
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الدرع:', error);
        showNotification('خطأ في تحميل إعدادات الدرع', 'error');
    }
}

// تحديث عرض الإعدادات
function updateSettingsDisplay(settings) {
    const autoRenew = document.getElementById('auto-renew');
    const autoRenewType = document.getElementById('auto-renew-type');
    const notifications = document.getElementById('shield-notifications');
    const blockNegative = document.getElementById('block-all-negative');

    if (autoRenew) autoRenew.checked = settings.autoRenew || false;
    if (autoRenewType) autoRenewType.value = settings.autoRenewType || 'basic';
    if (notifications) notifications.checked = settings.notifications !== false;
    if (blockNegative) blockNegative.checked = settings.blockAllNegative !== false;
}

// فتح Modal تفعيل الدرع
function openActivationModal(shieldType) {
    const modal = document.getElementById('activation-modal');
    const modalType = document.getElementById('modal-shield-type');
    const modalCost = document.getElementById('modal-shield-cost');
    const modalDuration = document.getElementById('modal-shield-duration');

    const shieldInfo = getShieldInfo(shieldType);
    
    if (modalType) modalType.textContent = shieldInfo.name;
    if (modalCost) modalCost.textContent = shieldInfo.cost.toLocaleString();
    if (modalDuration) modalDuration.textContent = shieldInfo.durationText;
    
    modal.dataset.shieldType = shieldType;
    modal.style.display = 'block';
}

// إغلاق Modal تفعيل الدرع
function closeActivationModal() {
    const modal = document.getElementById('activation-modal');
    modal.style.display = 'none';
}

// تأكيد تفعيل الدرع
async function confirmShieldActivation() {
    const modal = document.getElementById('activation-modal');
    const shieldType = modal.dataset.shieldType;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/shield/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ type: shieldType })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'فشل في تفعيل الدرع');
        }

        const result = await response.json();
        showNotification(result.message, 'success');
        closeActivationModal();
        
        // إعادة تحميل البيانات
        loadUserData();
        
    } catch (error) {
        console.error('خطأ في تفعيل الدرع:', error);
        showNotification(error.message, 'error');
    }
}

// إلغاء تفعيل الدرع
async function deactivateShield() {
    if (!confirm('هل أنت متأكد من إلغاء الدرع؟')) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/shield/deactivate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في إلغاء الدرع');
        }

        const result = await response.json();
        showNotification(result.message, 'success');
        loadShieldStatus();
        
    } catch (error) {
        console.error('خطأ في إلغاء الدرع:', error);
        showNotification('خطأ في إلغاء الدرع', 'error');
    }
}

// حفظ إعدادات الدرع
async function saveShieldSettings() {
    const autoRenew = document.getElementById('auto-renew').checked;
    const autoRenewType = document.getElementById('auto-renew-type').value;
    const notifications = document.getElementById('shield-notifications').checked;
    const blockNegative = document.getElementById('block-all-negative').checked;

    try {
        const response = await fetch(`${BACKEND_URL}/api/shield/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                autoRenew,
                autoRenewType,
                notifications,
                blockAllNegative: blockNegative
            })
        });

        if (!response.ok) {
            throw new Error('فشل في حفظ الإعدادات');
        }

        showNotification('تم حفظ الإعدادات بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showNotification('خطأ في حفظ الإعدادات', 'error');
    }
}

// تصفية السجل
function filterHistory(filter) {
    // إزالة الفئة النشطة من جميع المرشحات
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // تفعيل المرشح المحدد
    const activeFilter = document.querySelector(`[data-filter="${filter}"]`);
    if (activeFilter) {
        activeFilter.classList.add('active');
    }
    
    // تطبيق التصفية
    const filteredHistory = filter === 'all' 
        ? shieldHistory 
        : shieldHistory.filter(record => record.status === filter);
    
    updateHistoryDisplay(filteredHistory);
}

// دوال مساعدة
function getShieldInfo(type) {
    const shields = {
        basic: { name: 'الدرع الأساسي', cost: 50000, duration: 24, durationText: '24 ساعة' },
        premium: { name: 'الدرع المميز', cost: 100000, duration: 48, durationText: '48 ساعة' },
        extended: { name: 'الدرع الممتد', cost: 90000, duration: 72, durationText: '72 ساعة' },
        ultimate: { name: 'الدرع الأقوى', cost: 135000, duration: 72, durationText: '3 أيام' }
    };
    return shields[type] || shields.basic;
}

function getShieldTypeName(type) {
    const names = {
        basic: 'الدرع الأساسي',
        premium: 'الدرع المميز',
        extended: 'الدرع الممتد',
        ultimate: 'الدرع الأقوى'
    };
    return names[type] || 'غير معروف';
}

function getStatusText(status) {
    const texts = {
        active: 'نشط',
        expired: 'منتهي',
        cancelled: 'ملغي'
    };
    return texts[status] || status;
}

function calculateRemainingTime(expiresAt) {
    if (!expiresAt) return 'غير محدد';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'منتهي';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days} يوم و ${remainingHours} ساعة`;
    }
    
    return `${hours} ساعة و ${minutes} دقيقة`;
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// إعداد التحذير عند محاولة الخروج
function setupExitWarning() {
    console.log('⚠️ إعداد تحذير الخروج...');
    
    // التحذير عند محاولة إغلاق التبويب/المتصفح فقط
    window.addEventListener('beforeunload', function(e) {
        if (currentUser) {
            const message = 'هل تريد الخروج من الموقع؟ سيتم فقدان تقدمك في اللعبة.';
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });
    
    // إزالة التحذيرات من التنقل الداخلي (popstate)
    // لا نضع أي event listeners للـ popstate لتجنب التحذيرات عند التنقل الداخلي
    
    console.log('✅ تم إعداد تحذير الخروج (فقط عند مغادرة الموقع)');
} 