// ملف game.js: يرجى نقل جميع أكواد الجافاسكريبت من <script> في game.html إلى هنا. 

const BACKEND_URL = 'https://mygame25bita.onrender.com';

// Game State
let score = 0;
let highScore = 0;
let roundNumber = 1;
let username = '';
let isProcessingShot = false;
let collectedGems = 0;
let totalGemsCollected = 0;
let batsHit = 0;
let itemsCollected = {
    gem: 0,
    key: 0,
    coin: 0,
    bomb: 0,
    star: 0,
    bat: 0
};
const ITEM_REWARDS = {
    gem: { points: 75, name: 'جوهرة', emoji: '💎', color: '#ff69b4' },
    key: { points: 150, name: 'مفتاح', emoji: '🔑', color: '#ffd700' },
    coin: { points: 40, name: 'عملة', emoji: '🪙', color: '#ffd700' },
    bomb: { points: -50, name: 'قنبلة', emoji: '💣', color: '#ff4500' },
    star: { points: 300, name: 'نجمة', emoji: '⭐', color: '#ffd700' },
    bat: { points: -75, name: 'خفاش', emoji: '🦇', color: '#8b4513' }
};
const COLLECTION_GOALS = {
    gem: { target: 5, reward: 1500, name: 'الجواهر' },
    key: { target: 3, reward: 800, name: 'المفاتيح' },
    star: { target: 2, reward: 1200, name: 'النجوم' }
};
const usernameDisplay = document.getElementById('username-display');
const balanceDisplay = document.getElementById('balance-display');
const boxesContainer = document.getElementById('boxes-container');
const messageArea = document.getElementById('message-area');
const singleShotButton = document.getElementById('single-shot-button');
const tripleShotButton = document.getElementById('triple-shot-button');
const hammerShotButton = document.getElementById('hammer-shot-button');
const logoutButton = document.getElementById('logout-button');
const seekerImage = document.getElementById('seeker-hero');
const loadingIndicator = document.getElementById('loading-indicator');
const rechargeButton = document.getElementById('recharge-button');
const muteButton = document.getElementById('mute-button');
const sounds = {
    win: new Audio('https://mygame25bita.onrender.com/sounds/win.mp3'),
    lose: new Audio('https://mygame25bita.onrender.com/sounds/lose.mp3'),
    buttonClick: new Audio('https://mygame25bita.onrender.com/sounds/click.mp3'),
    singleShot: new Audio('https://mygame25bita.onrender.com/sounds/single_shot.mp3'),
    tripleShot: new Audio('https://mygame25bita.onrender.com/sounds/triple_shot.mp3'),
    hammerShot: new Audio('https://mygame25bita.onrender.com/sounds/hammer_shot.mp3'),
    winGif: new Audio('https://mygame25bita.onrender.com/sounds/WIN1.MP3'),
    loseGif: new Audio('https://mygame25bita.onrender.com/sounds/lose.mp3')
};
let isMuted = false;
let chatVolume = 0.5;
const BETS = {
    single: { cost: 100, multiplier: 2.5 },
    triple: { cost: 300, multiplier: 3.0 },
    hammer: { cost: 500, multiplier: 4.0 }
};

// تفعيل ميزة الطي عند تحميل الصفحة
// (تم نقل هذا الجزء إلى نهاية الملف بعد تعريف جميع الدوال)

// ضع هذا الجزء في نهاية الملف بعد تعريف جميع الدوال:
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تحميل الصفحة...');
    // تأخير قليل لضمان تحميل جميع العناصر
    setTimeout(() => {
        // The game is بالفعل initialized with initGame() call above
        // Just initialize the additional features
        initializeItemInfoModal();
        initializeCollapseFeatures();
        // Uncomment the line below to test effects on page load
        // testEffects();
    }, 500);
});

// Item Info Modal Functions
function initializeItemInfoModal() {
    const modal = document.getElementById('itemInfoModal');
    const openBtn = document.getElementById('itemInfoBtn');
    const closeBtn = document.getElementById('itemInfoClose');
    openBtn.addEventListener('click', () => {
        populateItemInfoModal();
        modal.classList.add('show');
    });
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

function populateItemInfoModal() {
    const itemInfoGrid = document.getElementById('itemInfoGrid');
    const collectionGoalsList = document.getElementById('collectionGoalsList');
    // Clear previous content
    itemInfoGrid.innerHTML = '';
    collectionGoalsList.innerHTML = '';
    // Add item cards
    Object.entries(ITEM_REWARDS).forEach(([itemType, itemData]) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-info-card';
        const pointsClass = itemData.points >= 0 ? 'positive' : 'negative';
        const pointsText = itemData.points >= 0 ? `+${itemData.points}` : `${itemData.points}`;
        itemCard.innerHTML = `
            <div class="item-info-emoji">${itemData.emoji}</div>
            <div class="item-info-details">
                <div class="item-info-name">${itemData.name}</div>
                <div class="item-info-description">${getItemDescription(itemType)}</div>
                <div class="item-info-points ${pointsClass}">${pointsText} نقطة</div>
            </div>
        `;
        itemInfoGrid.appendChild(itemCard);
    });
    // Add collection goals
    Object.entries(COLLECTION_GOALS).forEach(([itemType, goal]) => {
        const itemData = ITEM_REWARDS[itemType];
        if (!itemData) return; // Skip if not defined
        const goalItem = document.createElement('div');
        goalItem.className = 'collection-goal-item';
        goalItem.innerHTML = `
            <div class="collection-goal-info">
                <div class="collection-goal-emoji">${itemData.emoji}</div>
                <div class="collection-goal-text">اجمع ${goal.target} ${goal.name}</div>
            </div>
            <div class="collection-goal-reward">+${goal.reward} نقطة</div>
        `;
        collectionGoalsList.appendChild(goalItem);
    });
}

