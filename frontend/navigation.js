﻿// Ù…Ù„Ù Ø§Ù„ØªÙ†Ù‚Ù„ - ÙŠØªØ¹Ø§Ù…Ù„ Ù…Ø¹ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„ Ø¨ÙŠÙ† Ø§Ù„ØµÙØ­Ø§Øª
const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// Ø¯Ø§Ù„Ø© ØªØ´ØºÙŠÙ„ Ø§Ù„ØµÙˆØª (Ù…Ø¤Ù‚ØªØ© Ù„Ø­Ù„ Ù…Ø´ÙƒÙ„Ø© ReferenceError)
function playSound(soundName) {
    try {
        // Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ø¯Ø§Ù„Ø© playSound Ù…Ù† game.js Ø¥Ø°Ø§ ÙƒØ§Ù†Øª Ù…ØªØ§Ø­Ø©
        if (typeof window.playSound === 'function') {
            window.playSound(soundName);
            return;
        }
        
        // Ø¥Ø°Ø§ Ù„Ù… ØªÙƒÙ† Ù…ØªØ§Ø­Ø©ØŒ Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø£ØµÙˆØ§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©
        const sounds = {
            buttonClick: document.getElementById('buttonClick'),
            win: document.getElementById('winSound'),
            lose: document.getElementById('loseSound')
        };
        
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    } catch (error) {
        console.log('Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ´ØºÙŠÙ„ Ø§Ù„ØµÙˆØª:', soundName);
    }
}

// Ø¯Ø§Ù„Ø© ØªÙ‡ÙŠØ¦Ø© Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„
function initializeNavigation() {
    console.log('ðŸš€ ØªÙ‡ÙŠØ¦Ø© Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„...');
    
    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø­Ø§Ù„Ø© ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹
    checkAuthStatus().then(() => {
        setupNavigationButtons();
        setupExitWarning(); // Ø¥Ø¶Ø§ÙØ© Ø§Ù„ØªØ­Ø°ÙŠØ± Ø¹Ù†Ø¯ Ø§Ù„Ø®Ø±ÙˆØ¬
    });
}

// Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„ØªØ­Ø°ÙŠØ± Ø¹Ù†Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø®Ø±ÙˆØ¬
function setupExitWarning() {
    console.log('âš ï¸ Ø¥Ø¹Ø¯Ø§Ø¯ ØªØ­Ø°ÙŠØ± Ø§Ù„Ø®Ø±ÙˆØ¬...');
    
    // Ø§Ù„ØªØ­Ø°ÙŠØ± Ø¹Ù†Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ØªØ¨ÙˆÙŠØ¨/Ø§Ù„Ù…ØªØµÙØ­
    window.addEventListener('beforeunload', function(e) {
        // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø£Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø³Ø¬Ù„ Ø¯Ø®ÙˆÙ„
        if (window.currentUser) {
            const message = 'Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ø®Ø±ÙˆØ¬ Ù…Ù† Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŸ Ø³ÙŠØªÙ… ÙÙ‚Ø¯Ø§Ù† ØªÙ‚Ø¯Ù…Ùƒ ÙÙŠ Ø§Ù„Ù„Ø¹Ø¨Ø©.';
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });
    
    // Ø§Ù„ØªØ­Ø°ÙŠØ± Ø¹Ù†Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„ØµÙØ­Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©
    window.addEventListener('popstate', function(e) {
        if (window.currentUser) {
            e.preventDefault();
            showExitConfirmation();
        }
    });
    
    // Ù…Ù†Ø¹ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø²Ø± Ø§Ù„Ø¹ÙˆØ¯Ø© ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function() {
        if (window.currentUser) {
            history.pushState(null, null, location.href);
            showExitConfirmation();
        }
    });
    
    console.log('âœ… ØªÙ… Ø¥Ø¹Ø¯Ø§Ø¯ ØªØ­Ø°ÙŠØ± Ø§Ù„Ø®Ø±ÙˆØ¬');
}

