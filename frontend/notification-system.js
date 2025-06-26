// نظام الإشعارات المتقدم
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.requestPermission();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
        `;
        document.body.appendChild(this.container);
    }

    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);

        // إضافة تأثير ظهور
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // إزالة تلقائية
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        // إشعار سطح المكتب
        this.showDesktopNotification(message, type);
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            font-size: 14px;
            position: relative;
            overflow: hidden;
        `;

        // إضافة أيقونة
        const icon = document.createElement('span');
        icon.innerHTML = this.getIcon(type);
        icon.style.marginLeft = '10px';
        notification.appendChild(icon);

        // إضافة النص
        const text = document.createElement('span');
        text.textContent = message;
        notification.appendChild(text);

        // زر الإغلاق
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            left: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
        `;
        closeBtn.onclick = () => this.remove(notification);
        notification.appendChild(closeBtn);

        // تأثير التقدم
        const progress = document.createElement('div');
        progress.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255,255,255,0.3);
            width: 100%;
            transform-origin: left;
            animation: progress 5s linear;
        `;
        notification.appendChild(progress);

        return notification;
    }

    getBackgroundColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            win: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            lose: 'linear-gradient(135deg, #f87171, #ef4444)'
        };
        return colors[type] || colors.info;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            win: '🎉',
            lose: '😢'
        };
        return icons[type] || icons.info;
    }

    remove(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    showDesktopNotification(message, type) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('VoiceBoom Game', {
                body: message,
                icon: '/images/logo.png',
                badge: '/images/logo.png',
                tag: 'game-notification'
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    // إشعارات خاصة باللعبة
    showWin(amount) {
        this.show(`🎉 مبروك! ربحت ${amount} عملة!`, 'win', 7000);
    }

    showLose() {
        this.show('😢 حظ أوفر في المرة القادمة!', 'lose', 5000);
    }

    showLevelUp() {
        this.show('⭐ ترقيت! مستوى جديد!', 'success', 6000);
    }

    showNewItem(itemName) {
        this.show(`🎁 حصلت على ${itemName}!`, 'info', 5000);
    }

    showConnectionLost() {
        this.show('📡 انقطع الاتصال. جاري إعادة الاتصال...', 'warning', 8000);
    }
}

// إضافة CSS للتحريكات
const style = document.createElement('style');
style.textContent = `
    @keyframes progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
    }
    
    .game-notification:hover {
        transform: translateX(0) scale(1.02) !important;
    }
`;
document.head.appendChild(style);

// تصدير النظام
window.NotificationSystem = NotificationSystem; 