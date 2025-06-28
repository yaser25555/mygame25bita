const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// متغيرات عامة
let currentUser = null;
let selectedGift = null;
let currentFilter = 'pending';

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تحميل صفحة الهدايا...');
    
    // التحقق من تسجيل الدخول
    checkAuth();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // تحميل بيانات الهدايا
    loadGiftsData();
    
    // إضافة تحذير الخروج
    setupExitWarning();
    
    console.log('✅ تم تحميل صفحة الهدايا بنجاح');
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // اختيار الهدايا
    document.querySelectorAll('.gift-item').forEach(item => {
        item.addEventListener('click', function() {
            selectGift(this);
        });
    });

    // فلاتر الهدايا المستلمة
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setFilter(filter);
        });
    });

    // Modal
    const modal = document.getElementById('gift-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// تحميل بيانات المستخدم
async function loadUserData() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            console.log('تم تحميل بيانات المستخدم:', currentUser);
        } else {
            throw new Error('فشل في تحميل بيانات المستخدم');
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        showNotification('خطأ في تحميل بيانات المستخدم', 'error');
    }
}

// تبديل التبويبات
function switchTab(tabName) {
    // إزالة الفئة النشطة من جميع التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // إضافة الفئة النشطة للتبويب المحدد
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // تحميل المحتوى المناسب
    switch (tabName) {
        case 'received':
            loadReceivedGifts();
            break;
        case 'sent':
            loadSentGifts();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// اختيار هدية
function selectGift(element) {
    // إزالة الاختيار من جميع الهدايا
    document.querySelectorAll('.gift-item').forEach(item => {
        item.classList.remove('selected');
    });

    // إضافة الاختيار للهدية المحددة
    element.classList.add('selected');
    selectedGift = element.dataset.gift;
    
    console.log('تم اختيار الهدية:', selectedGift);
}

// إرسال هدية
async function sendGift() {
    if (!selectedGift) {
        showNotification('يرجى اختيار نوع الهدية', 'warning');
        return;
    }

    const recipient = document.getElementById('recipient').value.trim();
    const count = parseInt(document.getElementById('gift-count').value) || 1;
    const message = document.getElementById('gift-message').value.trim();

    if (!recipient) {
        showNotification('يرجى إدخال اسم المستلم', 'warning');
        return;
    }

    if (count < 1 || count > 10) {
        showNotification('الكمية يجب أن تكون بين 1 و 10', 'warning');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/trading/send-gift`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                toUsername: recipient,
                giftName: selectedGift,
                giftCount: count,
                message: message
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message, 'success');
            clearForm();
            
            // تحديث قائمة الهدايا المرسلة
            loadSentGifts();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في إرسال الهدية:', error);
        showNotification('خطأ في إرسال الهدية', 'error');
    }
}

// مسح النموذج
function clearForm() {
    document.getElementById('recipient').value = '';
    document.getElementById('gift-count').value = '1';
    document.getElementById('gift-message').value = '';
    
    // إزالة اختيار الهدية
    document.querySelectorAll('.gift-item').forEach(item => {
        item.classList.remove('selected');
    });
    selectedGift = null;
}

// تحميل الهدايا المستلمة
async function loadReceivedGifts() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trading/received-gifts`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayReceivedGifts(data);
        } else {
            throw new Error('فشل في تحميل الهدايا المستلمة');
        }
    } catch (error) {
        console.error('خطأ في تحميل الهدايا المستلمة:', error);
        showNotification('خطأ في تحميل الهدايا المستلمة', 'error');
    }
}

// عرض الهدايا المستلمة
function displayReceivedGifts(data) {
    const container = document.getElementById('received-gifts-list');
    container.innerHTML = '';

    let giftsToShow = [];
    
    switch (currentFilter) {
        case 'pending':
            giftsToShow = data.pending;
            break;
        case 'accepted':
            giftsToShow = data.accepted;
            break;
        case 'rejected':
            giftsToShow = data.rejected;
            break;
    }

    if (giftsToShow.length === 0) {
        container.innerHTML = '<div class="no-gifts">لا توجد هدايا في هذه الفئة</div>';
        return;
    }

    giftsToShow.forEach(gift => {
        const giftCard = createGiftCard(gift, 'received');
        container.appendChild(giftCard);
    });
}

// تحميل الهدايا المرسلة
async function loadSentGifts() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trading/sent-gifts`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displaySentGifts(data);
        } else {
            throw new Error('فشل في تحميل الهدايا المرسلة');
        }
    } catch (error) {
        console.error('خطأ في تحميل الهدايا المرسلة:', error);
        showNotification('خطأ في تحميل الهدايا المرسلة', 'error');
    }
}

// عرض الهدايا المرسلة
function displaySentGifts(data) {
    const container = document.getElementById('sent-gifts-list');
    container.innerHTML = '';

    if (data.sentGifts.length === 0) {
        container.innerHTML = '<div class="no-gifts">لم ترسل أي هدايا بعد</div>';
        return;
    }

    data.sentGifts.forEach(gift => {
        const giftCard = createGiftCard(gift, 'sent');
        container.appendChild(giftCard);
    });
}

// إنشاء بطاقة هدية
function createGiftCard(gift, type) {
    const card = document.createElement('div');
    card.className = 'gift-card';

    const giftIcon = getGiftIcon(gift.giftName);
    const statusClass = getStatusClass(gift.status);
    const statusText = getStatusText(gift.status);

    card.innerHTML = `
        <div class="gift-info">
            <div class="gift-icon-small">${giftIcon}</div>
            <div class="gift-details">
                <h4>${gift.giftName} (${gift.giftCount})</h4>
                <p>من: ${type === 'received' ? gift.fromUsername : gift.toUsername}</p>
                <p>التاريخ: ${new Date(gift.sentAt || gift.receivedAt).toLocaleDateString('ar-SA')}</p>
                ${gift.message ? `<p>الرسالة: ${gift.message}</p>` : ''}
            </div>
        </div>
        <div class="gift-actions">
            <span class="gift-status ${statusClass}">${statusText}</span>
            ${type === 'received' && gift.status === 'pending' ? `
                <button class="btn btn-success" onclick="acceptGift('${gift.giftId}')">قبول</button>
                <button class="btn btn-danger" onclick="rejectGift('${gift.giftId}')">رفض</button>
            ` : ''}
        </div>
    `;

    return card;
}

// قبول هدية
async function acceptGift(giftId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trading/accept-gift`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ giftId })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message, 'success');
            loadReceivedGifts();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في قبول الهدية:', error);
        showNotification('خطأ في قبول الهدية', 'error');
    }
}

