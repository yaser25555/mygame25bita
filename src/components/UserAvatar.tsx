import React from 'react';
import { Mic, MicOff, VolumeX } from 'lucide-react';

interface User {
  id: string;
  username: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  role: 'admin' | 'moderator' | 'member';
  avatar?: string;
}

interface UserAvatarProps {
  user: User;
  roleIcon?: React.ReactNode;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, roleIcon }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
    ];
    return colors[parseInt(id) % colors.length];
  };

  return (
    <div className="flex flex-col items-center group">
      <div className="relative">
        {/* حلقة التحدث */}
        {user.isSpeaking && (
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse opacity-75"></div>
        )}
        
        {/* الصورة الرمزية */}
        <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(user.id)} flex items-center justify-center text-white font-bold text-lg shadow-lg transform transition-all duration-300 group-hover:scale-110 ${user.isSpeaking ? 'scale-110' : ''}`}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(user.username)
          )}
          
          {/* أيقونة الدور */}
          {roleIcon && (
            <div className="absolute -top-1 -right-1 bg-black/80 rounded-full p-1">
              {roleIcon}
            </div>
          )}
        </div>

        {/* حالة الصوت */}
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          {user.isMuted && (
            <div className="bg-red-500 rounded-full p-1">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
          {user.isDeafened && (
            <div className="bg-gray-500 rounded-full p-1">
              <VolumeX className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* اسم المستخدم */}
      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-white truncate max-w-20" title={user.username}>
          {user.username}
        </p>
        {user.isSpeaking && (
          <div className="flex items-center justify-center mt-1">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAvatar;