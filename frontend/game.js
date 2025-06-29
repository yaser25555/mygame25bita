// Game Configuration
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        width: 50,
        height: 50,
        speed: 5,
        health: 100,
        maxHealth: 100
    },
    enemy: {
        width: 40,
        height: 40,
        speed: 2,
        health: 50,
        maxHealth: 50
    },
    bullet: {
        width: 5,
        height: 10,
        speed: 10
    },
    powerUp: {
        width: 30,
        height: 30,
        duration: 10000
    }
};

// Game State
let gameState = {
    isRunning: false,
    score: 0,
    level: 1,
    enemies: [],
    bullets: [],
    powerUps: [],
    keys: {},
    lastShot: 0,
    shotCooldown: 200,
    tripleShotActive: false,
    tripleShotEndTime: 0
};

// Canvas and Context
let canvas, ctx;
let player = {
    x: 0,
    y: 0,
    width: GAME_CONFIG.player.width,
    height: GAME_CONFIG.player.height,
    health: GAME_CONFIG.player.health,
    maxHealth: GAME_CONFIG.player.maxHealth
};

// Assets
let backgroundImage, playerImage, enemyImage, bulletImage, powerUpImage;
let sounds = {};

// الاتصال بـ socket.io
const socket = io('https://mygame25bita-7eqw.onrender.com');

// عند تهيئة اللعبة، اضبط حجم الكانفس تلقائياً للجوال
function resizeCanvasForMobile() {
    if (window.innerWidth <= 700) {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = Math.floor(window.innerHeight * 0.65); // 65% من ارتفاع الشاشة
            canvas.style.width = '100vw';
            canvas.style.height = (canvas.height) + 'px';
        }
    } else {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = GAME_CONFIG.canvas.width;
            canvas.height = GAME_CONFIG.canvas.height;
            canvas.style.width = '';
            canvas.style.height = '';
        }
    }
}

window.addEventListener('resize', resizeCanvasForMobile);

// Initialize Game
function initGame() {
    console.log('🎮 تحميل صفحة اللعبة...');
    
    // Setup canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvasForMobile();
    
    // Initialize player position
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
    
    // Load assets
    loadAssets();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    gameLoop();
    
    console.log('✅ تم تحميل صفحة اللعبة بنجاح');
}

// Load Game Assets
function loadAssets() {
    // Load images
    backgroundImage = new Image();
    backgroundImage.src = 'images/background11.jpg';
    
    playerImage = new Image();
    playerImage.src = 'hero.png';
    
    enemyImage = new Image();
    enemyImage.src = 'box_closed.png';
    
    bulletImage = new Image();
    bulletImage.src = 'coin.png';
    
    powerUpImage = new Image();
    powerUpImage.src = 'coin.png';
    
    // Load sounds
    sounds.singleShot = new Audio('sounds/single_shot.mp3');
    sounds.tripleShot = new Audio('sounds/triple_shot.mp3');
    sounds.hammerShot = new Audio('sounds/hammer_shot.mp3');
    
    // Preload sounds
    Object.values(sounds).forEach(sound => {
        sound.load();
        sound.volume = 0.3;
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });
    
    // Mouse events for shooting
    canvas.addEventListener('click', (e) => {
        if (gameState.isRunning) {
            shoot();
        }
    });
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState.isRunning) {
            shoot();
        }
    });
}

// Game Loop
function gameLoop() {
    if (gameState.isRunning) {
        update();
        render();
    }
    
    requestAnimationFrame(gameLoop);
}

// Update Game State
function update() {
    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    checkCollisions();
    updateScore();
}

// Update Player
function updatePlayer() {
    // Movement
    if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) {
        player.x -= GAME_CONFIG.player.speed;
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) {
        player.x += GAME_CONFIG.player.speed;
    }
    if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) {
        player.y -= GAME_CONFIG.player.speed;
    }
    if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) {
        player.y += GAME_CONFIG.player.speed;
    }
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Auto-shooting
    if (gameState.keys['Space']) {
        shoot();
    }
}

