// ملف game.js المحدث بالكامل ليعمل مع صفحة game.html

const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// عناصر اللعبة
let score = 0;
let username = '';
let totalSpent = 0; // إجمالي النقاط المنفقة
let itemsCollected = {
    gem: 0,
    key: 0,
    coin: 0,
    pearl: 0,
    bomb: 0,
    star: 0,
    bat: 0
};

// عناصر DOM
const usernameDisplay = document.getElementById('username-display');
const balanceDisplay = document.getElementById('balance-display');
const pearlBalanceDisplay = document.getElementById('pearl-balance');
const boxesContainer = document.getElementById('boxes-container');
const messageArea = document.getElementById('message-area');
const singleShotButton = document.getElementById('single-shot-button');
const tripleShotButton = document.getElementById('triple-shot-button');
const hammerShotButton = document.getElementById('hammer-shot-button');
const lampButton = document.getElementById('lamp-button');
const logoutButton = document.getElementById('logout-button');
const rechargeButton = document.getElementById('recharge-button');
const muteButton = document.getElementById('mute-button');

// عناصر الدردشة
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const soundBtn = document.getElementById('soundBtn');
const soundKeys = document.getElementById('soundKeys');
const voiceChatBtn = document.getElementById('voiceChatBtn');
const chatMuteBtn = document.getElementById('chatMuteBtn');
const reconnectBtn = document.getElementById('reconnectBtn');
const toggleChatBtn = document.getElementById('toggleChat');

// أصوات
const sounds = {
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    buttonClick: new Audio('sounds/click.mp3'),
    singleShot: new Audio('sounds/single_shot.mp3'),
    tripleShot: new Audio('sounds/triple_shot.mp3'),
    hammerShot: new Audio('sounds/hammer_shot.mp3'),
    winGif: new Audio('sounds/WIN1.MP3'),
    loseGif: new Audio('sounds/lose.mp3')
};
let isMuted = false;
let chatVolume = 0.5;

// WebSocket للدردشة
let ws = null;
let isConnected = false;

// رسائل وهمية في الدردشة
const fakeUsernames = ['علي', 'احمد', 'دانيال', 'سعار', 'ليلى', 'نيرمين'];
const fakeMessages = [
  'أنت بطل اللعبة! 👏',
  'حظًا موفقًا للجميع!',
  'يا سلام على الحماس! 🔥',
  'أحب هذه اللعبة جدًا! 😍',
  'أنت رائع يا صديقي!',
  'ليلى، لعبك جميل جدًا! 💖',
  'دانيال، استمر في الفوز!',
  'سعار، أنت ملك الصناديق!',
  'أحمد، ضربة موفقة!',
  'نيرمين، حظك اليوم جميل!',
  'أحلى تشجيع لأبطالنا!',
  'أنت نجم اليوم ⭐',
  'أحببت أسلوبك في اللعب!',
  'أحلى تحية للجميع!',
  'يا سلام على الغزل! 😉',
  'أنتِ أجمل لاعبة يا ليلى!',
  'دانيال، عيونك على الجائزة!',
  'سعار، قلبك كبير!',
  'أحمد، أنت فارس اللعبة!',
  'نيرمين، ابتسامتك حلوة!'
];

// عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    setupGameButtons();
    setupChatSystem();
    connectWebSocket();
    // إعداد إغلاق صور الفوز والخسارة
    setupGifCloseButtons();
    // إعداد أزرار المودال الصوتي
    setupVoiceModalButtons();
    createBoxes();
    createItemsGrid();
    createItemInfo();
    setupItemInfoButtons();
});

// حفظ البيانات عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    saveGameData();
});

