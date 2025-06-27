const axios = require('axios');

const BACKEND_URL = 'https://mygame25bita-1-4ue6.onrender.com';

// بيانات المشرف للاختبار
const adminCredentials = {
    username: 'admin',
    password: 'admin123'
};

// بيانات المستخدم للاختبار
const testUserData = {
    username: 'testuser_images',
    email: 'testuser_images@example.com',
    password: 'testpass123'
};

let adminToken = '';
let testUserId = '';

async function testAdminUserImages() {
    console.log('🧪 بدء اختبار إدارة صور المستخدمين للمشرفين...\n');

    try {
        // 1. تسجيل دخول المشرف
        console.log('1️⃣ تسجيل دخول المشرف...');
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, adminCredentials);
        adminToken = loginResponse.data.token;
        console.log('✅ تم تسجيل دخول المشرف بنجاح\n');

        // 2. إنشاء مستخدم اختبار
        console.log('2️⃣ إنشاء مستخدم اختبار...');
        const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, testUserData);
        testUserId = registerResponse.data.user._id;
        console.log(`✅ تم إنشاء المستخدم: ${testUserData.username} (ID: ${testUserId})\n`);

        // 3. اختبار جلب معلومات صور المستخدم
        console.log('3️⃣ اختبار جلب معلومات صور المستخدم...');
        const imagesInfoResponse = await axios.get(`${BACKEND_URL}/api/users/admin/user-images/${testUserId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ معلومات صور المستخدم:', imagesInfoResponse.data);
        console.log('');

        // 4. اختبار مسح الصورة الشخصية
        console.log('4️⃣ اختبار مسح الصورة الشخصية...');
        const removeAvatarResponse = await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
            targetUserId: testUserId,
            action: 'remove_avatar'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ تم مسح الصورة الشخصية:', removeAvatarResponse.data);
        console.log('');

        // 5. اختبار مسح صورة البروفايل
        console.log('5️⃣ اختبار مسح صورة البروفايل...');
        const removeProfileResponse = await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
            targetUserId: testUserId,
            action: 'remove_profile_image'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ تم مسح صورة البروفايل:', removeProfileResponse.data);
        console.log('');

        // 6. اختبار مسح صورة الغلاف
        console.log('6️⃣ اختبار مسح صورة الغلاف...');
        const removeCoverResponse = await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
            targetUserId: testUserId,
            action: 'remove_cover_image'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ تم مسح صورة الغلاف:', removeCoverResponse.data);
        console.log('');

        // 7. اختبار تغيير الصورة الشخصية (مع بيانات صورة وهمية)
        console.log('7️⃣ اختبار تغيير الصورة الشخصية...');
        const fakeImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const changeAvatarResponse = await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
            targetUserId: testUserId,
            action: 'change_avatar',
            imageData: fakeImageData,
            imageType: 'png'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ تم تغيير الصورة الشخصية:', changeAvatarResponse.data);
        console.log('');

        // 8. اختبار تغيير صورة البروفايل
        console.log('8️⃣ اختبار تغيير صورة البروفايل...');
        const changeProfileResponse = await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
            targetUserId: testUserId,
            action: 'change_profile_image',
            imageData: fakeImageData,
            imageType: 'png'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ تم تغيير صورة البروفايل:', changeProfileResponse.data);
        console.log('');

        // 9. اختبار تغيير صورة الغلاف
        console.log('9️⃣ اختبار تغيير صورة الغلاف...');
        const changeCoverResponse = await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
            targetUserId: testUserId,
            action: 'change_cover_image',
            imageData: fakeImageData,
            imageType: 'png'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ تم تغيير صورة الغلاف:', changeCoverResponse.data);
        console.log('');

        // 10. اختبار جلب معلومات الصور المحدثة
        console.log('🔟 اختبار جلب معلومات الصور المحدثة...');
        const updatedImagesResponse = await axios.get(`${BACKEND_URL}/api/users/admin/user-images/${testUserId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ معلومات الصور المحدثة:', updatedImagesResponse.data);
        console.log('');

        // 11. اختبار الأخطاء - إجراء غير صحيح
        console.log('1️⃣1️⃣ اختبار الأخطاء - إجراء غير صحيح...');
        try {
            await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
                targetUserId: testUserId,
                action: 'invalid_action'
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        } catch (error) {
            console.log('✅ تم رفض الإجراء غير الصحيح:', error.response.data.error);
        }
        console.log('');

        // 12. اختبار الأخطاء - مستخدم غير موجود
        console.log('1️⃣2️⃣ اختبار الأخطاء - مستخدم غير موجود...');
        try {
            await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
                targetUserId: '507f1f77bcf86cd799439011',
                action: 'remove_avatar'
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        } catch (error) {
            console.log('✅ تم رفض المستخدم غير الموجود:', error.response.data.error);
        }
        console.log('');

        // 13. اختبار الأخطاء - تغيير صورة بدون بيانات
        console.log('1️⃣3️⃣ اختبار الأخطاء - تغيير صورة بدون بيانات...');
        try {
            await axios.put(`${BACKEND_URL}/api/users/admin/manage-user-image`, {
                targetUserId: testUserId,
                action: 'change_avatar'
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        } catch (error) {
            console.log('✅ تم رفض تغيير الصورة بدون بيانات:', error.response.data.error);
        }
        console.log('');

        console.log('🎉 تم إكمال جميع اختبارات إدارة صور المستخدمين بنجاح!');

    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
    }
}

// تشغيل الاختبار
testAdminUserImages(); 