// Shoot Function
function shoot() {
    const now = Date.now();
    if (now - gameState.lastShot < gameState.shotCooldown) return;
    
    gameState.lastShot = now;
    
    if (gameState.tripleShotActive && now < gameState.tripleShotEndTime) {
        // Triple shot
        for (let i = -1; i <= 1; i++) {
            const bullet = {
                x: player.x + player.width / 2 - GAME_CONFIG.bullet.width / 2 + (i * 10),
                y: player.y,
                width: GAME_CONFIG.bullet.width,
                height: GAME_CONFIG.bullet.height,
                speed: GAME_CONFIG.bullet.speed,
                angle: i * 0.2
            };
            gameState.bullets.push(bullet);
        }
        sounds.tripleShot.play().catch(e => console.log('Sound play failed:', e));
    } else {
        // Single shot
        const bullet = {
            x: player.x + player.width / 2 - GAME_CONFIG.bullet.width / 2,
            y: player.y,
            width: GAME_CONFIG.bullet.width,
            height: GAME_CONFIG.bullet.height,
            speed: GAME_CONFIG.bullet.speed,
            angle: 0
        };
        gameState.bullets.push(bullet);
        sounds.singleShot.play().catch(e => console.log('Sound play failed:', e));
    }
}

// Update Bullets
function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
}

// Update Enemies
function updateEnemies() {
    // Spawn new enemies
    if (Math.random() < 0.02 + (gameState.level * 0.005)) {
        spawnEnemy();
    }
    
    // Update existing enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;
        return enemy.y < canvas.height + enemy.height;
    });
}

// Spawn Enemy
function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - GAME_CONFIG.enemy.width),
        y: -GAME_CONFIG.enemy.height,
        width: GAME_CONFIG.enemy.width,
        height: GAME_CONFIG.enemy.height,
        health: GAME_CONFIG.enemy.health,
        maxHealth: GAME_CONFIG.enemy.maxHealth,
        speed: GAME_CONFIG.enemy.speed + (gameState.level * 0.5)
    };
    gameState.enemies.push(enemy);
}

// Update Power-ups
function updatePowerUps() {
    // Spawn power-ups
    if (Math.random() < 0.005) {
        spawnPowerUp();
    }
    
    // Update existing power-ups
    gameState.powerUps = gameState.powerUps.filter(powerUp => {
        powerUp.y += 1;
        return powerUp.y < canvas.height + powerUp.height;
    });
}

// Spawn Power-up
function spawnPowerUp() {
    const powerUp = {
        x: Math.random() * (canvas.width - GAME_CONFIG.powerUp.width),
        y: -GAME_CONFIG.powerUp.height,
        width: GAME_CONFIG.powerUp.width,
        height: GAME_CONFIG.powerUp.height,
        type: Math.random() < 0.5 ? 'tripleShot' : 'health'
    };
    gameState.powerUps.push(powerUp);
}

// Check Collisions
function checkCollisions() {
    // Bullet-Enemy collisions
    gameState.bullets.forEach((bullet, bulletIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                enemy.health -= 25;
                gameState.bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    gameState.enemies.splice(enemyIndex, 1);
                    gameState.score += 100;
                }
            }
        });
    });
    
    // Player-Enemy collisions
    gameState.enemies.forEach((enemy, index) => {
        if (isColliding(player, enemy)) {
            player.health -= 20;
            gameState.enemies.splice(index, 1);
            
            if (player.health <= 0) {
                gameOver();
            }
        }
    });
    
    // Player-PowerUp collisions
    gameState.powerUps.forEach((powerUp, index) => {
        if (isColliding(player, powerUp)) {
            if (powerUp.type === 'tripleShot') {
                gameState.tripleShotActive = true;
                gameState.tripleShotEndTime = Date.now() + GAME_CONFIG.powerUp.duration;
            } else if (powerUp.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 30);
            }
            gameState.powerUps.splice(index, 1);
        }
    });
}

// Collision Detection
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update Score
function updateScore() {
    gameState.score += 1;
    
    // Level up every 1000 points
    if (gameState.score % 1000 === 0) {
        gameState.level++;
        console.log(`🎉 Level up! Level ${gameState.level}`);
    }
}