// تحميل بيانات اللاعب
async function loadGameData() {
    const token = localStorage.getItem('token');
    console.log('🔍 فحص token:', token ? 'موجود' : 'غير موجود');
    
    if (!token) {
        console.log('❌ لا يوجد token، إعادة توجيه لصفحة تسجيل الدخول');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        console.log('🌐 إرسال طلب للخادم للتحقق من المستخدم...');
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 استجابة الخادم:', res.status, res.statusText);
        
        if (res.ok) {
            const data = await res.json();
            console.log('✅ تم تحميل بيانات المستخدم:', data);
            
            username = data.username;
            score = data.score || 1000;
            totalSpent = data.totalSpent || 0;
            itemsCollected = data.itemsCollected || itemsCollected;
            
            console.log('📊 بيانات اللاعب:', {
                username,
                score,
                totalSpent,
                itemsCollected
            });
            
            updateDisplay();
        } else {
            console.error('❌ فشل في تحميل بيانات المستخدم:', res.status);
            if (res.status === 401) {
                console.log('🔒 Token غير صالح، حذف وإعادة توجيه');
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                localStorage.removeItem('isAdmin');
                window.location.href = 'index.html';
            } else {
                console.log('⚠️ خطأ آخر، إعادة توجيه');
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال بالخادم:', error);
        console.log('🔄 إعادة توجيه لصفحة تسجيل الدخول');
        window.location.href = 'index.html';
    }
}

// حفظ بيانات اللعبة
async function saveGameData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/save-game-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                score: score,
                totalSpent: totalSpent, // حفظ إجمالي النقاط المنفقة
                itemsCollected: itemsCollected
            })
        });
        
        if (res.ok) {
            console.log('تم حفظ بيانات اللعبة بنجاح');
        } else {
            console.error('فشل في حفظ بيانات اللعبة');
        }
    } catch (e) {
        console.error('خطأ في حفظ بيانات اللعبة:', e);
    }
}

// تحديث العرض
function updateDisplay() {
    if (usernameDisplay) usernameDisplay.textContent = `اللاعب: ${username}`;
    if (balanceDisplay) balanceDisplay.textContent = `النقاط: ${score}`;
    if (pearlBalanceDisplay) {
        const pearls = itemsCollected && itemsCollected.pearl ? itemsCollected.pearl : 0;
        pearlBalanceDisplay.textContent = `اللآلئ: ${pearls}🦪`;
    }
    
    // إضافة عرض إجمالي النقاط المنفقة
    const totalSpentDisplay = document.getElementById('total-spent-display');
    if (totalSpentDisplay) {
        totalSpentDisplay.textContent = `إجمالي الإنفاق: ${totalSpent.toLocaleString()}`;
        
        // إظهار رسالة خاصة إذا اقترب من مليون نقطة
        if (totalSpent > 900000 && totalSpent <= 1000000) {
            totalSpentDisplay.style.color = '#ff9800';
            totalSpentDisplay.style.fontWeight = 'bold';
        } else if (totalSpent > 1000000) {
            totalSpentDisplay.style.color = '#00bcd4';
            totalSpentDisplay.style.fontWeight = 'bold';
            totalSpentDisplay.textContent += ' 🦪 (يمكن الحصول على اللؤلؤة!)';
        }
    }
    
    // تحديث عدادات العناصر
    updateItemCounts();
    
    // حفظ البيانات عند التحديث
    saveGameData();
}

// إعداد أزرار اللعبة
function setupGameButtons() {
    if (singleShotButton) singleShotButton.onclick = () => processShot('single');
    if (tripleShotButton) tripleShotButton.onclick = () => processShot('triple');
    if (hammerShotButton) hammerShotButton.onclick = () => processShot('hammer');
    if (lampButton) lampButton.onclick = openLamp;
    if (logoutButton) logoutButton.onclick = logout;
    if (rechargeButton) rechargeButton.onclick = recharge;
    if (muteButton) muteButton.onclick = toggleMute;
}

// معالجة الضربات
function processShot(type) {
    const shotCosts = {
        single: 100,
        triple: 300,
        hammer: 500
    };
    
    const cost = shotCosts[type];
    
    // تحقق من النقاط المطلوبة
    if (score < cost) {
        showMessage(`تحتاج إلى ${cost} نقطة على الأقل لاستخدام ${type === 'single' ? 'الضربة الفردية' : type === 'triple' ? 'الضربة الثلاثية' : 'ضربة المطرقة'}!`, 'error');
        return;
    }
    
    // خصم النقاط وتتبع الإنفاق
    score -= cost;
    totalSpent += cost;
    
    // تشغيل الصوت المناسب
    playSound(type === 'single' ? 'singleShot' : type === 'triple' ? 'tripleShot' : 'hammerShot');
    
    // تحديث المهام اليومية
    if (window.updateDailyQuests) {
        window.updateDailyQuests('shotUsed', { shotType: type });
    }
    
    // محاكاة الضربة
    let boxesToOpen = 0;
    
    switch (type) {
        case 'single':
            boxesToOpen = 1;
            break;
        case 'triple':
            boxesToOpen = 3;
            break;
        case 'hammer':
            boxesToOpen = 5;
            break;
    }
    
    // محاكاة فتح الصناديق مع التأثيرات البصرية
    simulateBoxOpeningWithEffects(boxesToOpen);
    
    updateDisplay();
}

