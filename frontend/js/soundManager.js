/**
 * مدير الأصوات
 * يدعم التحميل الكسول للأصوات وإدارتها بكفاءة
 */

class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.muted = false;
        this.volume = 1.0;
        this.initialize();
    }

    /**
     * تهيئة المدير
     */
    initialize() {
        // تحميل إعدادات الصوت المحفوظة
        this.muted = localStorage.getItem('soundMuted') === 'true';
        const savedVolume = parseFloat(localStorage.getItem('soundVolume'));
        this.volume = isNaN(savedVolume) ? 1.0 : Math.min(1, Math.max(0, savedVolume));
    }

    /**
     * تحميل صوت (بشكل كسول)
     * @param {string} name - اسم الصوت
     * @param {string} path - مسار ملف الصوت
     * @returns {Promise<HTMLAudioElement>} - وعد يحمل عنصر الصوت
     */
    load(name, path) {
        return new Promise((resolve, reject) => {
            // إذا كان الصوت محملاً مسبقاً
            if (this.sounds.has(name)) {
                resolve(this.sounds.get(name));
                return;
            }

            const audio = new Audio(path);
            audio.volume = this.volume;
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds.set(name, audio);
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', (error) => {
                console.error(`فشل تحميل الصوت ${name}:`, error);
                reject(error);
            }, { once: true });

            // بدء التحميل
            audio.load();
        });
    }

    /**
     * تشغيل صوت
     * @param {string} name - اسم الصوت
     * @param {number} [volume] - مستوى الصوت (اختياري)
     * @returns {Promise<void>}
     */
    async play(name, volume) {
        if (this.muted) return;
        
        try {
            let audio = this.sounds.get(name);
            
            // إذا لم يكن الصوت محملاً، نحاول تحميله
            if (!audio) {
                audio = await this.load(name, `sounds/${name}.mp3`);
            }

            // إعادة تعيين الصوت إذا كان مشغلاً بالفعل
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }

            // ضبط مستوى الصوت إذا تم تحديده
            if (volume !== undefined) {
                audio.volume = Math.min(1, Math.max(0, volume));
            } else {
                audio.volume = this.volume;
            }

            await audio.play().catch(error => {
                console.error(`فشل تشغيل الصوت ${name}:`, error);
            });
        } catch (error) {
            console.error(`خطأ في تشغيل الصوت ${name}:`, error);
        }
    }

    /**
     * إيقاف صوت معين
     * @param {string} name - اسم الصوت
     */
    stop(name) {
        const audio = this.sounds.get(name);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    /**
     * كتم/إلغاء كتم الأصوات
     * @param {boolean} [muted] - حالة الكتم (اختياري)
     */
    toggleMute(muted = !this.muted) {
        this.muted = muted;
        localStorage.setItem('soundMuted', this.muted);
        
        // تطبيق حالة الكتم على جميع الأصوات
        this.sounds.forEach(audio => {
            audio.muted = this.muted;
        });
    }

    /**
     * ضبط مستوى الصوت
     * @param {number} volume - مستوى الصوت (من 0 إلى 1)
     */
    setVolume(volume) {
        this.volume = Math.min(1, Math.max(0, volume));
        localStorage.setItem('soundVolume', this.volume);
        
        // تطبيق مستوى الصوت على جميع الأصوات
        this.sounds.forEach(audio => {
            audio.volume = this.volume;
        });
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.sounds.forEach(audio => {
            audio.pause();
            audio.src = '';
            audio.load();
        });
        this.sounds.clear();
    }
}

// إنشاء نسخة وحيدة (Singleton) من مدير الأصوات
const soundManager = new SoundManager();

// تصدير المدير للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = soundManager;
} else {
    window.soundManager = soundManager;
}