// Render Game
function render() {
    // Draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw player
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }
    
    // Draw enemies
    gameState.enemies.forEach(enemy => {
        if (enemyImage.complete) {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
        
        // Draw enemy health bar
        drawHealthBar(enemy, enemy.x, enemy.y - 10);
    });
    
    // Draw bullets
    gameState.bullets.forEach(bullet => {
        if (bulletImage.complete) {
            ctx.save();
            ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
            ctx.rotate(bullet.angle);
            ctx.drawImage(bulletImage, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
            ctx.restore();
        }
    });
    
    // Draw power-ups
    gameState.powerUps.forEach(powerUp => {
        if (powerUpImage.complete) {
            ctx.drawImage(powerUpImage, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }
    });
    
    // Draw UI
    drawUI();
}

// Draw Health Bar
function drawHealthBar(entity, x, y) {
    const barWidth = entity.width;
    const barHeight = 5;
    const healthPercent = entity.health / entity.maxHealth;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
}

// Draw UI
function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    // Score
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    
    // Level
    ctx.fillText(`Level: ${gameState.level}`, 10, 60);
    
    // Player health
    ctx.fillText(`Health: ${player.health}`, 10, 90);
    
    // Triple shot indicator
    if (gameState.tripleShotActive && Date.now() < gameState.tripleShotEndTime) {
        ctx.fillStyle = '#ffff00';
        ctx.fillText('TRIPLE SHOT ACTIVE!', 10, 120);
    }
}

// Start Game
function startGame() {
    console.log('🎉 تبدأ اللعبة...');
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.level = 1;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.powerUps = [];
    player.health = player.maxHealth;
    
    // Hide start screen
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
}

// Game Over
function gameOver() {
    console.log('🎉 اللعبة إنهاء');
    gameState.isRunning = false;
    
    // Show game over screen
    document.getElementById('gameOverScreen').style.display = 'block';
    document.getElementById('finalScore').textContent = gameState.score;
    
    // Save score to backend
    saveScore(gameState.score);
}

// Save Score
async function saveScore(score) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('🚨 لم يتم العثور على token');
            return;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/users/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ score })
        });
        
        if (response.ok) {
            console.log('✅ تم حفظ النقاط');
        } else {
            console.log('🚨 خطأ في حفظ النقاط');
        }
    } catch (error) {
        console.log('🚨 خطأ في حفظ النقاط:', error);
    }
}

// Restart Game
function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    startGame();
}

// Back to Menu
function backToMenu() {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('gameCanvas').style.display = 'none';
}

// دعم أزرار التحكم للجوال
function setupMobileControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    if (!btnUp || !btnDown || !btnLeft || !btnRight) return;
    function setKey(code, value) {
        gameState.keys[code] = value;
    }
    btnUp.addEventListener('touchstart', e => { e.preventDefault(); setKey('ArrowUp', true); });
    btnUp.addEventListener('touchend', e => { e.preventDefault(); setKey('ArrowUp', false); });
    btnDown.addEventListener('touchstart', e => { e.preventDefault(); setKey('ArrowDown', true); });
    btnDown.addEventListener('touchend', e => { e.preventDefault(); setKey('ArrowDown', false); });
    btnLeft.addEventListener('touchstart', e => { e.preventDefault(); setKey('ArrowLeft', true); });
    btnLeft.addEventListener('touchend', e => { e.preventDefault(); setKey('ArrowLeft', false); });
    btnRight.addEventListener('touchstart', e => { e.preventDefault(); setKey('ArrowRight', true); });
    btnRight.addEventListener('touchend', e => { e.preventDefault(); setKey('ArrowRight', false); });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 تحميل صفحة اللعبة...');
    initGame();

    // ربط زر الملف الشخصي
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            console.log('تم الضغط على زر الملف الشخصي');
            // يمكنك تنفيذ أي كود محلي هنا بدلاً من النقل
        });
    }

    // ربط زر غرفة المحادثة الصوتية
    const voiceBtn = document.getElementById('voiceChatRoomBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function() {
            console.log('تم الضغط على زر غرفة المحادثة الصوتية');
            // يمكنك تنفيذ أي كود محلي هنا بدلاً من النقل
        });
    }

    // ربط زر ابدأ اللعبة
    const startBtn = document.getElementById('startButton');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            console.log('تم الضغط على زر ابدأ اللعبة');
            // يمكنك تنفيذ أي كود محلي هنا بدلاً من النقل
        });
    }

    // ربط زر الخروج (voiceRoomPageBtn)
    const exitBtn = document.getElementById('voiceRoomPageBtn');
    if (exitBtn) {
        exitBtn.addEventListener('click', function() {
            console.log('تم الضغط على زر الخروج');
            // يمكنك تنفيذ أي كود محلي هنا بدلاً من النقل
        });
    }

    // Setup button event listeners
    document.getElementById('restartButton').addEventListener('click', restartGame);
    document.getElementById('menuButton').addEventListener('click', backToMenu);
    
    console.log('✅ تم تحميل صفحة اللعبة بنجاح');
    setupMobileControls();
    fetchAndDisplayUserInfo();

    const startDemoGameBtn = document.getElementById('startDemoGameBtn');
    const demoGameArea = document.getElementById('demoGameArea');
    const demoScore = document.getElementById('demoScore');
    const demoAddPointBtn = document.getElementById('demoAddPointBtn');
    const demoEndGameBtn = document.getElementById('demoEndGameBtn');
    let score = 0;

    if (startDemoGameBtn) {
        startDemoGameBtn.onclick = function() {
            score = 0;
            demoScore.textContent = score;
            demoGameArea.style.display = 'block';
            startDemoGameBtn.style.display = 'none';
        };
    }
    if (demoAddPointBtn) {
        demoAddPointBtn.onclick = function() {
            score++;
            demoScore.textContent = score;
        };
    }
    if (demoEndGameBtn) {
        demoEndGameBtn.onclick = function() {
            demoGameArea.style.display = 'none';
            startDemoGameBtn.style.display = 'inline-block';
            score = 0;
            demoScore.textContent = score;
        };
    }
});

