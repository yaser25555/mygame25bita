// ملف admin.js لإدارة لوحة تحكم المسؤول

const BACKEND_URL = "https://mygame25bita-1-4ue6.onrender.com";

// عناصر DOM
const adminLoginForm = document.getElementById('adminLoginForm');
const adminPanel = document.getElementById('adminPanel');
const showGameManagement = document.getElementById('showGameManagement');
const showUserManagement = document.getElementById('showUserManagement');
const gameManagementSection = document.getElementById('gameManagementSection');
const userManagementSection = document.getElementById('userManagementSection');
const searchUsername = document.getElementById('searchUsername');
const fetchUserDataBtn = document.getElementById('fetchUserDataBtn');
const editUserForm = document.getElementById('editUserForm');
const currentUsername = document.getElementById('currentUsername');
const editUsername = document.getElementById('editUsername');
const editPassword = document.getElementById('editPassword');
const manageCoins = document.getElementById('manageCoins');
const managePearls = document.getElementById('managePearls');
const updateUserBtn = document.getElementById('updateUserBtn');
const adminRoleUsername = document.getElementById('adminRoleUsername');
const assignAdminRoleBtn = document.getElementById('assignAdminRoleBtn');
const saveGameSettingsBtn = document.getElementById('saveGameSettingsBtn');
const numBoxesInput = document.getElementById('numBoxesInput');
const winRatioInput = document.getElementById('winRatioInput');

// عناصر DOM للنشاطات المشبوهة
const showSuspiciousActivity = document.getElementById('showSuspiciousActivity');
const suspiciousActivitySection = document.getElementById('suspiciousActivitySection');
const refreshSuspiciousActivityBtn = document.getElementById('refreshSuspiciousActivityBtn');
const suspiciousUsersList = document.getElementById('suspiciousUsersList');
const totalSuspiciousUsers = document.getElementById('totalSuspiciousUsers');
const highRiskUsers = document.getElementById('highRiskUsers');

// عناصر DOM الجديدة لإدارة المعرفات والصور
const showUserIdsManagement = document.getElementById('showUserIdsManagement');
const showUserImagesManagement = document.getElementById('showUserImagesManagement');

// التحقق من وجود token عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        showAdminPanel();
    }
});

// تسجيل دخول المسؤول
adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.isAdmin) {
            localStorage.setItem('adminToken', data.token);
            showAdminPanel();
            document.getElementById('loginMessage').textContent = '';
        } else {
            document.getElementById('loginMessage').textContent = 'خطأ في تسجيل الدخول أو المستخدم ليس مسؤولاً';
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        document.getElementById('loginMessage').textContent = 'خطأ في الاتصال بالخادم';
    }
});

// عرض لوحة الإدارة
function showAdminPanel() {
    adminLoginForm.style.display = 'none';
    adminPanel.classList.remove('hidden');
}

// إدارة الأقسام
showGameManagement.addEventListener('click', function() {
    hideAllSections();
    gameManagementSection.classList.remove('hidden');
});

showUserManagement.addEventListener('click', function() {
    hideAllSections();
    userManagementSection.classList.remove('hidden');
});

// دالة لإخفاء جميع الأقسام
function hideAllSections() {
    gameManagementSection.classList.add('hidden');
    userManagementSection.classList.add('hidden');
    suspiciousActivitySection.classList.add('hidden');
}

// جلب بيانات المستخدم
fetchUserDataBtn.addEventListener('click', async function() {
    const username = searchUsername.value.trim();
    if (!username) {
        alert('يرجى إدخال اسم المستخدم');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/by-username/${username}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            populateUserForm(userData);
            editUserForm.classList.remove('hidden');
        } else {
            alert('المستخدم غير موجود');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('خطأ في جلب بيانات المستخدم');
    }
});

// ملء نموذج تعديل المستخدم
function populateUserForm(userData) {
    currentUsername.value = userData.username;
    editUsername.value = userData.username;
    manageCoins.value = userData.score || 0;
    managePearls.value = userData.pearls || 0;
    adminRoleUsername.value = userData.username;
}

// تحديث بيانات المستخدم
editUserForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        currentUsername: currentUsername.value,
        newUsername: editUsername.value,
        newPassword: editPassword.value || undefined,
        newScore: parseInt(manageCoins.value) || 0
    };
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/update-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('تم تحديث بيانات المستخدم بنجاح!');
            
            // إضافة اللؤلؤ إذا تم تحديد قيمة
            const pearlsToAdd = parseInt(managePearls.value) || 0;
            if (pearlsToAdd > 0) {
                await addPearlsToUser(editUsername.value, pearlsToAdd);
            }
        } else {
            alert('خطأ في تحديث بيانات المستخدم');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('خطأ في الاتصال بالخادم');
    }
});

// إضافة لؤلؤ للمستخدم
async function addPearlsToUser(username, amount) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/add-pearls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ username, amount })
        });
        
        if (response.ok) {
            alert(`تم إضافة ${amount} لؤلؤة للمستخدم ${username} بنجاح!`);
        } else {
            alert('خطأ في إضافة اللؤلؤ');
        }
    } catch (error) {
        console.error('Error adding pearls:', error);
        alert('خطأ في الاتصال بالخادم');
    }
}

