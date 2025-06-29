import React, { useState, useEffect, useCallback } from 'react';
import { Box, Zap, Coins, Gem, Crown, Star, Clock, X, AlertTriangle, Loader2, User } from 'lucide-react';
import { apiService } from '../services/api';

const InfinityBoxGame: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [boxes, setBoxes] = useState<{id: number, revealed: boolean, value: number, special: boolean}[]>([]);
  const [userData, setUserData] = useState<{username: string, coins: number} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // أنواع الجوائز وقيمتها
  const rewards = [
    { icon: <Coins className="w-6 h-6 text-yellow-400" />, value: 10, color: 'bg-yellow-500/20 border-yellow-500/50' },
    { icon: <Gem className="w-6 h-6 text-blue-400" />, value: 25, color: 'bg-blue-500/20 border-blue-500/50' },
    { icon: <Crown className="w-6 h-6 text-purple-400" />, value: 50, color: 'bg-purple-500/20 border-purple-500/50' },
    { icon: <Star className="w-6 h-6 text-pink-400" />, value: 100, color: 'bg-pink-500/20 border-pink-500/50', special: true },
    { icon: <AlertTriangle className="w-6 h-6 text-red-400" />, value: -20, color: 'bg-red-500/20 border-red-500/50' },
  ];

  // جلب بيانات اللاعب
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getCurrentUser();
      setUserData({
        username: data.username,
        coins: data.coins || 0
      });
    } catch (err) {
      console.error('فشل في جلب بيانات اللاعب:', err);
      setError('لا يمكن تحميل بيانات اللاعب. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تحديث رصيد اللاعب
  const updateUserBalance = async (scoreChange: number) => {
    if (!userData) return;
    
    try {
      const newBalance = userData.coins + scoreChange;
      await apiService.updateProfile({ coins: newBalance });
      setUserData(prev => prev ? { ...prev, coins: newBalance } : null);
    } catch (err) {
      console.error('فشل في تحديث رصيد اللاعب:', err);
      setError('حدث خطأ أثناء تحديث الرصيد. سيتم تحديثه عند إعادة تحميل الصفحة.');
    }
  };

  // تهيئة اللعبة
  const initGame = useCallback(() => {
    const initialBoxes = Array(16).fill(0).map((_, index) => ({
      id: index,
      revealed: false,
      value: Math.random() > 0.8 ? 3 : Math.random() > 0.6 ? 2 : Math.random() > 0.3 ? 1 : 0, // 0-3
      special: Math.random() > 0.9 // 10% chance for special box
    }));
    
    setBoxes(initialBoxes);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameActive(true);
  }, []);

  // جلب بيانات اللاعب عند تحميل المكون
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // بدء المؤقت
  useEffect(() => {
    if (!gameActive || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          setGameActive(false);
          // تحديث رصيد اللاعب عند انتهاء اللعبة
          if (score > 0) {
            updateUserBalance(score);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, gameOver, score]);

  // التعامل مع النقر على الصندوق
  const handleBoxClick = (id: number) => {
    if (!gameActive || gameOver || isLoading) return;

    setBoxes(prevBoxes => {
      const newBoxes = [...prevBoxes];
      const boxIndex = newBoxes.findIndex(box => box.id === id);
      
      if (boxIndex !== -1 && !newBoxes[boxIndex].revealed) {
        newBoxes[boxIndex] = { ...newBoxes[boxIndex], revealed: true };
        
        // حساب النقاط
        const boxValue = newBoxes[boxIndex].value;
        const isSpecial = newBoxes[boxIndex].special;
        const reward = isSpecial ? rewards[3] : rewards[boxValue];
        const newScore = Math.max(0, score + reward.value);
        
        setScore(newScore);
        
        // تحديث الرصيد فوراً إذا كانت النتيجة إيجابية
        if (reward.value > 0) {
          updateUserBalance(reward.value);
        }
      }
      
      return newBoxes;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* شريط المعلومات العلوي */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Box className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              صندوق اللانهاية
            </h1>
          </div>
          
          {isLoading ? (
            <div className="flex items-center space-x-2 text-blue-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري التحميل...</span>
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
              {userData && (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-green-400" />
                  <span className="font-medium">{userData.username}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-gray-400">الرصيد الحالي</span>
                  <span className="font-mono text-lg">{userData?.coins?.toLocaleString() || 0}</span>
                </div>
              </div>
              
              {(gameActive || gameOver) && (
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-yellow-400 opacity-70" />
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-gray-400">النقاط</span>
                    <span className="font-mono text-lg">{score}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-mono text-lg">{timeLeft} ثانية</span>
              </div>
              
              {!gameActive && (
                <button
                  onClick={initGame}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  <span>{gameOver ? 'العب مرة أخرى' : 'بدء اللعبة'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* لوحة اللعبة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {boxes.map((box) => (
            <div
              key={box.id}
              onClick={() => handleBoxClick(box.id)}
              className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 ${box.revealed 
                ? `${rewards[box.special ? 3 : box.value].color} border-2 scale-95` 
                : 'bg-slate-700/50 hover:bg-slate-700/70 border-2 border-slate-600/50 hover:border-purple-400/50'}`}
            >
              {box.revealed ? (
                <div className="flex flex-col items-center justify-center">
                  {rewards[box.special ? 3 : box.value].icon}
                  <span className="text-xs mt-1">
                    {rewards[box.special ? 3 : box.value].value > 0 ? '+' : ''}
                    {rewards[box.special ? 3 : box.value].value}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-2xl">؟</span>
              )}
            </div>
          ))}
        </div>

        {/* تعليمات اللعبة */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 text-purple-300">كيفية اللعب</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>انقر على الصناديق لاكتشاف الجوائز</span>
            </li>
            <li className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>اجمع أكبر عدد ممكن من النقاط قبل انتهاء الوقت</span>
            </li>
            <li className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>احذر من الصناديق الحمراء التي تخصم نقاطاً</span>
            </li>
            <li className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-pink-400" />
              <span>ابحث عن الصناديق الخاصة لتحصل على مكافآت كبيرة</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InfinityBoxGame;
