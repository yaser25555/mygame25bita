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

// التحقق من وجود العناصر قبل إضافة الأحداث
if (!adminLoginForm) console.warn('adminLoginForm not found');
if (!adminPanel) console.warn('adminPanel not found');
if (!showGameManagement) console.warn('showGameManagement not found');
if (!showUserManagement) console.warn('showUserManagement not found');
if (!gameManagementSection) console.warn('gameManagementSection not found');
if (!userManagementSection) console.warn('userManagementSection not found');
if (!searchUsername) console.warn('searchUsername not found');
if (!fetchUserDataBtn) console.warn('fetchUserDataBtn not found');
if (!editUserForm) console.warn('editUserForm not found');
if (!currentUsername) console.warn('currentUsername not found');
if (!editUsername) console.warn('editUsername not found');
if (!editPassword) console.warn('editPassword not found');
if (!manageCoins) console.warn('manageCoins not found');
if (!managePearls) console.warn('managePearls not found');
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
if (fetchUserDataBtn) {
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
                if (editUserForm) {
                    editUserForm.classList.remove('hidden');
                }
            } else {
                alert('المستخدم غير موجود');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('خطأ في جلب بيانات المستخدم');
        }
    });
}

// ملء نموذج تعديل المستخدم
function populateUserForm(userData) {
    currentUsername.value = userData.username;
    editUsername.value = userData.username;
    manageCoins.value = userData.score || 0;
    managePearls.value = userData.pearls || 0;
    adminRoleUsername.value = userData.username;
}

// تحديث بيانات المستخدم
if (editUserForm) {
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
}

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
const updateUserIdBtn = document.getElementById('updateUserIdBtn');
if (updateUserIdBtn) {
    updateUserIdBtn.addEventListener('click', async function() {
        const username = document.getElementById('searchUserIdUsername').value.trim();
        const newUserId = parseInt(document.getElementById('newUserId').value);
        const messageElement = document.getElementById('updateUserIdMessage');
        
        if (!username) {
            messageElement.textContent = 'يرجى البحث عن مستخدم أولاً';
            messageElement.style.color = 'red';
            return;
        }
        
        if (!newUserId || newUserId < 1) {
            messageElement.textContent = 'يرجى إدخال معرف صحيح';
            messageElement.style.color = 'red';
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
                    newUserId: newUserId 
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                messageElement.textContent = `✅ تم تحديث معرف المستخدم ${username} إلى ${newUserId} بنجاح!`;
                messageElement.style.color = 'green';
                
                // تحديث العرض
                const currentUserIdElement = document.getElementById('displayCurrentUserId');
                if (currentUserIdElement) {
                    currentUserIdElement.textContent = newUserId;
                }
            } else {
                const error = await response.json();
                messageElement.textContent = `❌ خطأ: ${error.error || 'فشل في تحديث المعرف'}`;
                messageElement.style.color = 'red';
            }
        } catch (error) {
            console.error('Error updating user ID:', error);
            messageElement.textContent = '❌ خطأ في الاتصال بالخادم';
            messageElement.style.color = 'red';
        }
    });
}

// تحميل جميع المستخدمين
const loadAllUsersBtn = document.getElementById('loadAllUsersBtn');
if (loadAllUsersBtn) {
    loadAllUsersBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                displayUsersList(data.users);
            } else {
                alert('خطأ في تحميل قائمة المستخدمين');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            alert('خطأ في الاتصال بالخادم');
        }
    });
}

// عرض قائمة المستخدمين
function displayUsersList(users) {
    const usersListContainer = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersListContainer.innerHTML = '<p>لا يوجد مستخدمين</p>';
        return;
    }
    
    const usersHTML = users.map(user => `
        <div class="user-item" style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; background: #f9f9f9;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${user.username}</strong> 
                    <span style="color: #666;">(ID: ${user.userId || 'غير محدد'})</span>
                </div>
                <button onclick="searchUserById('${user.username}')" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                    تعديل المعرف
                </button>
            </div>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                البريد: ${user.email || 'غير محدد'} | النقاط: ${user.score || 0}
            </div>
        </div>
    `).join('');
    
    usersListContainer.innerHTML = usersHTML;
}

// دالة مساعدة للبحث عن مستخدم من القائمة
window.searchUserById = function(username) {
    document.getElementById('searchUserIdUsername').value = username;
    document.getElementById('searchUserBtn').click();
}; 
