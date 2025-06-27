// Ù…Ù„Ù Ø§Ù„Ù„Ø¹Ø¨Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ
// BACKEND_URL ÙŠØªÙ… ØªØ¹Ø±ÙŠÙÙ‡ ÙÙŠ navigation.js

// Ø£ØµÙˆØ§Øª
const sounds = {
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    buttonClick: new Audio('sounds/click.mp3'),
    singleShot: new Audio('sounds/single_shot.mp3'),
    tripleShot: new Audio('sounds/triple_shot.mp3'),
    hammerShot: new Audio('sounds/hammer_shot.mp3')
};

let isMuted = false;
let chatVolume = 0.5;

// Ø¯Ø§Ù„Ø© ØªØ´ØºÙŠÙ„ Ø§Ù„ØµÙˆØª
function playSound(soundName) {
    if (isMuted) return;
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

// ØªØµØ¯ÙŠØ± Ø¯Ø§Ù„Ø© playSound Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¹Ø§Ù…
window.playSound = playSound;

// Ø¯Ø§Ù„Ø© ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„Ù„Ø¹Ø¨Ø©
function updateGameUserData() {
    console.log('ðŸŽ® ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„Ù„Ø¹Ø¨Ø©...');
    
    // Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† navigation.js
    if (window.currentUser) {
        displayGameUserData(window.currentUser);
    } else {
        // Ø¥Ø°Ø§ Ù„Ù… ØªÙƒÙ† Ù…ØªØ§Ø­Ø©ØŒ Ù†Ø­Ø§ÙˆÙ„ ØªØ­Ù…ÙŠÙ„Ù‡Ø§
        loadGameUserData();
    }
}

// Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„Ù„Ø¹Ø¨Ø©
function displayGameUserData(userData) {
    console.log('ðŸ“Š Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„Ù„Ø¹Ø¨Ø©:', userData);
    
    // Ø¹Ø±Ø¶ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = userData.username || userData.displayName || 'Ù…Ø³ØªØ®Ø¯Ù…';
    }
    
    // Ø¹Ø±Ø¶ Ø§Ù„Ø±ØµÙŠØ¯
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay) {
        const balance = userData.balance || userData.stats?.score || 0;
        balanceDisplay.textContent = balance.toLocaleString();
    }
    
    // Ø¹Ø±Ø¶ Ø§Ù„Ù„Ø¢Ù„Ø¦
    const pearlBalance = document.getElementById('pearl-balance');
    if (pearlBalance) {
        const pearls = userData.pearls || userData.stats?.pearls || 0;
        pearlBalance.textContent = pearls.toLocaleString();
    }
    
    console.log('âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù„Ø¹Ø¨Ø© Ø¨Ù†Ø¬Ø§Ø­');
}

// ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù„Ù„Ø¹Ø¨Ø©
async function loadGameUserData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            window.currentUser = userData;
            displayGameUserData(userData);
        }
    } catch (error) {
        console.error('âŒ Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù„Ø¹Ø¨Ø©:', error);
    }
}

// ØªØµØ¯ÙŠØ± Ø§Ù„Ø¯ÙˆØ§Ù„ Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¹Ø§Ù…
window.updateGameUserData = updateGameUserData;
window.displayGameUserData = displayGameUserData;

// ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¹Ù†Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸŽ® ØªØ­Ù…ÙŠÙ„ ØµÙØ­Ø© Ø§Ù„Ù„Ø¹Ø¨Ø©...');
    
    // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¹Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©
    setTimeout(() => {
        updateGameUserData();
    }, 1000);
    
    // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙƒÙ„ 30 Ø«Ø§Ù†ÙŠØ©
    setInterval(() => {
        updateGameUserData();
    }, 30000);
}); 