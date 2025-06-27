// أصوات
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

// دالة تشغيل الصوت
function playSound(soundName) {
    if (isMuted) return;
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

// تصدير دالة playSound للاستخدام العام
window.playSound = playSound; 