import React, { useState, useEffect, useRef } from 'react';

// رموز العناصر
const ITEMS = [
  { type: 'star', icon: '⭐', value: 1000 },
  { type: 'coin', icon: '🪙', value: 500 },
  { type: 'dollar', icon: '💵', value: 2000 },
  { type: 'gem', icon: '💎', value: 3000 },
  { type: 'pearl', icon: '🦪', value: 2500 },
  { type: 'snake', icon: '🐍', value: -2000 },
  { type: 'bat', icon: '🦇', value: -1500 },
  { type: 'bomb', icon: '💣', value: -3000 },
];

const SUBSCRIPTIONS = [
  { label: '10,000', value: 10000, time: 30 },
  { label: '50,000', value: 50000, time: 60 },
  { label: '100,000', value: 100000, time: 90 },
];

const PLAYER_ICON = '😃';

const getRandomItem = () => {
  // توزيع العناصر: 60% ثمينة، 40% فتاكة
  const rand = Math.random();
  if (rand < 0.6) {
    return ITEMS[Math.floor(Math.random() * 5)]; // ثمينة
  } else {
    return ITEMS[5 + Math.floor(Math.random() * 3)]; // فتاكة
  }
};

const getRandomX = (width: number) => {
  return Math.floor(Math.random() * (width - 40));
};

const GamePage: React.FC = () => {
  const [subscription, setSubscription] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [playerX, setPlayerX] = useState(150);
  const [gameOver, setGameOver] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<any>(null);

  // بدء اللعبة
  const startGame = (sub: any) => {
    setSubscription(sub.value);
    setTimeLeft(sub.time);
    setScore(0);
    setItems([]);
    setPlayerX(150);
    setPlaying(true);
    setGameOver(false);
  };

  // حركة اللاعب
  useEffect(() => {
    if (!playing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      setPlayerX((prev) => {
        if (e.key === 'ArrowLeft') return Math.max(prev - 30, 0);
        if (e.key === 'ArrowRight') return Math.min(prev + 30, 310);
        return prev;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing]);

  // منطق اللعبة: الوقت وسقوط العناصر
  useEffect(() => {
    if (!playing) return;
    if (timeLeft <= 0) {
      setPlaying(false);
      setGameOver(true);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
      setItems((old) => [
        ...old,
        {
          ...getRandomItem(),
          x: getRandomX(350),
          y: 0,
          id: Math.random().toString(36).substr(2, 9),
        },
      ]);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [playing, timeLeft]);

  // تحريك العناصر للأسفل وفحص التصادم
  useEffect(() => {
    if (!playing) return;
    const moveInterval = setInterval(() => {
      setItems((old) =>
        old
          .map((item) => ({ ...item, y: item.y + 20 }))
          .filter((item) => item.y < 300)
      );
    }, 100);
    return () => clearInterval(moveInterval);
  }, [playing]);

  // فحص التصادم مع اللاعب
  useEffect(() => {
    if (!playing) return;
    setItems((old) => {
      return old.filter((item) => {
        if (
          item.y > 240 &&
          item.x > playerX - 30 &&
          item.x < playerX + 30
        ) {
          setScore((s) => s + item.value);
          return false;
        }
        return true;
      });
    });
  }, [items, playerX, playing]);

  // إعادة اللعبة
  const resetGame = () => {
    setSubscription(null);
    setTimeLeft(0);
    setScore(0);
    setItems([]);
    setPlayerX(150);
    setPlaying(false);
    setGameOver(false);
  };

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-300">
        <h2 className="text-2xl font-bold mb-6">اختر الاشتراك لبدء اللعبة</h2>
        <div className="flex gap-6">
          {SUBSCRIPTIONS.map((sub) => (
            <button
              key={sub.value}
              className="bg-yellow-400 hover:bg-yellow-500 text-lg font-bold px-8 py-4 rounded shadow"
              onClick={() => startGame(sub)}
            >
              {sub.label} 🪙<br />
              <span className="text-sm">{sub.time} ثانية</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="w-full max-w-md mt-6">
        <div className="flex justify-between items-center mb-2">
          <div>النقاط: <span className="font-bold">{score}</span></div>
          <div>الوقت: <span className="font-bold">{timeLeft}</span> ث</div>
          <div>الاشتراك: <span className="font-bold">{subscription}</span></div>
        </div>
        <div
          ref={gameAreaRef}
          className="relative bg-white border rounded-lg shadow h-[300px] w-[350px] overflow-hidden mx-auto"
        >
          {/* اللاعب */}
          <div
            style={{ left: playerX, bottom: 10 }}
            className="absolute text-3xl transition-all duration-75"
          >
            {PLAYER_ICON}
          </div>
          {/* العناصر */}
          {items.map((item) => (
            <div
              key={item.id}
              style={{ left: item.x, top: item.y }}
              className="absolute text-2xl select-none"
            >
              {item.icon}
            </div>
          ))}
        </div>
        {gameOver && (
          <div className="mt-6 text-center">
            <h3 className="text-xl font-bold mb-2">انتهت اللعبة!</h3>
            <div className="mb-2">رصيدك النهائي: <span className="font-bold">{score}</span></div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
              onClick={resetGame}
            >
              إعادة اللعب
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage; 