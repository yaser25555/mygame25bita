// ملف admin.js لإدارة لوحة تحكم المسؤول

const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

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

// عناصر DOM الجديدة لإدارة المستخدمين المحسنة
const searchByUsername = document.getElementById('searchByUsername');
const searchByUserId = document.getElementById('searchByUserId');
const searchByUsernameBtn = document.getElementById('searchByUsernameBtn');
const searchByUserIdBtn = document.getElementById('searchByUserIdBtn');
const userDataDisplay = document.getElementById('userDataDisplay');
const userOperationsContainer = document.getElementById('userOperationsContainer');
const displayUsername = document.getElementById('displayUsername');
const displayCurrentUserId = document.getElementById('displayCurrentUserId');
const displayEmail = document.getElementById('displayEmail');
const displayCoins = document.getElementById('displayCoins');
const displayPearls = document.getElementById('displayPearls');
const displayRole = document.getElementById('displayRole');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const newUserId = document.getElementById('newUserId');
const updateUserIdBtn = document.getElementById('updateUserIdBtn');
const loadAllUsersBtn = document.getElementById('loadAllUsersBtn');

// التحقق من وجود العناصر قبل إضافة الأحداث
if (!adminLoginForm) console.warn('adminLoginForm not found');
if (!adminPanel) console.warn('adminPanel not found');
if (!showGameManagement) console.warn('showGameManagement not found');
if (!showUserManagement) console.warn('showUserManagement not found');
if (!gameManagementSection) console.warn('gameManagementSection not found');
if (!userManagementSection) console.warn('userManagementSection not found');
if (!updateUserBtn) console.warn('updateUserBtn not found');
if (!adminRoleUsername) console.warn('adminRoleUsername not found');
if (!assignAdminRoleBtn) console.warn('assignAdminRoleBtn not found');
if (!saveGameSettingsBtn) console.warn('saveGameSettingsBtn not found');
if (!numBoxesInput) console.warn('numBoxesInput not found');
if (!winRatioInput) console.warn('winRatioInput not found');
if (!showSuspiciousActivity) console.warn('showSuspiciousActivity not found');
if (!suspiciousActivitySection) console.warn('suspiciousActivitySection not found');
if (!refreshSuspiciousActivityBtn) console.warn('refreshSuspiciousActivityBtn not found');
if (!suspiciousUsersList) console.warn('suspiciousUsersList not found');
if (!totalSuspiciousUsers) console.warn('totalSuspiciousUsers not found');
if (!highRiskUsers) console.warn('highRiskUsers not found');
if (!showUserIdsManagement) console.warn('showUserIdsManagement not found');
if (!showUserImagesManagement) console.warn('showUserImagesManagement not found');
if (!searchByUsername) console.warn('searchByUsername not found');
if (!searchByUserId) console.warn('searchByUserId not found');
if (!searchByUsernameBtn) console.warn('searchByUsernameBtn not found');
if (!searchByUserIdBtn) console.warn('searchByUserIdBtn not found');
if (!userDataDisplay) console.warn('userDataDisplay not found');
if (!userOperationsContainer) console.warn('userOperationsContainer not found');
if (!displayUsername) console.warn('displayUsername not found');
if (!displayCurrentUserId) console.warn('displayCurrentUserId not found');
if (!displayEmail) console.warn('displayEmail not found');
if (!displayCoins) console.warn('displayCoins not found');
if (!displayPearls) console.warn('displayPearls not found');
if (!displayRole) console.warn('displayRole not found');
if (!updatePasswordBtn) console.warn('updatePasswordBtn not found');
if (!manageCoins) console.warn('manageCoins not found');
if (!managePearls) console.warn('managePearls not found');
if (!editPassword) console.warn('editPassword not found');
if (!newUserId) console.warn('newUserId not found');
if (!updateUserIdBtn) console.warn('updateUserIdBtn not found');
if (!loadAllUsersBtn) console.warn('loadAllUsersBtn not found');

// التحقق من وجود token عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        showAdminPanel();
    }
});

// تسجيل دخول المسؤول
if (adminLoginForm) {
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
                const loginMessage = document.getElementById('loginMessage');
                if (loginMessage) {
                    loginMessage.textContent = '';
                }
            } else {
                const loginMessage = document.getElementById('loginMessage');
                if (loginMessage) {
                    loginMessage.textContent = 'خطأ في تسجيل الدخول أو المستخدم ليس مسؤولاً';
                }
            }
        } catch (error) {
            console.error('Error during admin login:', error);
            const loginMessage = document.getElementById('loginMessage');
            if (loginMessage) {
                loginMessage.textContent = 'خطأ في الاتصال بالخادم';
            }
        }
    });
}

