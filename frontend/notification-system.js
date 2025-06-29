// نظام الإشعارات المتقدم للعبة
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.isEnabled = this.checkNotificationPermission();
        this.init();
    }

    async init() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.isEnabled = permission === 'granted';
        }
        this.createNotificationContainer();
    }

    checkNotificationPermission() {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
        `;
        document.body.appendChild(container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotificationElement(message, type);
        this.addToContainer(notification);
        
        // إشعار المتصفح
        if (this.isEnabled && type === 'important') {
            new Notification('لعبة الصندوق السحري', {
                body: message,
                icon: '/images/logo.png'
            });
        }

        // إزالة تلقائية
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-family: 'Cairo', 'Noto Naskh Arabic', sans-serif;
            font-size: 14px;
            position: relative;
            overflow: hidden;
        `;

        // إضافة أيقونة حسب النوع
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${icon}</span>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
            ">×</button>
        `;

        // تأثير الدخول
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        return notification;
    }

    getBackgroundColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            important: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
        };
        return colors[type] || colors.info;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            important: '🎉'
        };
        return icons[type] || icons.info;
    }

    addToContainer(notification) {
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
        }
    }

    removeNotification(notification) {
        if (notification && notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }

    // إشعارات خاصة باللعبة
    showWinNotification(amount) {
        this.show(`🎉 مبروك! فزت بـ ${amount} نقطة!`, 'success');
    }

    showLossNotification() {
        this.show('😢 للأسف خسرت هذه المرة، جرب مرة أخرى!', 'warning');
    }

    showItemCollectedNotification(itemName) {
        this.show(`🎯 تم جمع ${itemName}!`, 'info');
    }

    showLevelUpNotification() {
        this.show('⭐ ترقيت إلى مستوى جديد!', 'important');
    }

    showChatNotification(sender, message) {
        this.show(`💬 ${sender}: ${message}`, 'info', 3000);
    }
}

// تصدير النظام للاستخدام العام
window.NotificationSystem = NotificationSystem; 