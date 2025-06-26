// نظام الإحصائيات المتقدم
class StatisticsSystem {
    constructor() {
        this.stats = {
            gamesPlayed: 0,
            totalWins: 0,
            totalLosses: 0,
            totalCoinsEarned: 0,
            totalCoinsSpent: 0,
            boxesOpened: 0,
            itemsCollected: {},
            winStreak: 0,
            maxWinStreak: 0,
            averageWinRate: 0,
            playTime: 0,
            lastPlayDate: null,
            achievements: []
        };
        this.startTime = Date.now();
        this.init();
    }

    init() {
        this.loadStats();
        this.startTracking();
        this.setupAchievements();
    }

    loadStats() {
        const savedStats = localStorage.getItem('gameStats');
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
    }

    saveStats() {
        localStorage.setItem('gameStats', JSON.stringify(this.stats));
    }

    startTracking() {
        // تتبع وقت اللعب
        setInterval(() => {
            this.stats.playTime += 1;
            this.saveStats();
        }, 1000);

        // حفظ الإحصائيات كل دقيقة
        setInterval(() => {
            this.saveStats();
        }, 60000);
    }

    recordGameResult(won, coinsEarned, coinsSpent, boxesOpened) {
        this.stats.gamesPlayed++;
        this.stats.boxesOpened += boxesOpened;
        this.stats.totalCoinsEarned += coinsEarned;
        this.stats.totalCoinsSpent += coinsSpent;
        this.stats.lastPlayDate = new Date().toISOString();

        if (won) {
            this.stats.totalWins++;
            this.stats.winStreak++;
            if (this.stats.winStreak > this.stats.maxWinStreak) {
                this.stats.maxWinStreak = this.stats.winStreak;
            }
        } else {
            this.stats.totalLosses++;
            this.stats.winStreak = 0;
        }

        this.stats.averageWinRate = (this.stats.totalWins / this.stats.gamesPlayed) * 100;
        this.checkAchievements();
        this.saveStats();
    }

    recordItemCollected(itemName, quantity = 1) {
        if (!this.stats.itemsCollected[itemName]) {
            this.stats.itemsCollected[itemName] = 0;
        }
        this.stats.itemsCollected[itemName] += quantity;
        this.saveStats();
    }

    setupAchievements() {
        this.achievements = [
            {
                id: 'first_win',
                name: 'الفوز الأول',
                description: 'اربح أول لعبة',
                condition: () => this.stats.totalWins >= 1,
                icon: '🏆'
            },
            {
                id: 'win_streak_5',
                name: 'سلسلة انتصارات',
                description: 'اربح 5 مرات متتالية',
                condition: () => this.stats.maxWinStreak >= 5,
                icon: '🔥'
            },
            {
                id: 'box_opener',
                name: 'فاتح الصناديق',
                description: 'افتح 100 صندوق',
                condition: () => this.stats.boxesOpened >= 100,
                icon: '📦'
            },
            {
                id: 'coin_collector',
                name: 'جامع العملات',
                description: 'اجمع 1000 عملة',
                condition: () => this.stats.totalCoinsEarned >= 1000,
                icon: '💰'
            },
            {
                id: 'dedicated_player',
                name: 'لاعب مخلص',
                description: 'العب لمدة ساعة كاملة',
                condition: () => this.stats.playTime >= 3600,
                icon: '⏰'
            },
            {
                id: 'lucky_player',
                name: 'لاعب محظوظ',
                description: 'احصل على نسبة فوز 70% أو أكثر',
                condition: () => this.stats.averageWinRate >= 70,
                icon: '🍀'
            }
        ];
    }

    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (achievement.condition() && !this.stats.achievements.includes(achievement.id)) {
                this.stats.achievements.push(achievement.id);
                this.showAchievementNotification(achievement);
            }
        });
    }

    showAchievementNotification(achievement) {
        if (window.NotificationSystem) {
            window.NotificationSystem.show(
                `🏆 إنجاز جديد: ${achievement.name}\n${achievement.description}`,
                'success',
                8000
            );
        }
    }

    getStats() {
        return {
            ...this.stats,
            currentWinRate: this.stats.gamesPlayed > 0 ? 
                ((this.stats.totalWins / this.stats.gamesPlayed) * 100).toFixed(1) : 0,
            playTimeFormatted: this.formatPlayTime(this.stats.playTime),
            profitLoss: this.stats.totalCoinsEarned - this.stats.totalCoinsSpent
        };
    }

    formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}س ${minutes}د ${secs}ث`;
        } else if (minutes > 0) {
            return `${minutes}د ${secs}ث`;
        } else {
            return `${secs}ث`;
        }
    }

    // إنشاء تقرير إحصائيات بصري
    createStatsReport() {
        const stats = this.getStats();
        const report = document.createElement('div');
        report.className = 'stats-report';
        report.innerHTML = `
            <div class="stats-header">
                <h3>📊 تقرير الإحصائيات</h3>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">×</button>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-value">${stats.gamesPlayed}</div>
                    <div class="stat-label">المرات التي لعبت</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-value">${stats.totalWins}</div>
                    <div class="stat-label">الانتصارات</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-value">${stats.currentWinRate}%</div>
                    <div class="stat-label">نسبة الفوز</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${stats.maxWinStreak}</div>
                    <div class="stat-label">أطول سلسلة انتصارات</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value">${stats.totalCoinsEarned}</div>
                    <div class="stat-label">العملات المكتسبة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏰</div>
                    <div class="stat-value">${stats.playTimeFormatted}</div>
                    <div class="stat-label">وقت اللعب</div>
                </div>
            </div>
            <div class="achievements-section">
                <h4>🏆 الإنجازات (${stats.achievements.length}/${this.achievements.length})</h4>
                <div class="achievements-grid">
                    ${this.achievements.map(achievement => `
                        <div class="achievement ${stats.achievements.includes(achievement.id) ? 'unlocked' : 'locked'}">
                            <span class="achievement-icon">${achievement.icon}</span>
                            <div class="achievement-info">
                                <div class="achievement-name">${achievement.name}</div>
                                <div class="achievement-desc">${achievement.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // إضافة CSS
        report.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            font-family: 'Cairo', sans-serif;
        `;

        return report;
    }

    showStatsReport() {
        const report = this.createStatsReport();
        document.body.appendChild(report);
    }
}

// إضافة CSS للإحصائيات
const statsStyle = document.createElement('style');
statsStyle.textContent = `
    .stats-report {
        direction: rtl;
    }
    
    .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .stat-icon {
        font-size: 24px;
        margin-bottom: 5px;
    }
    
    .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .stat-label {
        font-size: 12px;
        opacity: 0.9;
    }
    
    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 10px;
    }
    
    .achievement {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 8px;
        border: 2px solid #eee;
    }
    
    .achievement.unlocked {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-color: #10b981;
    }
    
    .achievement.locked {
        background: #f3f4f6;
        color: #6b7280;
        opacity: 0.6;
    }
    
    .achievement-icon {
        font-size: 24px;
        margin-left: 10px;
    }
    
    .achievement-name {
        font-weight: bold;
        margin-bottom: 2px;
    }
    
    .achievement-desc {
        font-size: 12px;
        opacity: 0.8;
    }
`;
document.head.appendChild(statsStyle);

// تصدير النظام
window.StatisticsSystem = StatisticsSystem; 