// عرض لوحة الإدارة
function showAdminPanel() {
    adminLoginForm.style.display = 'none';
    adminPanel.classList.remove('hidden');
}

// إدارة الأقسام
if (showGameManagement) {
    showGameManagement.addEventListener('click', function() {
        hideAllSections();
        if (gameManagementSection) {
            gameManagementSection.classList.remove('hidden');
        }
    });
}

if (showUserManagement) {
    showUserManagement.addEventListener('click', function() {
        hideAllSections();
        if (userManagementSection) {
            userManagementSection.classList.remove('hidden');
        }
    });
}

// دالة لإخفاء جميع الأقسام
function hideAllSections() {
    if (gameManagementSection) gameManagementSection.classList.add('hidden');
    if (userManagementSection) userManagementSection.classList.add('hidden');
    if (suspiciousActivitySection) suspiciousActivitySection.classList.add('hidden');
    
    const userIdsSection = document.getElementById('userIdsManagementSection');
    if (userIdsSection) userIdsSection.classList.add('hidden');
    
    const userImagesSection = document.getElementById('userImagesManagementSection');
    if (userImagesSection) userImagesSection.classList.add('hidden');
}

// جلب بيانات المستخدم
// if (fetchUserDataBtn) {
//     fetchUserDataBtn.addEventListener('click', async function() {
//         const username = searchUsername.value.trim();
//         if (!username) {
//             alert('يرجى إدخال اسم المستخدم');
//             return;
//         }
//         
//         try {
//             const response = await fetch(`${BACKEND_URL}/api/users/by-username/${username}`, {
//                 headers: {
//                     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
//                 }
//             });
//             
//             if (response.ok) {
//                 const userData = await response.json();
//                 populateUserForm(userData);
//                 if (editUserForm) {
//                     editUserForm.classList.remove('hidden');
//                 }
//             } else {
//                 alert('المستخدم غير موجود');
//             }
//         } catch (error) {
//             console.error('Error fetching user data:', error);
//             alert('خطأ في جلب بيانات المستخدم');
//         }
//     });
// }

// ملء نموذج تعديل المستخدم
// function populateUserForm(userData) {
//     currentUsername.value = userData.username;
//     editUsername.value = userData.username;
//     manageCoins.value = userData.score || 0;
//     managePearls.value = userData.pearls || 0;
//     adminRoleUsername.value = userData.username;
// }

// تحديث بيانات المستخدم (النسخة المحسنة)
if (updateUserBtn) {
    updateUserBtn.addEventListener('click', async function() {
        const username = displayUsername.textContent;
        const newCoins = parseInt(manageCoins.value) || 0;
        const newPearls = parseInt(managePearls.value) || 0;
        
        if (!username || username === 'غير محدد') {
            showMessage('يرجى البحث عن مستخدم أولاً', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/update-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    username: username,
                    newScore: newCoins,
                    newPearls: newPearls
                })
            });
            
            if (response.ok) {
                showMessage('تم تحديث بيانات المستخدم بنجاح', 'success');
                // تحديث العرض
                if (displayCoins) displayCoins.textContent = newCoins;
                if (displayPearls) displayPearls.textContent = newPearls;
            } else {
                const errorData = await response.json();
                showMessage(errorData.message || 'خطأ في تحديث بيانات المستخدم', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showMessage('خطأ في تحديث بيانات المستخدم', 'error');
        }
    });
}

// تعيين مستخدم كمشرف (النسخة المحسنة)
if (assignAdminRoleBtn) {
    assignAdminRoleBtn.addEventListener('click', async function() {
        const username = adminRoleUsername.value.trim();
        if (!username) {
            showMessage('يرجى البحث عن مستخدم أولاً', 'error');
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
                showMessage(`تم تعيين ${username} كمشرف بنجاح`, 'success');
                // تحديث العرض
                if (displayRole) displayRole.textContent = 'مسؤول';
            } else {
                showMessage('خطأ في تعيين المشرف', 'error');
            }
        } catch (error) {
            console.error('Error assigning admin role:', error);
            showMessage('خطأ في تعيين المشرف', 'error');
        }
    });
}

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
if (showUserIdsManagement) {
    showUserIdsManagement.addEventListener('click', function() {
        hideAllSections();
        const userIdsSection = document.getElementById('userIdsManagementSection');
        if (userIdsSection) {
            userIdsSection.classList.remove('hidden');
        }
    });
}

