// لودو موبايل - منطق أساسي للوحة اللاعبين (نسخة أولية)
// هذه النسخة تدعم رسم اللوحة وتحريك الرموز بشكل مبسط وتجريبي

const boardSize = 15;
const ludoBoard = document.getElementById('ludoBoard');
const statusDiv = document.getElementById('ludoStatus');
const startBtn = document.getElementById('startLudoBtn');
const rollBtn = document.getElementById('rollDiceBtn');

// إعداد اللاعبين (أربعة لاعبين افتراضيًا)
const players = [
  { color: 'red',   name: 'أحمر',   class: 'ludo-player-red',   tokens: [], home: [1,1] },
  { color: 'yellow',name: 'أصفر',   class: 'ludo-player-yellow',tokens: [], home: [13,1] },
  { color: 'green', name: 'أخضر',   class: 'ludo-player-green', tokens: [], home: [1,13] },
  { color: 'blue',  name: 'أزرق',   class: 'ludo-player-blue',  tokens: [], home: [13,13] }
];
let currentPlayer = 0;
let diceValue = 1;
let gameStarted = false;

function drawBoard() {
  ludoBoard.innerHTML = '';
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = document.createElement('div');
      cell.className = 'ludo-cell';
      // تلوين بيوت اللاعبين
      if (row < 6 && col < 6) cell.classList.add('ludo-player-red');
      if (row < 6 && col > 8) cell.classList.add('ludo-player-yellow');
      if (row > 8 && col < 6) cell.classList.add('ludo-player-green');
      if (row > 8 && col > 8) cell.classList.add('ludo-player-blue');
      // المربع المركزي
      if (row >= 6 && row <= 8 && col >= 6 && col <= 8) cell.classList.add('ludo-home');
      cell.style.gridColumn = col + 1;
      cell.style.gridRow = row + 1;
      cell.id = `cell-${row}-${col}`;
      ludoBoard.appendChild(cell);
    }
  }
}

function placeTokens() {
  // ضع رمز كل لاعب في بيته
  players.forEach((player, idx) => {
    player.tokens = [];
    for (let i = 0; i < 2; i++) { // لكل لاعب رمز واحدين فقط كبداية
      const [homeRow, homeCol] = player.home;
      const cell = document.getElementById(`cell-${homeRow + i}-${homeCol}`);
      const token = document.createElement('div');
      token.className = `ludo-token ${player.class}`;
      token.title = player.name;
      cell.appendChild(token);
      player.tokens.push({ row: homeRow + i, col: homeCol, el: token });
    }
  });
}

function startGame() {
  gameStarted = true;
  currentPlayer = 0;
  drawBoard();
  placeTokens();
  rollBtn.disabled = false;
  statusDiv.textContent = `دور اللاعب: ${players[currentPlayer].name}`;
}

function rollDice() {
  diceValue = Math.floor(Math.random() * 6) + 1;
  statusDiv.textContent = `دور ${players[currentPlayer].name}، رمية النرد: ${diceValue}`;
  // في النسخة التجريبية: انتقل للدور التالي مباشرة
  currentPlayer = (currentPlayer + 1) % players.length;
  setTimeout(() => {
    statusDiv.textContent = `دور اللاعب: ${players[currentPlayer].name}`;
  }, 1100);
}

startBtn.onclick = startGame;
rollBtn.onclick = rollDice;

// رسم اللوحة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
  drawBoard();
});