// تعيين مستخدم كمشرف
assignAdminRoleBtn.addEventListener('click', async function() {
    const username = adminRoleUsername.value.trim();
    if (!username) {
        alert('يرجى إدخال اسم المستخدم');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/update-role`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ username, role: 'admin' })
        });
        
        if (response.ok) {
            alert(`تم تعيين ${username} كمشرف بنجاح!`);
        } else {
            alert('خطأ في تعيين المشرف');
        }
    } catch (error) {
        console.error('Error assigning admin role:', error);
        alert('خطأ في الاتصال بالخادم');
    }
});

// حفظ إعدادات اللعبة
saveGameSettingsBtn.addEventListener('click', async function() {
    const numBoxes = parseInt(numBoxesInput.value);
    const winRatio = parseFloat(winRatioInput.value);
    
    if (!numBoxes || !winRatio) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                gameSettings: {
                    numBoxes: numBoxes,
                    winRatio: winRatio
                }
            })
        });
        
        if (response.ok) {
            alert('تم حفظ إعدادات اللعبة بنجاح!');
        } else {
            alert('خطأ في حفظ إعدادات اللعبة');
        }
    } catch (error) {
        console.error('Error saving game settings:', error);
        alert('خطأ في الاتصال بالخادم');
    }
});

// إضافة حدث للقسم الجديد
showSuspiciousActivity.addEventListener('click', function() {
    hideAllSections();
    suspiciousActivitySection.classList.remove('hidden');
    loadSuspiciousActivity();
});

// جلب النشاطات المشبوهة
async function loadSuspiciousActivity() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/admin/suspicious-activity`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displaySuspiciousUsers(data);
        } else {
            console.error('Error loading suspicious activity');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// عرض المستخدمين المشبوهين
function displaySuspiciousUsers(data) {
    totalSuspiciousUsers.textContent = data.totalSuspiciousUsers;
    
    const highRiskCount = data.users.filter(user => user.riskLevel === 'عالي').length;
    highRiskUsers.textContent = highRiskCount;
    
    if (data.users.length === 0) {
        suspiciousUsersList.innerHTML = '<p style="text-align: center; color: #666;">لا توجد نشاطات مشبوهة</p>';
        return;
    }
    
    suspiciousUsersList.innerHTML = data.users.map(user => `
        <div class="user-card" style="
            background: ${user.riskLevel === 'عالي' ? '#fee2e2' : user.riskLevel === 'متوسط' ? '#fef3c7' : '#f0f9ff'};
            border: 1px solid ${user.riskLevel === 'عالي' ? '#fecaca' : user.riskLevel === 'متوسط' ? '#fed7aa' : '#bfdbfe'};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0;">${user.username}</h4>
                <span style="
                    background: ${user.riskLevel === 'عالي' ? '#ef4444' : user.riskLevel === 'متوسط' ? '#f59e0b' : '#3b82f6'};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                ">${user.riskLevel}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                    <strong>النقاط:</strong> ${user.score.toLocaleString()}
                </div>
                <div>
                    <strong>النشاطات المشبوهة:</strong> ${user.suspiciousActivityCount}
                </div>
            </div>
            
            ${user.lastSuspiciousActivity ? `
                <div style="background: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
                    <strong>آخر نشاط مشبوه:</strong><br>
                    ${user.lastSuspiciousActivity.activities.join(', ')}<br>
                    <small>${new Date(user.lastSuspiciousActivity.timestamp).toLocaleString('ar-SA')}</small>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 8px;">
                <button onclick="banUser('${user.username}')" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">حظر</button>
                
                <button onclick="resetUserScore('${user.username}')" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">إعادة تعيين النقاط</button>
                
                <button onclick="viewUserDetails('${user.username}')" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">تفاصيل</button>
            </div>
        </div>
    `).join('');
}

// حظر مستخدم
window.banUser = async function(username) {
    const reason = prompt('سبب الحظر:');
    if (!reason) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/admin/ban-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ username, reason })
        });
        
        if (response.ok) {
            alert(`تم حظر المستخدم ${username} بنجاح`);
            loadSuspiciousActivity();
        } else {
            alert('خطأ في حظر المستخدم');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        alert('خطأ في الاتصال بالخادم');
    }
};

// إعادة تعيين نقاط مستخدم
window.resetUserScore = async function(username) {
    const newScore = prompt('النقاط الجديدة (اترك فارغاً للعودة إلى 1000):');
    const score = newScore ? parseInt(newScore) : 1000;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/admin/reset-user-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ username, newScore: score })
        });
        
        if (response.ok) {
            alert(`تم إعادة تعيين نقاط ${username} إلى ${score}`);
            loadSuspiciousActivity();
        } else {
            alert('خطأ في إعادة تعيين النقاط');
        }
    } catch (error) {
        console.error('Error resetting user score:', error);
        alert('خطأ في الاتصال بالخادم');
    }
};

// عرض تفاصيل المستخدم
window.viewUserDetails = function(username) {
    alert(`تفاصيل المستخدم: ${username}\n\nسيتم إضافة المزيد من التفاصيل هنا...`);
};

// تحديث البيانات
refreshSuspiciousActivityBtn.addEventListener('click', loadSuspiciousActivity);

// إضافة أحداث للأقسام الجديدة
showUserIdsManagement.addEventListener('click', function() {
    // إخفاء جميع الأقسام
    hideAllSections();
    
    // فتح صفحة إدارة المعرفات في نافذة جديدة
    window.open('admin-user-ids.html', '_blank');
});

showUserImagesManagement.addEventListener('click', function() {
    // إخفاء جميع الأقسام
    hideAllSections();
    
    // فتح صفحة إدارة الصور في نافذة جديدة
    window.open('admin-user-images.html', '_blank');
}); 