showUserImagesManagement.addEventListener('click', function() {
    // إخفاء جميع الأقسام
    hideAllSections();
    
    // فتح صفحة إدارة الصور في نافذة جديدة
    window.open('admin-user-images.html', '_blank');
});

// البحث عن المستخدم لتغيير المعرف
const searchUserBtn = document.getElementById('searchUserBtn');
if (searchUserBtn) {
    searchUserBtn.addEventListener('click', async function() {
        const username = document.getElementById('searchUserIdUsername').value.trim();
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
                displayUserDataForIdChange(userData);
            } else {
                alert('المستخدم غير موجود');
            }
        } catch (error) {
            console.error('Error searching user:', error);
            alert('خطأ في البحث عن المستخدم');
        }
    });
}

// عرض بيانات المستخدم لتغيير المعرف
function displayUserDataForIdChange(userData) {
    document.getElementById('displayUsername').textContent = userData.username;
    document.getElementById('displayCurrentUserId').textContent = userData.userId || 'غير محدد';
    document.getElementById('displayEmail').textContent = userData.email || 'غير محدد';
    document.getElementById('userDataDisplay').classList.remove('hidden');
    
    // تعيين المعرف الحالي كقيمة افتراضية
    document.getElementById('newUserId').value = userData.userId || '';
}