// Ø¹Ø±Ø¶ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø®Ø±ÙˆØ¬
function showExitConfirmation() {
    const confirmed = confirm('Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ø®Ø±ÙˆØ¬ Ù…Ù† Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŸ\n\nâœ… Ø§Ù„Ø¨Ù‚Ø§Ø¡ - Ù„Ù„Ø§Ø³ØªÙ…Ø±Ø§Ø± ÙÙŠ Ø§Ù„Ù„Ø¹Ø¨Ø©\nâŒ Ø§Ù„Ø®Ø±ÙˆØ¬ - Ù„Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„ØµÙØ­Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©');
    
    if (confirmed) {
        // Ø¥Ø°Ø§ Ø§Ø®ØªØ§Ø± Ø§Ù„Ø®Ø±ÙˆØ¬ØŒ Ù†Ø³Ù…Ø­ Ø¨Ø§Ù„Ø¹ÙˆØ¯Ø©
        window.history.back();
    } else {
        // Ø¥Ø°Ø§ Ø§Ø®ØªØ§Ø± Ø§Ù„Ø¨Ù‚Ø§Ø¡ØŒ Ù†Ø¨Ù‚Ù‰ ÙÙŠ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©
        console.log('ðŸ‘¤ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ø®ØªØ§Ø± Ø§Ù„Ø¨Ù‚Ø§Ø¡ ÙÙŠ Ø§Ù„Ù…ÙˆÙ‚Ø¹');
    }
}

// Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø­Ø§Ù„Ø© Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ù…Ù† Ø§Ù„Ø®Ø§Ø¯Ù…
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('âŒ Ù„Ø§ ÙŠÙˆØ¬Ø¯ tokenØŒ Ø¥Ø®ÙØ§Ø¡ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„');
        hideAllNavigationButtons();
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('âœ… ØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©:', userData.username);
            
            // Ø­ÙØ¸ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„Ø°Ø§ÙƒØ±Ø© (ÙˆÙ„ÙŠØ³ localStorage)
            window.currentUser = userData;
            
            // Ø¥Ø¸Ù‡Ø§Ø± Ø§Ù„Ø£Ø²Ø±Ø§Ø± Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø© Ø­Ø³Ø¨ Ù†ÙˆØ¹ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
            showNavigationButtons(userData);
            
            // Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©
            displayUserData(userData);
            
        } else {
            console.log('âŒ token ØºÙŠØ± ØµØ§Ù„Ø­ØŒ Ø¥Ø®ÙØ§Ø¡ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('isAdmin');
            hideAllNavigationButtons();
        }
    } catch (error) {
        console.error('âŒ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©:', error);
        hideAllNavigationButtons();
    }
}

// Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©
function displayUserData(userData) {
    console.log('ðŸ“Š Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…:', userData);
    
    // Ø¹Ø±Ø¶ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = userData.username || userData.displayName || 'Ù…Ø³ØªØ®Ø¯Ù…';
        console.log('âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…:', usernameDisplay.textContent);
    }
    
    // Ø¹Ø±Ø¶ Ø§Ù„Ø±ØµÙŠØ¯
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay) {
        const balance = userData.balance || userData.stats?.score || 0;
        balanceDisplay.textContent = balance.toLocaleString();
        console.log('âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø±ØµÙŠØ¯:', balance);
    }
    
    // Ø¹Ø±Ø¶ Ø§Ù„Ù„Ø¢Ù„Ø¦
    const pearlBalance = document.getElementById('pearl-balance');
    if (pearlBalance) {
        const pearls = userData.pearls || userData.stats?.pearls || 0;
        pearlBalance.textContent = pearls.toLocaleString();
        console.log('âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù„Ø¢Ù„Ø¦:', pearls);
    }
    
    // Ø¹Ø±Ø¶ Ù…Ø¹Ø±Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¥Ø°Ø§ ÙƒØ§Ù† Ù…ØªÙˆÙØ±Ø§Ù‹
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay && userData.userId) {
        userIdDisplay.textContent = `ID: ${userData.userId}`;
    }
    
    console.log('âœ… ØªÙ… Ø¹Ø±Ø¶ Ø¬Ù…ÙŠØ¹ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ù†Ø¬Ø§Ø­');
}

