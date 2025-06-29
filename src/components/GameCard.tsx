import React from 'react';
import { Play, Users, Trophy, Star } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  players: number;
  rating: number;
  onPlay: () => void;
  featured?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  image,
  players,
  rating,
  onPlay,
  featured = false
}) => {
  return (
    <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-105 ${
      featured 
        ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-1' 
        : 'bg-white/10 backdrop-blur-md border border-white/20'
    }`}>
      {featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3" />
            مميزة
          </div>
        </div>
      )}
      
      <div className={`relative h-full rounded-3xl overflow-hidden ${
        featured ? 'bg-slate-900' : 'bg-white/5'
      }`}>
        {/* صورة اللعبة */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* زر التشغيل */}
          <button
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </button>
        </div>

        {/* محتوى البطاقة */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
            {title}
          </h3>
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {description}
          </p>

          {/* إحصائيات اللعبة */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{players.toLocaleString()} لاعب</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* زر اللعب */}
          <button
            onClick={onPlay}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            العب الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;