// تحديث معرف المستخدم
if (updateUserIdBtn) {
    updateUserIdBtn.addEventListener('click', async function() {
        const username = displayUsername.textContent;
        const newUserIdValue = parseInt(document.getElementById('newUserId').value);
        
        if (!username || username === 'غير محدد') {
            showMessage('يرجى البحث عن مستخدم أولاً', 'error');
            return;
        }
        
        if (!newUserIdValue || newUserIdValue < 1) {
            showMessage('يرجى إدخال معرف صحيح', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/admin/update-user-id`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    username: username,
                    newUserId: newUserIdValue
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                showMessage(result.message, 'success');
                // تحديث العرض
                if (displayCurrentUserId) displayCurrentUserId.textContent = newUserIdValue;
                document.getElementById('newUserId').value = '';
            } else {
                const errorData = await response.json();
                showMessage(errorData.error || 'خطأ في تحديث المعرف', 'error');
            }
        } catch (error) {
            console.error('Error updating user ID:', error);
            showMessage('خطأ في تحديث المعرف', 'error');
        }
    });
}

// تحميل جميع المستخدمين
if (loadAllUsersBtn) {
    loadAllUsersBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/admin/users-with-ids`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                displayUsersList(data.users);
            } else {
                showMessage('خطأ في تحميل قائمة المستخدمين', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showMessage('خطأ في تحميل قائمة المستخدمين', 'error');
        }
    });
}

// عرض قائمة المستخدمين
function displayUsersList(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    if (users.length === 0) {
        usersList.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">لا يوجد مستخدمين</p>';
        return;
    }
    
    const usersHTML = users.map(user => `
        <div class="user-list-item" onclick="selectUserFromList('${user.username}')">
            <div class="user-list-info">
                <div class="user-list-avatar">
                    ${user.avatar ? `<img src="${user.avatar}" alt="Avatar" onerror="this.style.display='none'">` : '👤'}
                </div>
                <div class="user-list-details">
                    <div class="user-list-name">${user.username}</div>
                    <div class="user-list-id">المعرف: ${user.userId}</div>
                    <div class="user-list-score">النقاط: ${user.score || 0}</div>
                </div>
            </div>
            <div class="user-list-actions">
                <button onclick="event.stopPropagation(); selectUserFromList('${user.username}')" class="select-user-btn">
                    🔍 اختيار
                </button>
            </div>
        </div>
    `).join('');
    
    usersList.innerHTML = usersHTML;
}

// اختيار مستخدم من القائمة
window.selectUserFromList = function(username) {
    if (searchByUsername) {
        searchByUsername.value = username;
        if (searchByUsernameBtn) {
            searchByUsernameBtn.click();
        }
    }
};

// البحث بالاسم
if (searchByUsernameBtn) {
    searchByUsernameBtn.addEventListener('click', async function() {
        const username = searchByUsername.value.trim();
        if (!username) {
            showMessage('يرجى إدخال اسم المستخدم', 'error');
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
                displayUserData(userData);
            } else {
                showMessage('المستخدم غير موجود', 'error');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            showMessage('خطأ في جلب بيانات المستخدم', 'error');
        }
    });
}

// البحث بالمعرف
if (searchByUserIdBtn) {
    searchByUserIdBtn.addEventListener('click', async function() {
        const userId = searchByUserId.value.trim();
        if (!userId) {
            showMessage('يرجى إدخال معرف المستخدم', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/admin/find-user-by-id/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                displayUserData(userData);
            } else {
                showMessage('المستخدم غير موجود', 'error');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            showMessage('خطأ في جلب بيانات المستخدم', 'error');
        }
    });
}

// عرض بيانات المستخدم
function displayUserData(userData) {
    // التعامل مع البيانات التي تأتي من مسار البحث بالمعرف
    const user = userData.user || userData;
    
    if (displayUsername) displayUsername.textContent = user.username || 'غير محدد';
    if (displayCurrentUserId) displayCurrentUserId.textContent = user.userId || 'غير محدد';
    if (displayEmail) displayEmail.textContent = user.email || 'غير محدد';
    if (displayCoins) displayCoins.textContent = user.score || 0;
    if (displayPearls) displayPearls.textContent = user.pearls || 0;
    if (displayRole) displayRole.textContent = user.isAdmin ? 'مسؤول' : 'مستخدم عادي';
    
    // ملء حقول العمليات
    if (manageCoins) manageCoins.value = user.score || 0;
    if (managePearls) managePearls.value = user.pearls || 0;
    if (adminRoleUsername) adminRoleUsername.value = user.username || '';
    if (newUserId) newUserId.value = '';
    if (editPassword) editPassword.value = '';
    
    // إظهار أقسام البيانات والعمليات
    if (userDataDisplay) userDataDisplay.classList.remove('hidden');
    if (userOperationsContainer) userOperationsContainer.classList.remove('hidden');
    
    showMessage('تم جلب بيانات المستخدم بنجاح', 'success');
}

// تحديث كلمة المرور
if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async function() {
        const username = displayUsername.textContent;
        const newPassword = editPassword.value.trim();
        
        if (!username || username === 'غير محدد') {
            showMessage('يرجى البحث عن مستخدم أولاً', 'error');
            return;
        }
        
        if (!newPassword) {
            showMessage('يرجى إدخال كلمة المرور الجديدة', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/update-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    username: username,
                    newPassword: newPassword
                })
            });
            
            if (response.ok) {
                showMessage('تم تحديث كلمة المرور بنجاح', 'success');
                editPassword.value = '';
            } else {
                const errorData = await response.json();
                showMessage(errorData.message || 'خطأ في تحديث كلمة المرور', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showMessage('خطأ في تحديث كلمة المرور', 'error');
        }
    });
}

// تحسينات للجوال والتفاعل مع اللمس
document.addEventListener('DOMContentLoaded', function() {
    // منع التكبير على الجوال
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // تحسين التفاعل مع الأزرار على الجوال
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.opacity = '0.8';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
            this.style.opacity = '';
        });
    });
    
    // تحسين التفاعل مع حقول الإدخال
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // تأخير بسيط لضمان ظهور لوحة المفاتيح
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
    
    // تحسين التمرير في قائمة المستخدمين
    const usersList = document.getElementById('usersList');
    if (usersList) {
        usersList.addEventListener('touchstart', function(e) {
            this.style.overflow = 'hidden';
        });
        
        usersList.addEventListener('touchend', function(e) {
            this.style.overflow = 'auto';
        });
    }
});

// تحسين عرض الرسائل على الجوال
function showMessage(message, type = 'info') {
    // إزالة الرسائل السابقة
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // إنشاء رسالة جديدة
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // إضافة زر إغلاق للرسائل
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: inherit;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.onclick = () => messageElement.remove();
    
    messageElement.style.position = 'relative';
    messageElement.appendChild(closeBtn);
    
    // إضافة الرسالة إلى الصفحة
    const container = document.querySelector('.user-management-container');
    if (container) {
        container.insertBefore(messageElement, container.firstChild);
    }
    
    // إزالة الرسالة بعد 8 ثوان (أطول قليلاً للجوال)
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 8000);
    
    // تمرير إلى الرسالة
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
} 