// محاكاة فتح الصناديق مع التأثيرات البصرية
function simulateBoxOpeningWithEffects(numBoxes) {
    const boxes = document.querySelectorAll('.box:not(.opened)');
    const boxesToOpen = Math.min(numBoxes, boxes.length);
    
    if (boxesToOpen === 0) {
        showMessage('لا توجد صناديق متاحة للفتح!', 'error');
        return;
    }
    
    let totalReward = 0;
    let itemsFound = [];
    
    for (let i = 0; i < boxesToOpen; i++) {
        const randomBox = boxes[Math.floor(Math.random() * boxes.length)];
        if (randomBox && !randomBox.classList.contains('opened')) {
            // توليد محتوى عشوائي للصندوق
            const content = generateRandomBoxContent();
            
            // إظهار تأثير فتح الصندوق
            showBoxOpeningEffect(randomBox, content);
            
            // تطبيق المحتوى
            if (content.type === 'coins') {
                totalReward += content.amount;
            } else if (content.type === 'pearl') {
                // اللؤلؤة عملة خاصة
                totalReward += 150; // قيمة اللؤلؤة
                itemsFound.push({ type: 'pearl', name: 'لؤلؤة', emoji: '🦪', value: 150 });
            } else if (content.type === 'empty' || content.isLoss) {
                const loss = content.type === 'bomb' ? 50 : 25;
                totalReward = Math.max(0, totalReward - loss);
                itemsFound.push({ type: content.type, name: content.type === 'bomb' ? 'قنبلة' : 'فارغ', emoji: content.emoji, value: -loss });
            } else {
                // إضافة عنصر عادي
                itemsCollected[content.type]++;
                itemsFound.push({ type: content.type, name: getItemName(content.type), emoji: content.emoji, value: 1 });
            }
            
            // إعادة تعيين الصندوق بعد فترة
            setTimeout(() => {
                resetBox(randomBox);
            }, 4000);
        }
    }
    
    // إضافة النقاط الإجمالية
    score += totalReward;
    
    // تحديث المهام اليومية
    if (window.updateDailyQuests) {
        window.updateDailyQuests('boxOpened', { count: boxesToOpen });
        if (totalReward > 0) {
            window.updateDailyQuests('pointsEarned', { amount: totalReward });
        }
        // تحديث العناصر المجمعة
        itemsFound.forEach(item => {
            if (item.type !== 'bomb' && item.type !== 'empty') {
                window.updateDailyQuests('itemCollected', { itemType: item.type });
            }
        });
    }
    
    // إظهار رسالة النتيجة
    setTimeout(() => {
        let message = '';
        if (numBoxes === 1) {
            message = `🎯 ضربة فردية! فتحت صندوق واحد`;
        } else if (numBoxes === 3) {
            message = `🎯🎯🎯 ضربة ثلاثية! فتحت 3 صناديق`;
        } else {
            message = `🔨 ضربة المطرقة! فتحت 5 صناديق`;
        }
        
        if (totalReward > 0) {
            message += ` وحصلت على ${totalReward} نقطة`;
        } else if (totalReward < 0) {
            message += ` وخسرت ${Math.abs(totalReward)} نقطة`;
        }
        
        if (itemsFound.length > 0) {
            message += `\nالعناصر: ${itemsFound.map(item => `${item.emoji} ${item.name}`).join(', ')}`;
        }
        
        showMessage(message, totalReward >= 0 ? 'success' : 'error');
    }, 2000);
}

// الحصول على اسم العنصر
function getItemName(itemType) {
    const itemNames = {
        'gem': 'جوهرة',
        'key': 'مفتاح',
        'coin': 'عملة ذهبية',
        'star': 'نجمة',
        'bat': 'خفاش',
        'bomb': 'قنبلة',
        'empty': 'فارغ'
    };
    return itemNames[itemType] || itemType;
}

