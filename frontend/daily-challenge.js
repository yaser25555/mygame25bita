// نظام التحدي اليومي
class DailyChallengeSystem {
    constructor() {
        this.challenges = [
            {
                id: 'win_3_games',
                name: 'انتصار ثلاثي',
                description: 'اربح 3 مرات اليوم',
                target: 3,
                type: 'wins',
                reward: 50,
                icon: '🏆'
            },
            {
                id: 'open_20_boxes',
                name: 'فاتح الصناديق',
                description: 'افتح 20 صندوق اليوم',
                target: 20,
                type: 'boxes',
                reward: 30,
                icon: '📦'
            },
            {
                id: 'collect_100_coins',
                name: 'جامع العملات',
                description: 'اجمع 100 عملة اليوم',
                target: 100,
                type: 'coins',
                reward: 40,
                icon: '💰'
            },
            {
                id: 'play_30_minutes',
                name: 'لاعب نشط',
                description: 'العب لمدة 30 دقيقة اليوم',
                target: 1800, // 30 دقيقة بالثواني
                type: 'playtime',
                reward: 60,
                icon: '⏰'
            },
            {
                id: 'win_streak_2',
                name: 'سلسلة انتصارات',
                description: 'اربح مرتين متتاليتين',
                target: 2,
                type: 'streak',
                reward: 35,
                icon: '🔥'
            },
            {
                id: 'use_all_weapons',
                name: 'محارب متعدد',
                description: 'استخدم جميع أنواع الأسلحة',
                target: 3,
                type: 'weapons',
                reward: 45,
                icon: '⚔️'
            }
        ];
        
        this.currentChallenges = [];
        this.progress = {};
        this.lastResetDate = null;
        this.init();
    }

    init() {
        this.loadProgress();
        this.checkDailyReset();
        this.generateDailyChallenges();
        this.startTracking();
    }

    loadProgress() {
        const saved = localStorage.getItem('dailyChallengeProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.progress = data.progress || {};
            this.lastResetDate = data.lastResetDate;
            this.currentChallenges = data.currentChallenges || [];
        }
    }