// Ø¥Ø¹Ø¯Ø§Ø¯ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„
function setupNavigationButtons() {
    // Ø²Ø± Ø§Ù„Ø¨Ø±ÙˆÙØ§ÙŠÙ„
    const profileButton = document.getElementById('profile-button');
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'profile.html';
            } else {
                showMessage('ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹', 'error');
            }
        });
    }
    
    // Ø²Ø± Ø§Ù„ØªØ¯Ø§ÙˆÙ„
    const tradingButton = document.getElementById('trading-button');
    if (tradingButton) {
        tradingButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'trading.html';
            } else {
                showMessage('ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹', 'error');
            }
        });
    }
    
    // Ø²Ø± Ø§Ù„Ù‡Ø¯Ø§ÙŠØ§
    const giftsButton = document.getElementById('gifts-button');
    if (giftsButton) {
        giftsButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'gifts.html';
            } else {
                showMessage('ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹', 'error');
            }
        });
    }
    
    // Ø²Ø± Ø§Ù„Ø¯Ø±Ø¹
    const shieldButton = document.getElementById('shield-button');
    if (shieldButton) {
        shieldButton.addEventListener('click', () => {
            playSound('buttonClick');
            if (window.currentUser) {
                window.location.href = 'shield.html';
            } else {
                showMessage('ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹', 'error');
            }
        });
    }
    
    // Ø²Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            playSound('buttonClick');
            handleLogout();
        });
    }
    
    console.log('âœ… ØªÙ… Ø¥Ø¹Ø¯Ø§Ø¯ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„');
}

// Ø¥Ø¸Ù‡Ø§Ø± Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„ Ø­Ø³Ø¨ Ù†ÙˆØ¹ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
function showNavigationButtons(userData) {
    const buttons = {
        profile: document.getElementById('profile-button'),
        trading: document.getElementById('trading-button'),
        gifts: document.getElementById('gifts-button'),
        shield: document.getElementById('shield-button'),
        logout: document.getElementById('logout-button')
    };
    
    // Ø¥Ø¸Ù‡Ø§Ø± Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ø²Ø±Ø§Ø± Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø§Ù„Ø¹Ø§Ø¯ÙŠÙŠÙ†
    Object.values(buttons).forEach(button => {
        if (button) {
            button.style.display = 'flex';
            button.disabled = false;
        }
    });
    
    // Ø¥Ø¶Ø§ÙØ© ØªØ£Ø«ÙŠØ±Ø§Øª Ø¨ØµØ±ÙŠØ© Ù„Ù„Ø£Ø²Ø±Ø§Ø±
    Object.values(buttons).forEach(button => {
        if (button) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    });
    
    console.log('âœ… ØªÙ… Ø¥Ø¸Ù‡Ø§Ø± Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„ Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…:', userData.username);
}

// Ø¥Ø®ÙØ§Ø¡ Ø¬Ù…ÙŠØ¹ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„
function hideAllNavigationButtons() {
    const buttons = [
        'profile-button',
        'trading-button', 
        'gifts-button',
        'shield-button',
        'logout-button'
    ];
    
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'none';
            button.disabled = true;
        }
    });
    
    console.log('âŒ ØªÙ… Ø¥Ø®ÙØ§Ø¡ Ø¬Ù…ÙŠØ¹ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„');
}

