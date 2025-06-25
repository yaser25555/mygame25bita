// ملف game.js: يرجى نقل جميع أكواد الجافاسكريبت من <script> في game.html إلى هنا. 

const BACKEND_URL = 'https://mygame25bita.onrender.com';

// Game State
let score = 0;
let highScore = 0;
let roundNumber = 1;
let username = '';
let isProcessingShot = false;

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

// ... existing code ... 