// نظام الإنجازات والتحديات
class AchievementSystem {
    constructor() {
        this.achievements = this.initializeAchievements();
        this.userAchievements = this.loadUserAchievements();
        this.notificationSystem = window.NotificationSystem;
    }

    initializeAchievements() {
        return {
            // إنجازات الصناديق
            firstBox: {
                id: 'firstBox',
                title: 'مستكشف الصناديق',
                description: 'افتح أول صندوق',
                icon: '📦',
                reward: 50,
                condition: (stats) => stats.boxesOpened >= 1,
                unlocked: false
            },
            boxMaster: {
                id: 'boxMaster',
                title: 'سيد الصناديق',
                description: 'افتح 100 صندوق',
                icon: '👑',
                reward: 500,
                condition: (stats) => stats.boxesOpened >= 100,
                unlocked: false
            },
            boxLegend: {
                id: 'boxLegend',
                title: 'أسطورة الصناديق',
                description: 'افتح 1000 صندوق',
                icon: '🏆',
                reward: 2000,
                condition: (stats) => stats.boxesOpened >= 1000,
                unlocked: false
            },

            // إنجازات العناصر
            gemCollector: {
                id: 'gemCollector',
                title: 'جامع الجواهر',
                description: 'اجمع 10 جواهر',
                icon: '💎',
                reward: 100,
                condition: (stats) => stats.itemsCollected?.gem >= 10,
                unlocked: false
            },
            pearlHunter: {
                id: 'pearlHunter',
                title: 'صياد اللآلئ',
                description: 'اجمع 5 لآلئ',
                icon: '🦪',
                reward: 300,
                condition: (stats) => stats.itemsCollected?.pearl >= 5,
                unlocked: false
            },
            keyMaster: {
                id: 'keyMaster',
                title: 'سيد المفاتيح',
                description: 'اجمع 20 مفتاح',
                icon: '🔑',
                reward: 150,
                condition: (stats) => stats.itemsCollected?.key >= 20,
                unlocked: false
            },

            // إنجازات النقاط
            richPlayer: {
                id: 'richPlayer',
                title: 'اللاعب الثري',
                description: 'احصل على 10,000 نقطة',
                icon: '💰',
                reward: 1000,
                condition: (stats) => stats.score >= 10000,
                unlocked: false
            },
            millionaire: {
                id: 'millionaire',
                title: 'المليونير',
                description: 'احصل على 100,000 نقطة',
                icon: '💵',
                reward: 5000,
                condition: (stats) => stats.score >= 100000,
                unlocked: false
            },

            // إنجازات الضربات
            sharpshooter: {
                id: 'sharpshooter',
                title: 'القناص الماهر',
                description: 'استخدم 50 ضربة فردية',
                icon: '🎯',
                reward: 200,
                condition: (stats) => stats.singleShotsUsed >= 50,
                unlocked: false
            },
            tripleMaster: {
                id: 'tripleMaster',
                title: 'سيد الضربات الثلاثية',
                description: 'استخدم 30 ضربة ثلاثية',
                icon: '🎯🎯🎯',
                reward: 300,
                condition: (stats) => stats.tripleShotsUsed >= 30,
                unlocked: false
            },
            hammerKing: {
                id: 'hammerKing',
                title: 'ملك المطرقة',
                description: 'استخدم 20 ضربة مطرقة',
                icon: '🔨',
                reward: 400,
                condition: (stats) => stats.hammerShotsUsed >= 20,
                unlocked: false
            },

            // إنجازات خاصة
            luckyStreak: {
                id: 'luckyStreak',
                title: 'سلسلة الحظ',
                description: 'افتح 5 صناديق متتالية بنجاح',
                icon: '🍀',
                reward: 250,
                condition: (stats) => stats.consecutiveWins >= 5,
                unlocked: false
            },
            socialButterfly: {
                id: 'socialButterfly',
                title: 'الفراشة الاجتماعية',
                description: 'أرسل 50 رسالة في المحادثة',
                icon: '🦋',
                reward: 100,
                condition: (stats) => stats.messagesSent >= 50,
                unlocked: false
            },
            dailyPlayer: {
                id: 'dailyPlayer',
                title: 'اللاعب اليومي',
                description: 'العب 7 أيام متتالية',
                icon: '📅',
                reward: 500,
                condition: (stats) => stats.consecutiveDays >= 7,
                unlocked: false
            }
        };
    }