// Ù…Ø¹Ø§Ù„Ø¬Ø© ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬
function handleLogout() {
    if (confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ØŸ')) {
        // Ø­Ø°Ù Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        
        // Ø­Ø°Ù Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ø§Ù„Ø°Ø§ÙƒØ±Ø©
        window.currentUser = null;
        
        // Ø¥Ø®ÙØ§Ø¡ Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„
        hideAllNavigationButtons();
        
        // Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ Ù„ØµÙØ­Ø© ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
        window.location.href = 'index.html';
        
        console.log('âœ… ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¨Ù†Ø¬Ø§Ø­');
    }
}

// Ø¯Ø§Ù„Ø© Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„
function showMessage(message, type = 'info') {
    // Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø¹Ù†ØµØ± Ø¹Ø±Ø¶ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„
    let messageContainer = document.getElementById('message-box') || 
                          document.getElementById('message-area') ||
                          document.querySelector('.message-area');
    
    if (messageContainer) {
        // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©
        messageContainer.innerHTML = '';
        
        // Ø¥Ù†Ø´Ø§Ø¡ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù„Ù„Ø­Ø§ÙˆÙŠØ©
        messageContainer.appendChild(messageElement);
        
        // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø¨Ø¹Ø¯ 5 Ø«ÙˆØ§Ù†Ù
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    } else {
        // Ø¥Ø°Ø§ Ù„Ù… Ù†Ø¬Ø¯ Ø­Ø§ÙˆÙŠØ© Ù„Ù„Ø±Ø³Ø§Ø¦Ù„ØŒ Ù†Ø³ØªØ®Ø¯Ù… alert
        alert(message);
    }
}

// Ø¯Ø§Ù„Ø© Ù„ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ø£Ø²Ø±Ø§Ø± Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù…
async function refreshNavigationStatus() {
    console.log('ðŸ”„ ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        hideAllNavigationButtons();
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            window.currentUser = userData;
            showNavigationButtons(userData);
            
            // ØªØ­Ø¯ÙŠØ« Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
            displayUserData(userData);
        } else {
            hideAllNavigationButtons();
        }
    } catch (error) {
        console.error('âŒ Ø®Ø·Ø£ ÙÙŠ ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„ØªÙ†Ù‚Ù„:', error);
        hideAllNavigationButtons();
    }
}

// ØªØµØ¯ÙŠØ± Ø§Ù„Ø¯ÙˆØ§Ù„ Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… ÙÙŠ Ù…Ù„ÙØ§Øª Ø£Ø®Ø±Ù‰
window.Navigation = {
    initialize: initializeNavigation,
    refresh: refreshNavigationStatus,
    showMessage: showMessage,
    handleLogout: handleLogout,
    showExitConfirmation: showExitConfirmation,
    displayUserData: displayUserData
};

// Ø¯Ø§Ù„Ø© Ù„ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙŠØ¯ÙˆÙŠØ§Ù‹
function refreshUserData() {
    if (window.currentUser) {
        displayUserData(window.currentUser);
    } else {
        checkAuthStatus();
    }
}

// ØªØµØ¯ÙŠØ± Ø¯Ø§Ù„Ø© ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
window.refreshUserData = refreshUserData;

// ØªÙ‡ÙŠØ¦Ø© Ø§Ù„ØªÙ†Ù‚Ù„ Ø¹Ù†Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸ“± ØªØ­Ù…ÙŠÙ„ Ù†Ø¸Ø§Ù… Ø§Ù„ØªÙ†Ù‚Ù„...');
    initializeNavigation();
    
    // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¹Ø¯ Ø«Ø§Ù†ÙŠØªÙŠÙ† Ù„Ù„ØªØ£ÙƒØ¯ Ù…Ù† ØªØ­Ù…ÙŠÙ„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¹Ù†Ø§ØµØ±
    setTimeout(() => {
        refreshUserData();
    }, 2000);
});

// ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„ØªÙ†Ù‚Ù„ ÙƒÙ„ 5 Ø¯Ù‚Ø§Ø¦Ù‚
setInterval(() => {
    if (window.currentUser) {
        refreshNavigationStatus();
    }
}, 5 * 60 * 1000); 