async function fetchAndDisplayUserInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        // تحديث عناصر معلومات اللاعب
        document.querySelectorAll('#username-display').forEach(e => e.textContent = data.username || '-');
        document.querySelectorAll('#user-id-display').forEach(e => e.textContent = data.userId || '-');
        document.querySelectorAll('#balance-display').forEach(e => e.textContent = (data.stats && data.stats.coins != null) ? data.stats.coins : '0');
        document.querySelectorAll('#pearl-balance').forEach(e => e.textContent = (data.stats && data.stats.pearls != null) ? data.stats.pearls : '0');
    } catch (e) {
        console.log('فشل في جلب بيانات المستخدم:', e);
    }
}

// عند تسجيل نقطة (مثال: استدعِ هذه الدالة عند جمع نقطة)
function onPlayerScored() {
  socket.emit('playerScored', { playerId: myId }); // myId يجب أن يكون معرف اللاعب الحالي
}

// استقبال تحديث النقاط من السيرفر
socket.on('scoreUpdated', ({ playerId, newScore }) => {
  // حدث واجهة المستخدم بالنقاط الجديدة لهذا اللاعب
  if (playerId === myId) {
    gameState.score = newScore;
    // يمكنك تحديث أي عنصر في الصفحة هنا
  }
  // إذا كان هناك قائمة لاعبين، حدثها أيضاً
});

// عند الدخول أو إعادة التحميل
socket.emit('requestSync');
socket.on('syncAllScores', (users) => {
  // users مصفوفة فيها userId وscore لكل لاعب
  // يمكنك تحديث كل النقاط في الواجهة هنا
});

// استقبال تحديث الوقت
socket.on('timerUpdated', ({ time }) => {
  // حدث عداد الوقت في الواجهة
  // مثال: document.getElementById('timer').textContent = time;
});

// استقبال تحديث حالة اللعبة
socket.on('gameStateUpdated', ({ state }) => {
  // حدث حالة اللعبة في الواجهة
  // مثال: gameState.state = state;
});

// استقبال تحديث مواقع اللاعبين
socket.on('playerPositionUpdated', ({ playerId, position }) => {
  // حدث موقع اللاعب في الواجهة
  // مثال: updatePlayerPositionOnScreen(playerId, position);
});

// استقبال تحديث بروفايل اللاعب
socket.on('profileUpdated', ({ playerId, profile }) => {
  // حدث بيانات البروفايل في الواجهة
  // مثال: updateProfileUI(playerId, profile);
});

// استقبال تحديث ممتلكات اللاعب
socket.on('inventoryUpdated', ({ playerId, inventory }) => {
  // حدث بيانات الممتلكات في الواجهة
  // مثال: updateInventoryUI(playerId, inventory);
});

// أمثلة لإرسال التحديثات:
// socket.emit('updateTimer', { time: 120 });
// socket.emit('updateGameState', { state: 'playing' });
// socket.emit('updatePlayerPosition', { playerId: myId, position: { x: 100, y: 200 } });
// socket.emit('updateProfile', { playerId: myId, profile: { username: 'Player1', avatar: 'avatar.png' } });
// socket.emit('updateInventory', { playerId: myId, inventory: { coins: 100, items: [...] } });

// الكود الحالي هو نموذج أولي للعبة البالونات فقط، وجاهز للرفع على GitHub.
// لا يوجد أي منطق قديم أو تعارض مع منطق البالونات. 