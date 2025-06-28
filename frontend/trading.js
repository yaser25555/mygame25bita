// استخدام ملف التكوين المركزي
const BACKEND_URL = CONFIG.BACKEND_URL;

// Trading System JavaScript
class TradingSystem {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'create';
        this.tradeModal = null;
        this.notificationContainer = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Trading System...');
        
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            this.showNotification('يجب تسجيل الدخول أولاً', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        // Initialize UI elements
        this.initializeElements();
        
        // Load user data
        await this.loadUserData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Setup exit warning
        this.setupExitWarning();
        
        console.log('Trading System initialized successfully');
    }
    
    initializeElements() {
        this.tradeModal = document.getElementById('tradeModal');
        this.notificationContainer = document.getElementById('notificationContainer');
        
        // Initialize modal elements
        this.modalTitle = document.getElementById('modalTitle');
        this.modalContent = document.getElementById('modalContent');
        this.modalAccept = document.getElementById('modalAccept');
        this.modalReject = document.getElementById('modalReject');
        this.modalCancel = document.getElementById('modalCancel');
        this.modalClose = document.getElementById('modalClose');
    }
    
    async loadUserData() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                document.getElementById('userDisplayName').textContent = 
                    userData.profile?.displayName || userData.username;
            } else {
                throw new Error('Failed to load user data');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('خطأ في تحميل بيانات المستخدم', 'error');
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Back to game button
        document.getElementById('backToGame').addEventListener('click', () => {
            window.location.href = 'game.html';
        });
        
        // Create trade form
        document.getElementById('createTrade').addEventListener('click', () => {
            this.createTrade();
        });
        
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearTradeForm();
        });
        
        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Modal events
        this.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.modalAccept.addEventListener('click', () => {
            this.acceptTrade();
        });
        
        this.modalReject.addEventListener('click', () => {
            this.rejectTrade();
        });
        
        this.modalCancel.addEventListener('click', () => {
            this.cancelTrade();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.tradeModal) {
                this.closeModal();
            }
        });
    }
    
    async loadInitialData() {
        await Promise.all([
            this.loadReceivedTrades(),
            this.loadSentTrades(),
            this.loadTradeHistory(),
            this.loadTradingStats(),
            this.loadSettings()
        ]);
    }
    
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update active panel
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load data for the new tab
        switch (tabName) {
            case 'received':
                this.loadReceivedTrades();
                break;
            case 'sent':
                this.loadSentTrades();
                break;
            case 'history':
                this.loadTradeHistory();
                this.loadTradingStats();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    async createTrade() {
        const targetUsername = document.getElementById('targetUsername').value.trim();
        const message = document.getElementById('tradeMessage').value.trim();
        
        if (!targetUsername) {
            this.showNotification('يرجى إدخال اسم المستخدم المستهدف', 'error');
            return;
        }
        
        // Collect offered items
        const offeredItems = {
            score: parseInt(document.getElementById('offeredScore').value) || 0,
            pearls: parseInt(document.getElementById('offeredPearls').value) || 0,
            gems: parseInt(document.getElementById('offeredGems').value) || 0,
            keys: parseInt(document.getElementById('offeredKeys').value) || 0,
            coins: parseInt(document.getElementById('offeredCoins').value) || 0,
            bombs: parseInt(document.getElementById('offeredBombs').value) || 0,
            stars: parseInt(document.getElementById('offeredStars').value) || 0,
            bats: parseInt(document.getElementById('offeredBats').value) || 0
        };
        
        // Collect requested items
        const requestedItems = {
            score: parseInt(document.getElementById('requestedScore').value) || 0,
            pearls: parseInt(document.getElementById('requestedPearls').value) || 0,
            gems: parseInt(document.getElementById('requestedGems').value) || 0,
            keys: parseInt(document.getElementById('requestedKeys').value) || 0,
            coins: parseInt(document.getElementById('requestedCoins').value) || 0,
            bombs: parseInt(document.getElementById('requestedBombs').value) || 0,
            stars: parseInt(document.getElementById('requestedStars').value) || 0,
            bats: parseInt(document.getElementById('requestedBats').value) || 0
        };
        
        // Validate that at least one item is being traded
        const totalOffered = Object.values(offeredItems).reduce((sum, val) => sum + val, 0);
        const totalRequested = Object.values(requestedItems).reduce((sum, val) => sum + val, 0);
        
        if (totalOffered === 0 && totalRequested === 0) {
            this.showNotification('يجب تداول عنصر واحد على الأقل', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    toUsername: targetUsername,
                    offeredItems,
                    requestedItems,
                    message
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('تم إرسال طلب التداول بنجاح', 'success');
                this.clearTradeForm();
                this.loadSentTrades();
            } else {
                this.showNotification(data.error || 'خطأ في إرسال طلب التداول', 'error');
            }
        } catch (error) {
            console.error('Error creating trade:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }
    
    clearTradeForm() {
        document.getElementById('targetUsername').value = '';
        document.getElementById('tradeMessage').value = '';
        
        // Clear all item inputs
        const itemInputs = [
            'offeredScore', 'offeredPearls', 'offeredGems', 'offeredKeys',
            'offeredCoins', 'offeredBombs', 'offeredStars', 'offeredBats',
            'requestedScore', 'requestedPearls', 'requestedGems', 'requestedKeys',
            'requestedCoins', 'requestedBombs', 'requestedStars', 'requestedBats'
        ];
        
        itemInputs.forEach(id => {
            document.getElementById(id).value = '0';
        });
    }
    
    async loadReceivedTrades() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/received`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const trades = await response.json();
                this.renderReceivedTrades(trades);
            } else {
                throw new Error('Failed to load received trades');
            }
        } catch (error) {
            console.error('Error loading received trades:', error);
            document.getElementById('receivedTradesList').innerHTML = 
                '<div class="error">خطأ في تحميل الطلبات المستلمة</div>';
        }
    }
    
    async loadSentTrades() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/sent`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const trades = await response.json();
                this.renderSentTrades(trades);
            } else {
                throw new Error('Failed to load sent trades');
            }
        } catch (error) {
            console.error('Error loading sent trades:', error);
            document.getElementById('sentTradesList').innerHTML = 
                '<div class="error">خطأ في تحميل الطلبات المرسلة</div>';
        }
    }
    
    async loadTradeHistory() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const history = await response.json();
                this.renderTradeHistory(history);
            } else {
                throw new Error('Failed to load trade history');
            }
        } catch (error) {
            console.error('Error loading trade history:', error);
            document.getElementById('tradeHistoryList').innerHTML = 
                '<div class="error">خطأ في تحميل سجل التداول</div>';
        }
    }
    
    async loadTradingStats() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                this.renderTradingStats(stats);
            } else {
                throw new Error('Failed to load trading stats');
            }
        } catch (error) {
            console.error('Error loading trading stats:', error);
        }
    }
    
    async loadSettings() {
        // Settings are loaded from user data
        if (this.currentUser?.trading?.tradingSettings) {
            const settings = this.currentUser.trading.tradingSettings;
            
            document.getElementById('allowTrades').checked = settings.allowTrades;
            document.getElementById('allowScoreTrading').checked = settings.allowScoreTrading;
            document.getElementById('allowPearlTrading').checked = settings.allowPearlTrading;
            document.getElementById('allowItemTrading').checked = settings.allowItemTrading;
            document.getElementById('minTradeAmount').value = settings.minTradeAmount;
            document.getElementById('maxTradeAmount').value = settings.maxTradeAmount;
            document.getElementById('autoRejectTrades').checked = settings.autoRejectTrades;
        }
    }
    
    async saveSettings() {
        const settings = {
            allowTrades: document.getElementById('allowTrades').checked,
            allowScoreTrading: document.getElementById('allowScoreTrading').checked,
            allowPearlTrading: document.getElementById('allowPearlTrading').checked,
            allowItemTrading: document.getElementById('allowItemTrading').checked,
            minTradeAmount: parseInt(document.getElementById('minTradeAmount').value),
            maxTradeAmount: parseInt(document.getElementById('maxTradeAmount').value),
            autoRejectTrades: document.getElementById('autoRejectTrades').checked
        };
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(settings)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('تم حفظ الإعدادات بنجاح', 'success');
                // Update current user data
                if (this.currentUser) {
                    this.currentUser.trading.tradingSettings = settings;
                }
            } else {
                this.showNotification(data.error || 'خطأ في حفظ الإعدادات', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }
    
    renderReceivedTrades(trades) {
        const container = document.getElementById('receivedTradesList');
        
        if (trades.length === 0) {
            container.innerHTML = '<div class="empty-state">لا توجد طلبات تداول مستلمة</div>';
            return;
        }
        
        container.innerHTML = trades.map(trade => `
            <div class="trade-card" onclick="tradingSystem.showTradeDetails('${trade.tradeId}', 'received')">
                <div class="trade-header">
                    <div class="trade-user">${trade.fromUser.displayName}</div>
                    <div class="trade-status pending">في الانتظار</div>
                </div>
                
                <div class="trade-items-summary">
                    <div class="trade-items-section">
                        <h4>يقدم لك:</h4>
                        <div class="trade-items-list">
                            ${this.renderItemsList(trade.offeredItems)}
                        </div>
                    </div>
                    <div class="trade-items-section">
                        <h4>يطلب منك:</h4>
                        <div class="trade-items-list">
                            ${this.renderItemsList(trade.requestedItems)}
                        </div>
                    </div>
                </div>
                
                ${trade.message ? `<div class="trade-message">${trade.message}</div>` : ''}
                
                <div class="trade-footer">
                    <div class="trade-date">${this.formatDate(trade.createdAt)}</div>
                    <div class="trade-actions">
                        <button class="btn-primary btn-sm" onclick="event.stopPropagation(); tradingSystem.acceptTrade('${trade.tradeId}')">قبول</button>
                        <button class="btn-danger btn-sm" onclick="event.stopPropagation(); tradingSystem.rejectTrade('${trade.tradeId}')">رفض</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderSentTrades(trades) {
        const container = document.getElementById('sentTradesList');
        
        if (trades.length === 0) {
            container.innerHTML = '<div class="empty-state">لا توجد طلبات تداول مرسلة</div>';
            return;
        }
        
        container.innerHTML = trades.map(trade => `
            <div class="trade-card" onclick="tradingSystem.showTradeDetails('${trade.tradeId}', 'sent')">
                <div class="trade-header">
                    <div class="trade-user">${trade.toUser.displayName}</div>
                    <div class="trade-status ${trade.status}">${this.getStatusText(trade.status)}</div>
                </div>
                
                <div class="trade-items-summary">
                    <div class="trade-items-section">
                        <h4>قدمت له:</h4>
                        <div class="trade-items-list">
                            ${this.renderItemsList(trade.offeredItems)}
                        </div>
                    </div>
                    <div class="trade-items-section">
                        <h4>طلبت منه:</h4>
                        <div class="trade-items-list">
                            ${this.renderItemsList(trade.requestedItems)}
                        </div>
                    </div>
                </div>
                
                ${trade.message ? `<div class="trade-message">${trade.message}</div>` : ''}
                
                <div class="trade-footer">
                    <div class="trade-date">${this.formatDate(trade.createdAt)}</div>
                    ${trade.status === 'pending' ? 
                        `<button class="btn-danger btn-sm" onclick="event.stopPropagation(); tradingSystem.cancelTrade('${trade.tradeId}')">إلغاء</button>` : 
                        ''
                    }
                </div>
            </div>
        `).join('');
    }
    
    renderTradeHistory(history) {
        const container = document.getElementById('tradeHistoryList');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state">لا يوجد سجل تداول</div>';
            return;
        }
        
        container.innerHTML = history.map(trade => `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-partner">${trade.partner.displayName}</div>
                    <div class="history-date">${this.formatDate(trade.completedAt)}</div>
                </div>
                
                <div class="history-items">
                    <div class="trade-items-section">
                        <h4>أعطيت:</h4>
                        <div class="trade-items-list">
                            ${this.renderItemsList(trade.tradedItems.given)}
                        </div>
                    </div>
                    <div class="trade-items-section">
                        <h4>استلمت:</h4>
                        <div class="trade-items-list">
                            ${this.renderItemsList(trade.tradedItems.received)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderTradingStats(stats) {
        document.getElementById('totalTrades').textContent = stats.totalTrades;
        document.getElementById('successfulTrades').textContent = stats.successfulTrades;
        document.getElementById('cancelledTrades').textContent = stats.cancelledTrades;
        document.getElementById('reputation').textContent = stats.reputation;
    }
    
    renderItemsList(items) {
        const itemNames = {
            score: 'النقاط',
            pearls: 'اللآلئ',
            gems: 'الجواهر',
            keys: 'المفاتيح',
            coins: 'العملات',
            bombs: 'القنابل',
            stars: 'النجوم',
            bats: 'الخفافيش'
        };
        
        return Object.entries(items)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => `
                <div class="trade-item">
                    <span>${itemNames[key]}:</span>
                    <span class="amount">${value}</span>
                </div>
            `).join('') || '<div class="trade-item">لا توجد عناصر</div>';
    }
    
    async acceptTrade(tradeId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/accept/${tradeId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('تم قبول طلب التداول بنجاح', 'success');
                this.closeModal();
                this.loadReceivedTrades();
                this.loadSentTrades();
                this.loadTradeHistory();
                this.loadTradingStats();
            } else {
                this.showNotification(data.error || 'خطأ في قبول طلب التداول', 'error');
            }
        } catch (error) {
            console.error('Error accepting trade:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }
    
    async rejectTrade(tradeId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/reject/${tradeId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('تم رفض طلب التداول', 'success');
                this.closeModal();
                this.loadReceivedTrades();
                this.loadSentTrades();
            } else {
                this.showNotification(data.error || 'خطأ في رفض طلب التداول', 'error');
            }
        } catch (error) {
            console.error('Error rejecting trade:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }
    
    async cancelTrade(tradeId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/cancel/${tradeId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('تم إلغاء طلب التداول بنجاح', 'success');
                this.loadSentTrades();
            } else {
                this.showNotification(data.error || 'خطأ في إلغاء طلب التداول', 'error');
            }
        } catch (error) {
            console.error('Error cancelling trade:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }
    
    showTradeDetails(tradeId, type) {
        // This would show detailed trade information in a modal
        // For now, we'll just show a simple message
        this.modalTitle.textContent = 'تفاصيل التداول';
        this.modalContent.innerHTML = `
            <p>معرف التداول: ${tradeId}</p>
            <p>النوع: ${type === 'received' ? 'مستلم' : 'مرسل'}</p>
        `;
        
        // Show/hide action buttons based on type and status
        this.modalAccept.style.display = type === 'received' ? 'inline-block' : 'none';
        this.modalReject.style.display = type === 'received' ? 'inline-block' : 'none';
        this.modalCancel.style.display = type === 'sent' ? 'inline-block' : 'none';
        
        // Store current trade info
        this.currentTradeId = tradeId;
        this.currentTradeType = type;
        
        this.tradeModal.style.display = 'block';
    }
    
    closeModal() {
        this.tradeModal.style.display = 'none';
        this.currentTradeId = null;
        this.currentTradeType = null;
    }
    
    getStatusText(status) {
        const statusTexts = {
            pending: 'في الانتظار',
            accepted: 'مقبول',
            rejected: 'مرفوض',
            cancelled: 'ملغي'
        };
        return statusTexts[status] || status;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    setupExitWarning() {
        console.log('⚠️ إعداد تحذير الخروج...');
        
        // التحذير عند محاولة إغلاق التبويب/المتصفح فقط
        window.addEventListener('beforeunload', function(e) {
            if (this.currentUser) {
                const message = 'هل تريد الخروج من الموقع؟ سيتم فقدان تقدمك في اللعبة.';
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        });
        
        // إزالة التحذيرات من التنقل الداخلي (popstate)
        // لا نضع أي event listeners للـ popstate لتجنب التحذيرات عند التنقل الداخلي
        
        console.log('✅ تم إعداد تحذير الخروج (فقط عند مغادرة الموقع)');
    }
}

// Initialize trading system when page loads
let tradingSystem;
document.addEventListener('DOMContentLoaded', () => {
    tradingSystem = new TradingSystem();
});

// Add some utility styles
const style = document.createElement('style');
style.textContent = `
    .btn-sm {
        padding: 6px 12px;
        font-size: 0.8rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px;
        color: #718096;
        font-style: italic;
    }
    
    .error {
        text-align: center;
        padding: 20px;
        color: #e53e3e;
        background: #fed7d7;
        border-radius: 8px;
        margin: 10px 0;
    }
`;
document.head.appendChild(style); 