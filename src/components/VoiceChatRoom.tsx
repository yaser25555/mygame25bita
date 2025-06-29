import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Users, 
  MessageCircle,
  Send,
  Smile,
  ChevronDown,
  ChevronUp,
  Phone,
  PhoneOff,
  Crown,
  Shield,
  Star,
  LogOut,
  Coins,
  Box,
  Infinity
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import ChatMessage from './ChatMessage';
import EmojiPicker from './EmojiPicker';
import { wsService } from '../services/websocket';
import { VoiceUser, Message } from '../types';

interface VoiceChatRoomProps {
  userData: any;
  onLogout: () => void;
}

const VoiceChatRoom: React.FC<VoiceChatRoomProps> = ({ userData, onLogout }) => {
  const [users, setUsers] = useState<VoiceUser[]>([
    { 
      id: '1', 
      username: 'أحمد محمد', 
      isSpeaking: false, 
      isMuted: false, 
      isDeafened: false, 
      role: 'admin',
      isAdmin: true,
      coins: 1500,
      level: 5,
      experience: 2500,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'online'
    },
    { 
      id: '2', 
      username: 'فاطمة علي', 
      isSpeaking: true, 
      isMuted: false, 
      isDeafened: false, 
      role: 'moderator',
      isAdmin: false,
      coins: 850,
      level: 3,
      experience: 1200,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'online'
    },
    { 
      id: '3', 
      username: 'محمد سالم', 
      isSpeaking: false, 
      isMuted: true, 
      isDeafened: false, 
      role: 'member',
      isAdmin: false,
      coins: 320,
      level: 2,
      experience: 450,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'online'
    },
    { 
      id: '4', 
      username: 'نور الدين', 
      isSpeaking: false, 
      isMuted: false, 
      isDeafened: false, 
      role: 'member',
      isAdmin: false,
      coins: 680,
      level: 4,
      experience: 1800,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'online'
    },
    { 
      id: '5', 
      username: 'ليلى حسن', 
      isSpeaking: false, 
      isMuted: false, 
      isDeafened: true, 
      role: 'member',
      isAdmin: false,
      coins: 150,
      level: 1,
      experience: 100,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'online'
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'النظام', text: 'مرحباً بكم في INFINITY BOX - غرفة المحادثة الصوتية', timestamp: new Date(), type: 'system' },
    { id: '2', sender: 'أحمد محمد', text: 'أهلاً وسهلاً بالجميع في INFINITY BOX!', timestamp: new Date(), type: 'user' },
    { id: '3', sender: 'فاطمة علي', text: 'كيف حالكم اليوم؟ هل جربتم الألعاب الجديدة؟', timestamp: new Date(), type: 'user' },
  ]);

  const [currentUser] = useState<VoiceUser>({ 
    id: 'current', 
    username: userData?.username || 'أنت', 
    isSpeaking: false, 
    isMuted: false, 
    isDeafened: false, 
    role: userData?.isAdmin ? 'admin' : 'member',
    isAdmin: userData?.isAdmin || false,
    coins: 500,
    level: 2,
    experience: 750,
    joinedAt: new Date(),
    lastActive: new Date(),
    status: 'online'
  });

  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [roomStats, setRoomStats] = useState({ totalUsers: 5, speakingUsers: 1 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Setup WebSocket listeners
    wsService.on('voice_room_users', (message) => {
      if (message.users) {
        // Update users list based on WebSocket data
        console.log('Updated users:', message.users);
      }
    });

    wsService.on('chat_message', (message) => {
      if (message.sender && message.text) {
        const newMessage: Message = {
          id: Date.now().toString(),
          sender: message.sender,
          text: message.text,
          timestamp: new Date(),
          type: 'user'
        };
        setMessages(prev => [...prev, newMessage]);
      }
    });

    wsService.on('player_joined', (message) => {
      if (message.username) {
        const systemMessage: Message = {
          id: Date.now().toString(),
          sender: 'النظام',
          text: `انضم ${message.username} إلى INFINITY BOX`,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    });

    wsService.on('player_left', (message) => {
      if (message.username) {
        const systemMessage: Message = {
          id: Date.now().toString(),
          sender: 'النظام',
          text: `غادر ${message.username} من INFINITY BOX`,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    });

    // Simulate speaking users
    const interval = setInterval(() => {
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          isSpeaking: Math.random() > 0.8 && !user.isMuted
        }))
      );
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // Here you would implement actual WebRTC logic
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    if (isConnected) {
      wsService.disconnect();
    } else {
      wsService.connect();
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        type: 'chat_message' as const,
        sender: currentUser.username,
        text: newMessage.trim(),
        roomId: 'main-room'
      };

      wsService.send(message);
      
      // Add message locally for immediate feedback
      const localMessage: Message = {
        id: Date.now().toString(),
        sender: currentUser.username,
        text: newMessage.trim(),
        timestamp: new Date(),
        type: 'user'
      };
      setMessages(prev => [...prev, localMessage]);
      setNewMessage('');
      chatInputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    chatInputRef.current?.focus();
  };

  const getRoleIcon = (role: VoiceUser['role']) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3 text-yellow-400" />;
      case 'moderator': return <Shield className="w-3 h-3 text-blue-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* رأس الغرفة */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex items-center gap-2">
                <Box className="w-6 h-6 text-purple-400" />
                <Infinity className="w-4 h-4 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                INFINITY BOX
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Users className="w-4 h-4" />
                <span>{roomStats.totalUsers}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* معلومات المستخدم */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{currentUser.coins}</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <span className="text-sm text-gray-300">مرحباً، {currentUser.username}</span>
              {currentUser.isAdmin && <Crown className="w-4 h-4 text-yellow-400" />}
            </div>

            {/* زر تسجيل الخروج */}
            <button
              onClick={onLogout}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl px-4 py-2 text-red-300 hover:text-red-200 transition-all duration-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* منطقة المستخدمين */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  المتصلون في INFINITY BOX ({users.length})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {roomStats.speakingUsers} يتحدث الآن
                </div>
              </div>

              {/* شبكة المستخدمين */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {users.map((user) => (
                  <UserAvatar
                    key={user.id}
                    user={user}
                    roleIcon={getRoleIcon(user.role)}
                  />
                ))}
              </div>

              {/* أدوات التحكم الصوتي */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMic}
                  className={`relative group p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                    isMicOn 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25' 
                      : 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/25'
                  }`}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {isMicOn ? 'إيقاف المايك' : 'تشغيل المايك'}
                  </div>
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`relative group p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                    isSpeakerOn 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25' 
                      : 'bg-gradient-to-r from-gray-500 to-slate-500 shadow-lg shadow-gray-500/25'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {isSpeakerOn ? 'إيقاف السماعة' : 'تشغيل السماعة'}
                  </div>
                </button>

                <button
                  onClick={toggleConnection}
                  className={`relative group p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                    isConnected 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/25' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25'
                  }`}
                >
                  {isConnected ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {isConnected ? 'قطع الاتصال' : 'الاتصال'}
                  </div>
                </button>

                <button className="relative group p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-110">
                  <Settings className="w-6 h-6" />
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    الإعدادات
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* منطقة الدردشة */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* رأس الدردشة */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  دردشة INFINITY BOX
                </h3>
                <button
                  onClick={() => setIsChatVisible(!isChatVisible)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isChatVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isChatVisible && (
                <>
                  {/* رسائل الدردشة */}
                  <div className="h-96 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* إدخال الرسالة */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Smile className="w-5 h-5 text-yellow-400" />
                        </button>
                        {showEmojiPicker && (
                          <EmojiPicker onEmojiSelect={addEmoji} onClose={() => setShowEmojiPicker(false)} />
                        )}
                      </div>
                      
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="اكتب رسالتك في INFINITY BOX..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* شريط الحالة السفلي */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-300">
                {isConnected ? 'متصل بـ INFINITY BOX' : 'غير متصل'}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>جودة عالية</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Box className="w-4 h-4 text-purple-400" />
              <span>المستوى {currentUser.level}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatRoom;