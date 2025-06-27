// User ID Helper - سكريبت مساعد لعرض معرف المستخدم
// يمكن إضافة هذا الملف إلى أي صفحة لعرض معرف المستخدم

(function() {
    'use strict';
    
    const BACKEND_URL = 'https://mygame25bita-7eqw.onrender.com';
    let currentUser = null;
    
    // دالة للحصول على معرف المستخدم
    async function getCurrentUserId() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ لم يتم العثور على رمز المصادقة');
                return null;
            }
            
            const response = await fetch(`${BACKEND_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                currentUser = await response.json();
                return currentUser.userId || currentUser._id;
            } else {
                throw new Error('فشل في تحميل بيانات المستخدم');
            }
        } catch (error) {
            console.error('خطأ في الحصول على معرف المستخدم:', error);
            return null;
        }
    }
    
    // دالة لعرض معرف المستخدم في الصفحة
    function displayUserId() {
        getCurrentUserId().then(userId => {
            if (userId) {
                // إنشاء عنصر لعرض معرف المستخدم
                let idDisplay = document.getElementById('user-id-helper');
                if (!idDisplay) {
                    idDisplay = document.createElement('div');
                    idDisplay.id = 'user-id-helper';
                    idDisplay.style.cssText = `
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.8);
                        color: #00FF00;
                        padding: 8px 12px;
                        border-radius: 8px;
                        font-family: monospace;
                        font-size: 12px;
                        z-index: 9999;
                        border: 1px solid #00FF00;
                        cursor: pointer;
                        user-select: none;
                        font-weight: bold;
                    `;
                    document.body.appendChild(idDisplay);
                    
                    // إضافة إمكانية النسخ عند النقر
                    idDisplay.addEventListener('click', function() {
                        navigator.clipboard.writeText(userId.toString()).then(() => {
                            const originalText = idDisplay.textContent;
                            idDisplay.textContent = 'تم النسخ! ✓';
                            idDisplay.style.background = 'rgba(0, 255, 0, 0.2)';
                            setTimeout(() => {
                                idDisplay.textContent = originalText;
                                idDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
                            }, 1000);
                        });
                    });
                }
                
                idDisplay.textContent = `ID: ${userId}`;
                idDisplay.title = 'انقر لنسخ معرف المستخدم';
                
                console.log('✅ تم عرض معرف المستخدم:', userId);
            } else {
                console.log('❌ لم يتم العثور على معرف المستخدم');
            }
        });
    }
    
    // دالة لإخفاء معرف المستخدم
    function hideUserId() {
        const idDisplay = document.getElementById('user-id-helper');
        if (idDisplay) {
            idDisplay.remove();
        }
    }
    
    // دالة لتبديل عرض معرف المستخدم
    function toggleUserId() {
        const idDisplay = document.getElementById('user-id-helper');
        if (idDisplay) {
            hideUserId();
        } else {
            displayUserId();
        }
    }
    
    // إضافة الأوامر إلى النافذة العامة
    window.userIdHelper = {
        show: displayUserId,
        hide: hideUserId,
        toggle: toggleUserId,
        get: getCurrentUserId,
        currentUser: () => currentUser
    };
    
    // إضافة اختصار للأوامر
    window.showUserId = displayUserId;
    window.hideUserId = hideUserId;
    window.toggleUserId = toggleUserId;
    window.getUserId = getCurrentUserId;
    
    // عرض معرف المستخدم تلقائياً إذا كان المستخدم مسجل الدخول
    if (localStorage.getItem('token')) {
        // تأخير قليل للتأكد من تحميل الصفحة
        setTimeout(displayUserId, 1000);
    }
    
    console.log('🚀 تم تحميل User ID Helper');
    console.log('💡 الأوامر المتاحة:');
    console.log('   - showUserId() أو userIdHelper.show()');
    console.log('   - hideUserId() أو userIdHelper.hide()');
    console.log('   - toggleUserId() أو userIdHelper.toggle()');
    console.log('   - getUserId() أو userIdHelper.get()');
    
})(); 