// فتح المصباح
async function openLamp() {
    showMessage('ميزة المصباح قيد التطوير', 'info');
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// تعبئة الرصيد
function recharge() {
    showMessage('سيتم إضافة ميزة التعبئة قريباً', 'info');
}

// كتم الصوت
function toggleMute() {
    isMuted = !isMuted;
    muteButton.innerHTML = isMuted ? '🔇' : '🔊';
}

// إعداد الدردشة
function setupChatSystem() {
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    if (!chatInput || !sendMessageBtn || !chatMessages) return;
    sendMessageBtn.onclick = sendMessage;
    chatInput.onkeydown = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
    function sendMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        // أضف الرسالة مباشرة للنافذة (محليًا)
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message own';
        msgDiv.innerHTML = `<span class='message-text'>${msg}</span>`;
        chatMessages.appendChild(msgDiv);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // أرسل الرسالة للسيرفر إذا كان هناك WebSocket
        if (typeof sendChatMessageToServer === 'function') {
            sendChatMessageToServer(msg);
        }
        
        // تحديث المهام اليومية
        if (window.updateDailyQuests) {
            window.updateDailyQuests('messageSent', { message: msg });
        }
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupChatSystem);
} else {
    setupChatSystem();
}

// إرسال رسالة
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    if (ws && isConnected) {
        ws.send(JSON.stringify({
            type: 'chat_message',
            sender: username,
            text: message
        }));
    }
    
    // تحديث المهام اليومية
    if (window.updateDailyQuests) {
        window.updateDailyQuests('messageSent', { message: message });
    }
    
    addMessageToChat(username, message);
    chatInput.value = '';
}