    loadUserAchievements() {
        const saved = localStorage.getItem('userAchievements');
        return saved ? JSON.parse(saved) : {};
    }

    saveUserAchievements() {
        localStorage.setItem('userAchievements', JSON.stringify(this.userAchievements));
    }

    checkAchievements(userStats) {
        const newlyUnlocked = [];

        Object.values(this.achievements).forEach(achievement => {
            if (!this.userAchievements[achievement.id] && achievement.condition(userStats)) {
                this.userAchievements[achievement.id] = {
                    unlockedAt: new Date().toISOString(),
                    reward: achievement.reward
                };
                newlyUnlocked.push(achievement);
            }
        });

        if (newlyUnlocked.length > 0) {
            this.saveUserAchievements();
            this.showAchievementUnlocked(newlyUnlocked);
        }

        return newlyUnlocked;
    }

    showAchievementUnlocked(achievements) {
        achievements.forEach(achievement => {
            // إشعار في اللعبة
            if (this.notificationSystem) {
                this.notificationSystem.show(
                    `🏆 إنجاز جديد: ${achievement.title}!\n${achievement.description}\nالمكافأة: ${achievement.reward} نقطة`,
                    'important',
                    8000
                );
            }

            // عرض تفصيلي للإنجاز
            this.showAchievementModal(achievement);
        });
    }

    showAchievementModal(achievement) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                color: white;
                max-width: 400px;
                animation: slideIn 0.5s ease;
                font-family: 'Cairo', 'Noto Naskh Arabic', sans-serif;
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">${achievement.icon}</div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">🏆 إنجاز جديد!</h2>
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">${achievement.title}</h3>
                <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">${achievement.description}</p>
                <div style="
                    background: rgba(255,255,255,0.2);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                ">
                    <span style="font-size: 18px;">💰 المكافأة: ${achievement.reward} نقطة</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: 2px solid white;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    رائع! 🎉
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // إزالة تلقائية بعد 5 ثوان
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 5000);
    }

    getAchievementProgress(userStats) {
        const progress = {};
        
        Object.values(this.achievements).forEach(achievement => {
            if (this.userAchievements[achievement.id]) {
                progress[achievement.id] = {
                    ...achievement,
                    unlocked: true,
                    unlockedAt: this.userAchievements[achievement.id].unlockedAt
                };
            } else {
                progress[achievement.id] = {
                    ...achievement,
                    unlocked: false,
                    progress: this.calculateProgress(achievement, userStats)
                };
            }
        });

        return progress;
    }

    calculateProgress(achievement, userStats) {
        // حساب التقدم للإنجازات المختلفة
        switch (achievement.id) {
            case 'firstBox':
                return Math.min(userStats.boxesOpened || 0, 1);
            case 'boxMaster':
                return Math.min((userStats.boxesOpened || 0) / 100, 1);
            case 'boxLegend':
                return Math.min((userStats.boxesOpened || 0) / 1000, 1);
            case 'gemCollector':
                return Math.min((userStats.itemsCollected?.gem || 0) / 10, 1);
            case 'pearlHunter':
                return Math.min((userStats.itemsCollected?.pearl || 0) / 5, 1);
            case 'keyMaster':
                return Math.min((userStats.itemsCollected?.key || 0) / 20, 1);
            case 'richPlayer':
                return Math.min((userStats.score || 0) / 10000, 1);
            case 'millionaire':
                return Math.min((userStats.score || 0) / 100000, 1);
            case 'sharpshooter':
                return Math.min((userStats.singleShotsUsed || 0) / 50, 1);
            case 'tripleMaster':
                return Math.min((userStats.tripleShotsUsed || 0) / 30, 1);
            case 'hammerKing':
                return Math.min((userStats.hammerShotsUsed || 0) / 20, 1);
            default:
                return 0;
        }
    }

    getTotalRewards() {
        return Object.values(this.userAchievements).reduce((total, achievement) => {
            return total + achievement.reward;
        }, 0);
    }

    getUnlockedCount() {
        return Object.keys(this.userAchievements).length;
    }

    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
}

// تصدير النظام للاستخدام العام
window.AchievementSystem = AchievementSystem; 