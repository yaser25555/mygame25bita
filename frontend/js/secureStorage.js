/**
 * وحدة التخزين الآمن
 * توفر طبقة آمنة لتخزين البيانات في localStorage مع تشفير بسيط
 */

const secureStorage = (function() {
    const PREFIX = 'secure_';
    
    // دالة التشفير البسيط
    const encrypt = (data) => {
        try {
            // تحويل البيانات إلى JSON ثم تشفيرها باستخدام base64
            return btoa(encodeURIComponent(JSON.stringify(data)));
        } catch (error) {
            console.error('خطأ في تشفير البيانات:', error);
            return null;
        }
    };

    // دالة فك التشفير
    const decrypt = (data) => {
        try {
            // فك تشفير base64 ثم تحويل JSON إلى كائن
            return JSON.parse(decodeURIComponent(atob(data)));
        } catch (error) {
            console.error('خطأ في فك تشفير البيانات:', error);
            return null;
        }
    };

    return {
        /**
         * حفظ البيانات بشكل آمن
         * @param {string} key - مفتاح التخزين
         * @param {any} value - القيمة المراد تخزينها
         * @returns {boolean} - نجاح أو فشل العملية
         */
        set: (key, value) => {
            try {
                const encrypted = encrypt(value);
                if (encrypted === null) return false;
                
                localStorage.setItem(PREFIX + key, encrypted);
                return true;
            } catch (error) {
                console.error('فشل في حفظ البيانات:', error);
                return false;
            }
        },

        /**
         * استرجاع البيانات المخزنة
         * @param {string} key - مفتاح التخزين
         * @returns {any|null} - البيانات المسترجعة أو null في حالة الفشل
         */
        get: (key) => {
            try {
                const data = localStorage.getItem(PREFIX + key);
                return data ? decrypt(data) : null;
            } catch (error) {
                console.error('فشل في قراءة البيانات:', error);
                return null;
            }
        },

        /**
         * حذف بيانات محددة
         * @param {string} key - مفتاح التخزين
         */
        remove: (key) => {
            try {
                localStorage.removeItem(PREFIX + key);
            } catch (error) {
                console.error('فشل في حذف البيانات:', error);
            }
        },

        /**
         * مسح جميع البيانات المخزنة من قبل هذه المكتبة
         */
        clear: () => {
            try {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(PREFIX))
                    .forEach(key => localStorage.removeItem(key));
            } catch (error) {
                console.error('فشل في مسح البيانات:', error);
            }
        }
    };
})();

// تصدير الوحدة للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = secureStorage;
} else {
    window.secureStorage = secureStorage;
}