// إضافة رسالة للدردشة
function addMessageToChat(sender, message) {
    if (!chatMessages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `<span class="message-time">${new Date().toLocaleTimeString('ar-SA')}</span> <span class="message-sender">${sender}:</span> <span class="message-text">${message}</span>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// WebSocket للدردشة
function connectWebSocket() {
    try {
        ws = new WebSocket('wss://mygame25bita-7eqw.onrender.com');
        ws.onopen = () => { isConnected = true; addMessageToChat('النظام', 'تم الاتصال بالخادم'); };
        ws.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.type === 'message') addMessageToChat(data.username, data.message);
        };
        ws.onclose = () => { isConnected = false; addMessageToChat('النظام', 'تم قطع الاتصال بالخادم'); };
        ws.onerror = () => { addMessageToChat('النظام', 'خطأ في الاتصال'); };
    } catch (e) { addMessageToChat('النظام', 'خطأ في الاتصال'); }
}
function reconnectWebSocket() { if (ws) ws.close(); connectWebSocket(); }

// تحكمات الدردشة
function toggleVoiceChat() {
    const modal = document.getElementById('voiceModal');
    if (modal) modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}
function toggleChatMute() {
    chatVolume = chatVolume > 0 ? 0 : 0.5;
    chatMuteBtn.innerHTML = chatVolume > 0 ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
}
function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) chatContainer.classList.toggle('collapsed');
}

// أصوات
function playSound(type) {
    if (isMuted) return;
    const sound = sounds[type];
    if (sound) { sound.currentTime = 0; sound.play().catch(()=>{}); }
}

// رسائل
function showMessage(message, type = 'info') {
    if (!messageArea) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageArea.appendChild(messageDiv);
    setTimeout(() => { messageDiv.remove(); }, 3000);
}

// إعداد إغلاق صور الفوز والخسارة
function setupGifCloseButtons() {
    const closeWinGif = document.getElementById('closeWinGif');
    const closeSadcatGif = document.getElementById('closeSadcatGif');
    if (closeWinGif) closeWinGif.onclick = () => document.getElementById('win-gif-container').style.display = 'none';
    if (closeSadcatGif) closeSadcatGif.onclick = () => document.getElementById('sadcat-gif-container').style.display = 'none';
}

// إعداد أزرار المودال الصوتي
function setupVoiceModalButtons() {
    const enableVoiceBtn = document.getElementById('enableVoiceBtn');
    const cancelVoiceBtn = document.getElementById('cancelVoiceBtn');
    const voiceModal = document.getElementById('voiceModal');
    if (enableVoiceBtn && voiceModal) enableVoiceBtn.onclick = () => { voiceModal.style.display = 'none'; };
    if (cancelVoiceBtn && voiceModal) cancelVoiceBtn.onclick = () => { voiceModal.style.display = 'none'; };
}

// إنشاء الصناديق
function createBoxes() {
    const boxesContainer = document.getElementById('boxes-container');
    if (!boxesContainer) return;
    boxesContainer.innerHTML = '';
    const totalBoxes = 24; // 4 صفوف × 6 صناديق
    for (let i = 0; i < totalBoxes; i++) {
        const box = document.createElement('div');
        box.className = 'box';
        box.id = `box-${i+1}`;
        box.innerHTML = `
            <div class="box-content">
                <img src="box_closed.png" alt="صندوق" class="box-image">
                <div class="box-overlay">
                    <span class="box-number">${i + 1}</span>
                </div>
            </div>
        `;
        
        // إضافة حدث النقر على الصندوق
        box.addEventListener('click', () => openBox(i));
        boxesContainer.appendChild(box);
    }
}

// فتح الصندوق
function openBox(boxIndex) {
    const box = document.getElementById(`box-${boxIndex}`);
    if (!box || box.classList.contains('opened')) return;
    
    // تحقق من النقاط المطلوبة
    if (score < 100) {
        showMessage('تحتاج إلى 100 نقطة على الأقل لفتح الصندوق!', 'error');
        return;
    }
    
    // خصم النقاط وتتبع الإنفاق
    score -= 100;
    totalSpent += 100;
    
    // محاكاة فتح الصندوق
    box.classList.add('opened');
    
    // توليد محتوى عشوائي جديد للصندوق
    const selectedContent = generateRandomBoxContent();
    
    // إظهار تأثير فتح الصندوق
    showBoxOpeningEffect(box, selectedContent);
    
    // تطبيق المحتوى
    if (selectedContent.type === 'coins') {
        score += selectedContent.amount;
    } else if (selectedContent.type === 'pearl') {
        // اللؤلؤة عملة خاصة
        score += selectedContent.amount;
    } else if (selectedContent.type === 'empty' || selectedContent.isLoss) {
        const loss = selectedContent.type === 'bomb' ? 50 : 25;
        score = Math.max(0, score - loss);
    } else {
        // إضافة عنصر عادي
        itemsCollected[selectedContent.type]++;
    }
    
    updateDisplay();
    
    // تحديث عداد العناصر
    updateItemCounts();
    
    // إعادة تعيين الصندوق بعد فترة
    setTimeout(() => {
        resetBox(box);
    }, 4000); // زيادة الوقت ليرى اللاعب المحتوى بوضوح
}

// توليد محتوى عشوائي للصندوق
function generateRandomBoxContent() {
    // محتوى الصناديق المتنوع
    const boxContents = [
        // صناديق العملات
        { type: 'coins', amount: 50, message: '💰 حصلت على 50 عملة!', probability: 0.25, color: '#ffc107', emoji: '💰' },
        { type: 'coins', amount: 100, message: '💰💰 حصلت على 100 عملة!', probability: 0.2, color: '#ff9800', emoji: '💰💰' },
        { type: 'coins', amount: 200, message: '💰💰💰 حصلت على 200 عملة!', probability: 0.15, color: '#f57c00', emoji: '💰💰💰' },
        { type: 'coins', amount: 300, message: '💰💰💰💰 حصلت على 300 عملة!', probability: 0.1, color: '#e65100', emoji: '💰💰💰💰' },
        
        // صناديق العناصر النادرة
        { type: 'gem', amount: 1, message: '💎 حصلت على جوهرة نادرة!', probability: 0.12, color: '#e91e63', emoji: '💎' },
        { type: 'star', amount: 1, message: '⭐ حصلت على نجمة سحرية!', probability: 0.1, color: '#9c27b0', emoji: '⭐' },
        
        // صناديق العناصر العادية
        { type: 'key', amount: 1, message: '🔑 حصلت على مفتاح!', probability: 0.15, color: '#ff9800', emoji: '🔑' },
        { type: 'coin', amount: 1, message: '🪙 حصلت على عملة ذهبية!', probability: 0.12, color: '#ffc107', emoji: '🪙' },
        { type: 'bat', amount: 1, message: '🦇 حصلت على خفاش!', probability: 0.1, color: '#607d8b', emoji: '🦇' },
        
        // صناديق القنابل (خسارة)
        { type: 'bomb', amount: 1, message: '💣 قنبلة! خسرت 50 نقطة!', probability: 0.05, color: '#f44336', isLoss: true, emoji: '💣' },
        
        // صناديق فارغة (خسارة)
        { type: 'empty', amount: 0, message: '😢 الصندوق فارغ! خسرت 25 نقطة!', probability: 0.03, color: '#9e9e9e', isLoss: true, emoji: '😢' }
    ];
    
    // حساب إجمالي النقاط المنفقة (تقريبي)
    const totalSpent = calculateTotalSpent();
    
    // إضافة اللؤلؤة فقط إذا تم إنفاق أكثر من مليون نقطة
    if (totalSpent > 1000000) {
        boxContents.push({ 
            type: 'pearl', 
            amount: 150, 
            message: '🦪 حصلت على لؤلؤة بحرية نادرة! (150 نقطة)', 
            probability: 0.001, // احتمال ضئيل جداً
            color: '#00bcd4', 
            emoji: '🦪' 
        });
    }
    
    // اختيار محتوى عشوائي بناءً على الاحتمالات
    const random = Math.random();
    let selectedContent = null;
    let cumulativeProbability = 0;
    
    for (const content of boxContents) {
        cumulativeProbability += content.probability;
        if (random <= cumulativeProbability) {
            selectedContent = content;
            break;
        }
    }
    
    // إذا لم يتم اختيار أي محتوى، اختر عملات قليلة
    if (!selectedContent) {
        selectedContent = { type: 'coins', amount: 25, message: '💰 حصلت على 25 عملة!', color: '#ffc107', emoji: '💰' };
    }
    
    return selectedContent;
}

// حساب إجمالي النقاط المنفقة
function calculateTotalSpent() {
    return totalSpent;
}

// إظهار تأثير فتح الصندوق
function showBoxOpeningEffect(box, content) {
    const boxContent = box.querySelector('.box-content');
    
    // حفظ المحتوى الأصلي
    const originalContent = boxContent.innerHTML;
    
    // إزالة الصورة من الخلفية أولاً
    box.style.backgroundImage = 'none';
    
    // إضافة تأثير الاهتزاز
    box.style.animation = 'boxShake 0.5s ease-in-out';
    
    // إظهار رسالة "جاري الفتح..."
    showMessage('🔓 جاري فتح الصندوق...', 'info');
    
    // إظهار المحتوى الجديد
    setTimeout(() => {
        // تحديد نوع التأثير حسب المحتوى
        let effectClass = '';
        let soundEffect = '';
        
        if (content.type === 'coins') {
            effectClass = 'reward-coins';
            soundEffect = 'win';
        } else if (content.type === 'gem' || content.type === 'pearl' || content.type === 'star') {
            effectClass = 'reward-rare';
            soundEffect = 'win';
        } else if (content.type === 'bomb') {
            effectClass = 'reward-bomb';
            soundEffect = 'lose';
        } else if (content.type === 'empty') {
            effectClass = 'reward-empty';
            soundEffect = 'lose';
        } else {
            effectClass = 'reward-normal';
            soundEffect = 'win';
        }
        
        // إضافة تأثير التوهج حسب النوع
        let glowColor = content.color;
        if (content.type === 'bomb') {
            glowColor = '#ff0000';
            box.style.animation = 'boxExplode 2s ease-in-out';
        } else if (content.type === 'empty') {
            glowColor = '#666666';
            box.style.animation = 'boxDisappoint 2s ease-in-out';
        } else if (content.type === 'gem' || content.type === 'pearl' || content.type === 'star') {
            box.style.animation = 'boxRareGlow 2s ease-in-out';
        } else {
            box.style.animation = 'boxPulse 2s ease-in-out';
        }
        
        // إضافة تأثير التوهج
        box.style.background = `linear-gradient(135deg, ${glowColor}40, ${glowColor}20)`;
        box.style.boxShadow = `0 0 30px ${glowColor}60, inset 0 0 20px ${glowColor}30`;
        
        // تحديث محتوى الصندوق مع تأثيرات واضحة
        boxContent.innerHTML = `
            <div class="box-reward ${effectClass}" style="color: ${content.color}; font-size: 3em; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); filter: drop-shadow(0 0 10px ${content.color});">
                ${content.emoji}
            </div>
            <div class="box-reward-text" style="color: ${content.color}; font-size: 1.1em; margin-top: 8px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.9);">
                ${content.type === 'coins' ? `+${content.amount}` : content.type === 'empty' ? '-25' : content.type === 'bomb' ? '-50' : '+1'}
            </div>
        `;
        
        // إضافة تأثير إضافي للصناديق المفتوحة
        box.style.border = `3px solid ${content.color}`;
        box.style.transform = 'scale(1.05)';
        
        // تشغيل الصوت المناسب
        if (soundEffect) {
            playSound(soundEffect);
        }
        
        // إظهار رسالة النتيجة
        setTimeout(() => {
            showMessage(content.message, content.isLoss ? 'error' : 'success');
        }, 1000);
        
    }, 500);
    
    // إضافة CSS للتحريكات
    if (!document.getElementById('box-animations')) {
        const style = document.createElement('style');
        style.id = 'box-animations';
        style.textContent = `
            @keyframes boxShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-8px); }
                75% { transform: translateX(8px); }
            }
            
            @keyframes boxPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1); }
            }
            
            @keyframes boxRareGlow {
                0% { transform: scale(1); box-shadow: 0 0 30px currentColor; }
                50% { transform: scale(1.2); box-shadow: 0 0 60px currentColor, 0 0 80px currentColor; }
                100% { transform: scale(1); box-shadow: 0 0 30px currentColor; }
            }
            
            @keyframes boxExplode {
                0% { transform: scale(1); }
                25% { transform: scale(1.3) rotate(8deg); }
                50% { transform: scale(0.7) rotate(-8deg); }
                75% { transform: scale(1.2) rotate(5deg); }
                100% { transform: scale(1); }
            }
            
            @keyframes boxDisappoint {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(0.8); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .box-reward {
                animation: rewardGlow 2s ease-in-out;
            }
            
            .reward-rare {
                animation: rareRewardGlow 2s ease-in-out !important;
            }
            
            .reward-bomb {
                animation: bombRewardGlow 2s ease-in-out !important;
            }
            
            .reward-empty {
                animation: emptyRewardGlow 2s ease-in-out !important;
            }
            
            @keyframes rewardGlow {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.3); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes rareRewardGlow {
                0% { transform: scale(0.3) rotate(0deg); opacity: 0; }
                25% { transform: scale(1.4) rotate(90deg); opacity: 0.8; }
                50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
                75% { transform: scale(1.3) rotate(270deg); opacity: 1; }
                100% { transform: scale(1) rotate(360deg); opacity: 1; }
            }
            
            @keyframes bombRewardGlow {
                0% { transform: scale(0.3); opacity: 0; }
                25% { transform: scale(1.5); opacity: 1; }
                50% { transform: scale(0.7); opacity: 0.8; }
                75% { transform: scale(1.3); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes emptyRewardGlow {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.2); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// إعادة تعيين الصندوق
function resetBox(box) {
    const boxContent = box.querySelector('.box-content');
    
    // إضافة تأثير الإغلاق
    box.style.animation = 'boxClose 0.5s ease-in-out';
    
    // إظهار رسالة تجديد المحتوى
    showMessage('🔄 تم تجديد محتوى الصندوق!', 'info');
    
    setTimeout(() => {
        // إعادة المحتوى الأصلي
        boxContent.innerHTML = `
            <img src="box_closed.png" alt="صندوق" class="box-image">
            <div class="box-overlay">
                <span class="box-number">${box.id.replace('box-', '')}</span>
            </div>
        `;
        
        // إزالة الفئات والتأثيرات
        box.classList.remove('opened');
        box.style.background = '';
        box.style.backgroundImage = '';
        box.style.boxShadow = '';
        box.style.animation = '';
        box.style.border = '';
        box.style.transform = '';
        
        // إعادة تفعيل النقر
        box.style.cursor = 'pointer';
        
    }, 500);
}

// تحديث عدادات العناصر
function updateItemCounts() {
    const items = ['gem', 'key', 'coin', 'pearl', 'bomb', 'star', 'bat'];
    items.forEach(item => {
        const countElement = document.getElementById(`item-count-${item}`);
        if (countElement) {
            countElement.textContent = itemsCollected[item] || 0;
        }
    });
}

// إنشاء شبكة العناصر
function createItemsGrid() {
    const itemsGrid = document.getElementById('itemsGrid');
    if (!itemsGrid) return;
    
    const items = [
        { key: 'gem', name: 'جوهرة', emoji: '💎', color: '#e91e63' },
        { key: 'key', name: 'مفتاح', emoji: '🔑', color: '#ff9800' },
        // { key: 'coin', name: 'عملة', emoji: '🪙', color: '#ffc107' }, // مستثنى
        // { key: 'pearl', name: 'لؤلؤة', emoji: '🦪', color: '#00bcd4' }, // مستثنى
        { key: 'bomb', name: 'قنبلة', emoji: '💣', color: '#f44336' },
        { key: 'star', name: 'نجمة', emoji: '⭐', color: '#9c27b0' },
        { key: 'bat', name: 'خفاش', emoji: '🦇', color: '#607d8b' }
    ];
    
    itemsGrid.innerHTML = '';
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-display';
        itemElement.innerHTML = `
            <div class="item-icon" style="background: ${item.color}">
                <span class="item-emoji">${item.emoji}</span>
            </div>
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-count" id="item-count-${item.key}">${itemsCollected[item.key] || 0}</span>
            </div>
        `;
        itemsGrid.appendChild(itemElement);
    });
}

// إنشاء معلومات العناصر
function createItemInfo() {
    const itemInfoGrid = document.getElementById('itemInfoGrid');
    const collectionGoalsList = document.getElementById('collectionGoalsList');
    if (!itemInfoGrid || !collectionGoalsList) return;
    
    const items = [
        { key: 'gem', name: 'جوهرة', emoji: '💎', description: 'جوهرة نادرة تزيد من قوة اللاعب', value: 100 },
        { key: 'key', name: 'مفتاح', emoji: '🔑', description: 'يفتح الصناديق الخاصة', value: 50 },
        { key: 'coin', name: 'عملة', emoji: '🪙', description: 'عملة ذهبية قيمة', value: 25 },
        { key: 'pearl', name: 'لؤلؤة', emoji: '🦪', description: 'لؤلؤة بحرية نادرة', value: 75 },
        { key: 'bomb', name: 'قنبلة', emoji: '💣', description: 'تسبب ضرراً للخصوم', value: 150 },
        { key: 'star', name: 'نجمة', emoji: '⭐', description: 'نجمة سحرية تمنح قوى خاصة', value: 200 },
        { key: 'bat', name: 'خفاش', emoji: '🦇', description: 'خفاش يطير في الظلام', value: 30 }
    ];
    
    // إنشاء معلومات العناصر
    itemInfoGrid.innerHTML = '';
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-info-item';
        itemElement.innerHTML = `
            <div class="item-info-icon">
                <span class="item-emoji">${item.emoji}</span>
            </div>
            <div class="item-info-details">
                <h4 class="item-info-name">${item.name}</h4>
                <p class="item-info-description">${item.description}</p>
                <span class="item-info-value">القيمة: ${item.value} نقطة</span>
            </div>
        `;
        itemInfoGrid.appendChild(itemElement);
    });
    
    // إنشاء أهداف المجموعات
    const goals = [
        { name: 'مجموعة الجواهر', items: ['gem', 'pearl'], reward: 500, description: 'اجمع جوهرة ولؤلؤة' },
        { name: 'مجموعة المفاتيح', items: ['key', 'star'], reward: 300, description: 'اجمع مفتاح ونجمة' },
        { name: 'مجموعة العملات', items: ['coin', 'bat'], reward: 200, description: 'اجمع عملة وخفاش' }
    ];
    
    collectionGoalsList.innerHTML = '';
    goals.forEach(goal => {
        const goalElement = document.createElement('div');
        goalElement.className = 'collection-goal';
        goalElement.innerHTML = `
            <h4 class="goal-name">${goal.name}</h4>
            <p class="goal-description">${goal.description}</p>
            <span class="goal-reward">المكافأة: ${goal.reward} نقطة</span>
        `;
        collectionGoalsList.appendChild(goalElement);
    });
}