    saveProgress() {
        localStorage.setItem('dailyChallengeProgress', JSON.stringify({
            progress: this.progress,
            lastResetDate: this.lastResetDate,
            currentChallenges: this.currentChallenges
        }));
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
            this.resetDailyProgress();
            this.lastResetDate = today;
        }
    }

    resetDailyProgress() {
        this.progress = {};
        this.currentChallenges = [];
        this.generateDailyChallenges();
        this.saveProgress();
    }

    generateDailyChallenges() {
        // اختيار 3 تحديات عشوائية
        const shuffled = [...this.challenges].sort(() => 0.5 - Math.random());
        this.currentChallenges = shuffled.slice(0, 3);
        
        // تهيئة التقدم لكل تحدي
        this.currentChallenges.forEach(challenge => {
            if (!this.progress[challenge.id]) {
                this.progress[challenge.id] = {
                    current: 0,
                    completed: false,
                    claimed: false
                };
            }
        });
    }

    startTracking() {
        // تتبع التقدم كل 5 ثواني
        setInterval(() => {
            this.updatePlayTimeProgress();
        }, 5000);
    }

    updateProgress(type, amount = 1) {
        let updated = false;
        
        this.currentChallenges.forEach(challenge => {
            if (challenge.type === type && !this.progress[challenge.id].completed) {
                this.progress[challenge.id].current += amount;
                
                if (this.progress[challenge.id].current >= challenge.target) {
                    this.progress[challenge.id].completed = true;
                    this.showChallengeCompleted(challenge);
                }
                updated = true;
            }
        });

        if (updated) {
            this.saveProgress();
        }
    }

    updatePlayTimeProgress() {
        // تحديث وقت اللعب (يتم استدعاؤه من النظام الرئيسي)
        const playTime = this.getCurrentPlayTime();
        this.updateProgress('playtime', playTime);
    }

    getCurrentPlayTime() {
        // يجب أن يتم استدعاؤها من النظام الرئيسي
        return 0; // placeholder
    }

    showChallengeCompleted(challenge) {
        if (window.NotificationSystem) {
            window.NotificationSystem.show(
                `🎯 تحدي مكتمل: ${challenge.name}\nالمكافأة: ${challenge.reward} عملة`,
                'success',
                8000
            );
        }
    }

    claimReward(challengeId) {
        const challenge = this.currentChallenges.find(c => c.id === challengeId);
        const progress = this.progress[challengeId];
        
        if (challenge && progress && progress.completed && !progress.claimed) {
            progress.claimed = true;
            this.saveProgress();
            
            // إضافة المكافأة للمستخدم
            this.addRewardToUser(challenge.reward);
            
            if (window.NotificationSystem) {
                window.NotificationSystem.show(
                    `💰 تم استلام المكافأة: ${challenge.reward} عملة`,
                    'success',
                    5000
                );
            }
            
            return true;
        }
        return false;
    }

    addRewardToUser(amount) {
        // إضافة العملات للمستخدم - يجب ربطها بالنظام الرئيسي
        if (window.gameData && window.gameData.balance !== undefined) {
            window.gameData.balance += amount;
            // تحديث العرض
            this.updateBalanceDisplay();
        }
    }

    updateBalanceDisplay() {
        const balanceDisplay = document.getElementById('balance-display');
        if (balanceDisplay && window.gameData) {
            balanceDisplay.textContent = window.gameData.balance;
        }
    }

    // إنشاء واجهة التحديات
    createChallengeUI() {
        const container = document.createElement('div');
        container.className = 'daily-challenges-container';
        container.innerHTML = `
            <div class="challenges-header">
                <h3>🎯 التحديات اليومية</h3>
                <div class="challenges-timer" id="challengesTimer"></div>
            </div>
            <div class="challenges-list">
                ${this.currentChallenges.map(challenge => {
                    const progress = this.progress[challenge.id];
                    const percentage = Math.min((progress.current / challenge.target) * 100, 100);
                    const isCompleted = progress.completed;
                    const isClaimed = progress.claimed;
                    
                    return `
                        <div class="challenge-item ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}">
                            <div class="challenge-icon">${challenge.icon}</div>
                            <div class="challenge-content">
                                <div class="challenge-name">${challenge.name}</div>
                                <div class="challenge-desc">${challenge.description}</div>
                                <div class="challenge-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="progress-text">${progress.current}/${challenge.target}</span>
                                </div>
                            </div>
                            <div class="challenge-reward">
                                <span class="reward-amount">${challenge.reward}</span>
                                <span class="reward-icon">💰</span>
                                ${isCompleted && !isClaimed ? 
                                    `<button onclick="dailyChallengeSystem.claimReward('${challenge.id}')" class="claim-btn">استلام</button>` : 
                                    isClaimed ? '<span class="claimed-text">تم الاستلام</span>' : ''
                                }
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // إضافة CSS
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
        `;

        return container;
    }

    showChallengeUI() {
        const ui = this.createChallengeUI();
        document.body.appendChild(ui);
        
        // إضافة زر الإغلاق
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        `;
        closeBtn.onclick = () => ui.remove();
        ui.appendChild(closeBtn);
        
        // تحديث العداد
        this.updateTimer();
    }

    updateTimer() {
        const timerElement = document.getElementById('challengesTimer');
        if (timerElement) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const timeLeft = tomorrow - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            timerElement.textContent = `⏰ متبقي: ${hours}س ${minutes}د`;
        }
    }

    // طرق مساعدة للربط مع النظام الرئيسي
    recordWin() {
        this.updateProgress('wins');
    }

    recordBoxOpen() {
        this.updateProgress('boxes');
    }

    recordCoinsEarned(amount) {
        this.updateProgress('coins', amount);
    }

    recordWeaponUse(weaponType) {
        this.updateProgress('weapons');
    }

    recordWinStreak(streak) {
        if (streak >= 2) {
            this.updateProgress('streak');
        }
    }
}

// إضافة CSS للتحديات
const challengeStyle = document.createElement('style');
challengeStyle.textContent = `
    .daily-challenges-container {
        direction: rtl;
    }
    
    .challenges-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
    }
    
    .challenges-timer {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
    }
    
    .challenge-item {
        display: flex;
        align-items: center;
        padding: 15px;
        margin-bottom: 10px;
        border: 2px solid #eee;
        border-radius: 10px;
        transition: all 0.3s ease;
    }
    
    .challenge-item.completed {
        border-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    }
    
    .challenge-item.claimed {
        opacity: 0.6;
        background: #f3f4f6;
    }
    
    .challenge-icon {
        font-size: 32px;
        margin-left: 15px;
    }
    
    .challenge-content {
        flex: 1;
    }
    
    .challenge-name {
        font-weight: bold;
        margin-bottom: 5px;
        color: #1f2937;
    }
    
    .challenge-desc {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 10px;
    }
    
    .challenge-progress {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .progress-bar {
        flex: 1;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, #10b981, #059669);
        transition: width 0.3s ease;
    }
    
    .progress-text {
        font-size: 12px;
        color: #6b7280;
        min-width: 50px;
    }
    
    .challenge-reward {
        text-align: center;
        margin-right: 15px;
    }
    
    .reward-amount {
        font-size: 18px;
        font-weight: bold;
        color: #f59e0b;
    }
    
    .reward-icon {
        font-size: 20px;
        margin-right: 5px;
    }
    
    .claim-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 5px;
        transition: all 0.3s ease;
    }
    
    .claim-btn:hover {
        transform: scale(1.05);
    }
    
    .claimed-text {
        color: #10b981;
        font-size: 12px;
        font-weight: bold;
    }
`;
document.head.appendChild(challengeStyle);

// تصدير النظام
window.DailyChallengeSystem = DailyChallengeSystem; 