function getItemDescription(itemType) {
    const descriptions = {
        gem: 'جوهرة ثمينة تمنحك نقاط إضافية. اجمع 5 جواهر للحصول على مكافأة كبيرة!',
        key: 'مفتاح سحري يفتح أبواب الثروة. اجمع 3 مفاتيح للحصول على مكافأة!',
        coin: 'عملة ذهبية تزيد من رصيدك. جمع المزيد يعني المزيد من النقاط!',
        bomb: 'قنبلة خطيرة! تجنبها أو ستخسر نقاط. كن حذراً!',
        star: 'نجمة ساطعة تمنحك نقاط عالية. اجمع نجمتين للحصول على مكافأة!',
        bat: 'خفاش شرير يخصم من نقاطك. احذر منه!'
    };
    return descriptions[itemType] || 'عنصر غامض في اللعبة.';
}

function initializeCollapseFeatures() {
    console.log('🔧 تهيئة ميزة طي العناصر...');
    addCollapseButton('.right-panel', 'معلومات اللاعب');
    addCollapseButton('.header-container', 'الشعار والعنوان');
    addCollapseButton('.chat-container', 'المحادثة');
    addRestoreButton();
    loadCollapseStates();
    console.log('✅ تم تهيئة ميزة طي العناصر بنجاح');
}

function addRestoreButton() {
    const oldBtn = document.querySelector('.collapse-restore-btn');
    if (oldBtn) oldBtn.remove();
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'collapse-restore-btn';
    restoreBtn.innerHTML = '🔽';
    restoreBtn.title = 'إعادة ظهور العناصر المطوية';
    restoreBtn.onclick = function() { restoreAllCollapsed(); };
    document.body.appendChild(restoreBtn);
    updateRestoreButtonVisibility();
}

function updateRestoreButtonVisibility() {
    const restoreBtn = document.querySelector('.collapse-restore-btn');
    const collapsedElements = document.querySelectorAll('.collapsed');
    if (restoreBtn) {
        if (collapsedElements.length > 0) {
            restoreBtn.style.display = 'flex';
        } else {
            restoreBtn.style.display = 'none';
        }
    }
}

function restoreAllCollapsed() {
    const collapsedElements = document.querySelectorAll('.collapsed');
    collapsedElements.forEach(element => {
        const selector = element.dataset.collapseSelector;
        if (selector) {
            toggleCollapse(element, selector);
        }
    });
}

function addCollapseButton(selector, title) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`⚠️ العنصر ${selector} غير موجود`);
        return;
    }
    if (element.querySelector('.collapse-btn')) {
        console.log(`ℹ️ زر الطي موجود بالفعل في ${selector}`);
        return;
    }
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.innerHTML = '▲';
    collapseBtn.title = `طي ${title}`;
    collapseBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        z-index: 1000;
        transition: all 0.3s ease;
    `;
    collapseBtn.onclick = function(e) {
        e.stopPropagation();
        toggleCollapse(element, selector);
    };
    collapseBtn.onmouseenter = function() {
        this.style.background = 'rgba(255, 255, 255, 0.3)';
        this.style.transform = 'scale(1.1)';
    };
    collapseBtn.onmouseleave = function() {
        this.style.background = 'rgba(255, 255, 255, 0.2)';
        this.style.transform = 'scale(1)';
    };
    element.appendChild(collapseBtn);
    element.dataset.collapseSelector = selector;
    element.style.position = 'relative';
    element.style.transition = 'all 0.3s ease';
    console.log(`✅ تم إضافة زر الطي لـ ${selector}`);
}

function toggleCollapse(element, selector) {
    const isCollapsed = element.classList.contains('collapsed');
    const btn = element.querySelector('.collapse-btn');
    if (isCollapsed) {
        element.classList.remove('collapsed');
        element.style.display = '';
        if (btn) {
            btn.innerHTML = '▲';
            btn.title = btn.title.replace('فتح', 'طي');
        }
        console.log(`📱 فتح ${selector}`);
    } else {
        element.classList.add('collapsed');
        element.style.display = 'none';
        if (btn) {
            btn.innerHTML = '▼';
            btn.title = btn.title.replace('طي', 'فتح');
        }
        console.log(`📱 طي ${selector}`);
    }
    updateRestoreButtonVisibility();
    saveCollapseState(selector, !isCollapsed);
}

function saveCollapseState(selector, isCollapsed) {
    const states = JSON.parse(localStorage.getItem('collapseStates') || '{}');
    states[selector] = isCollapsed;
    localStorage.setItem('collapseStates', JSON.stringify(states));
    console.log(`💾 حفظ حالة ${selector}: ${isCollapsed ? 'مطوي' : 'مفتوح'}`);
}

function loadCollapseStates() {
    const states = JSON.parse(localStorage.getItem('collapseStates') || '{}');
    Object.keys(states).forEach(selector => {
        const element = document.querySelector(selector);
        if (element && states[selector]) {
            element.classList.add('collapsed');
            element.style.display = 'none';
            const btn = element.querySelector('.collapse-btn');
            if (btn) {
                btn.innerHTML = '▼';
                btn.title = btn.title.replace('طي', 'فتح');
            }
            console.log(`📱 استعادة حالة ${selector}: مطوي`);
        }
    });
    updateRestoreButtonVisibility();
}

// ... existing code ... 