// إعداد أزرار معلومات العناصر
function setupItemInfoButtons() {
    const itemInfoBtn = document.getElementById('itemInfoBtn');
    const itemInfoModal = document.getElementById('itemInfoModal');
    const itemInfoClose = document.getElementById('itemInfoClose');
    
    if (itemInfoBtn && itemInfoModal) {
        itemInfoBtn.onclick = () => {
            itemInfoModal.style.display = 'block';
        };
    }
    
    if (itemInfoClose && itemInfoModal) {
        itemInfoClose.onclick = () => {
            itemInfoModal.style.display = 'none';
        };
    }
    
    // إغلاق المودال عند النقر خارجه
    if (itemInfoModal) {
        itemInfoModal.onclick = (e) => {
            if (e.target === itemInfoModal) {
                itemInfoModal.style.display = 'none';
            }
        };
    }
}

// رسائل وهمية في الدردشة
function addFakeChatMessage() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  const name = fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)];
  const msg = fakeMessages[Math.floor(Math.random() * fakeMessages.length)];
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message other';
  msgDiv.innerHTML = `<span class='message-sender'>${name}:</span> <span class='message-text'>${msg}</span>`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
setInterval(addFakeChatMessage, Math.floor(Math.random() * 10000) + 10000); // كل 10-20 ثانية
