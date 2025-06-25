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
    gameManagementSection.classList.remove('hidden');
    userManagementSection.classList.add('hidden');
});

showUserManagement.addEventListener('click', function() {
    userManagementSection.classList.remove('hidden');
    gameManagementSection.classList.add('hidden');
});

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