// رفض هدية
async function rejectGift(giftId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trading/reject-gift`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ giftId })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message, 'success');
            loadReceivedGifts();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في رفض الهدية:', error);
        showNotification('خطأ في رفض الهدية', 'error');
    }
}

// تعيين الفلتر
function setFilter(filter) {
    currentFilter = filter;
    
    // تحديث الأزرار
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // إعادة تحميل الهدايا
    loadReceivedGifts();
}

// تحميل الإعدادات
function loadSettings() {
    if (!currentUser) return;
    
    const settings = currentUser.gifts.giftSettings;
    
    document.getElementById('allow-gifts').checked = settings.allowGifts;
    document.getElementById('allow-negative-gifts').checked = settings.allowNegativeGifts;
    document.getElementById('allow-bombs-bats').checked = settings.allowBombsAndBats;
    document.getElementById('auto-accept-positive').checked = settings.autoAcceptPositiveGifts;
    document.getElementById('max-gift-value').value = settings.maxGiftValue;
    document.getElementById('daily-gift-limit').value = settings.dailyGiftLimit;
}

// حفظ الإعدادات
async function saveSettings() {
    const settings = {
        allowGifts: document.getElementById('allow-gifts').checked,
        allowNegativeGifts: document.getElementById('allow-negative-gifts').checked,
        allowBombsAndBats: document.getElementById('allow-bombs-bats').checked,
        autoAcceptPositiveGifts: document.getElementById('auto-accept-positive').checked,
        maxGiftValue: parseInt(document.getElementById('max-gift-value').value),
        dailyGiftLimit: parseInt(document.getElementById('daily-gift-limit').value)
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/trading/gift-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(settings)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message, 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showNotification('خطأ في حفظ الإعدادات', 'error');
    }
}

// دوال مساعدة
function getGiftIcon(giftName) {
    const icons = {
        'لآلئ': '💎',
        'جواهر': '💎',
        'عملات': '🪙',
        'مفاتيح': '🔑',
        'نجوم': '⭐',
        'قنبلة': '💣',
        'خفاش': '🦇',
        'لعنة': '👻',
        'صندوق غامض': '🎁'
    };
    return icons[giftName] || '🎁';
}

function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'accepted': 'status-accepted',
        'rejected': 'status-rejected',
        'auto_executed': 'status-auto-executed'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        'pending': 'في الانتظار',
        'accepted': 'مقبولة',
        'rejected': 'مرفوضة',
        'auto_executed': 'منفذة تلقائياً'
    };
    return texts[status] || 'غير معروف';
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notifications.appendChild(notification);

    // إزالة الإشعار بعد 5 ثوان
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// إضافة CSS للعناصر المفقودة
const style = document.createElement('style');
style.textContent = `
    .no-gifts {
        text-align: center;
        padding: 40px;
        color: #718096;
        font-size: 1.1rem;
    }
    
    .form-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 30px;
    }
`;
document.head.appendChild(style);

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