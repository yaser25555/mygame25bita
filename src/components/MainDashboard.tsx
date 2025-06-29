import React, { useState } from 'react';
import { 
  Gamepad2, 
  MessageCircle, 
  Users, 
  Trophy, 
  Settings, 
  LogOut,
  Coins,
  Star,
  Crown,
  Box,
  Infinity,
  Menu,
  X,
  Shield
} from 'lucide-react';
import GameGrid from './GameGrid';
import VoiceChatRoom from './VoiceChatRoom';
import AdminDashboard from './AdminDashboard';

interface MainDashboardProps {
  userData: any;
  onLogout: () => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'games' | 'voice' | 'leaderboard' | 'profile' | 'admin'>('games');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'games', label: 'الألعاب', icon: Gamepad2, color: 'text-purple-400' },
    { id: 'voice', label: 'المحادثة الصوتية', icon: MessageCircle, color: 'text-blue-400' },
    { id: 'leaderboard', label: 'لوحة المتصدرين', icon: Trophy, color: 'text-yellow-400' },
    { id: 'profile', label: 'الملف الشخصي', icon: Users, color: 'text-green-400' },
    ...(userData?.isAdmin ? [{ id: 'admin', label: 'لوحة المشرف', icon: Shield, color: 'text-red-400' }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'games':
        return <GameGrid />;
      case 'voice':
        return <VoiceChatRoom userData={userData} onLogout={onLogout} />;
      case 'leaderboard':
        return <LeaderboardContent />;
      case 'profile':
        return <ProfileContent userData={userData} />;
      case 'admin':
        return userData?.isAdmin ? <AdminDashboard userData={userData} onLogout={onLogout} /> : <GameGrid />;
      default:
        return <GameGrid />;
    }
  };

  // إذا كان المستخدم في لوحة المشرف، عرضها بدون الشريط الجانبي
  if (activeTab === 'admin' && userData?.isAdmin) {
    return <AdminDashboard userData={userData} onLogout={onLogout} />;
  }

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

      <div className="relative z-10 flex h-screen">
        {/* الشريط الجانبي */}
        <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-80 bg-white/5 backdrop-blur-md border-l border-white/10 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex flex-col h-full">
            {/* رأس الشريط الجانبي */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center relative">
                    <Box className="w-6 h-6 text-white" />
                    <Infinity className="w-3 h-3 text-white absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      INFINITY BOX
                    </h1>
                    <p className="text-xs text-gray-400">منصة الألعاب والمحادثة</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* معلومات المستخدم */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xl font-bold">
                  {userData?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{userData?.username || 'مستخدم'}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>المستوى 5</span>
                  </div>
                </div>
                {userData?.isAdmin && (
                  <Crown className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">1,250</span>
                  </div>
                  <p className="text-xs text-gray-400">العملات الذهبية</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-semibold">847</span>
                  </div>
                  <p className="text-xs text-gray-400">النقاط</p>
                </div>
              </div>
            </div>

            {/* التنقل */}
            <nav className="flex-1 p-6">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-right ${
                      activeTab === item.id
                        ? 'bg-white/10 border border-white/20 shadow-lg'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'admin' && userData?.isAdmin && (
                      <Crown className="w-4 h-4 text-yellow-400 mr-auto" />
                    )}
                  </button>
                ))}
              </div>
            </nav>

            {/* أزرار الإعدادات والخروج */}
            <div className="p-6 border-t border-white/10 space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-right">
                <Settings className="w-5 h-5 text-gray-400" />
                <span>الإعدادات</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-300 transition-colors text-right"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* شريط علوي للجوال */}
          <header className="lg:hidden bg-white/5 backdrop-blur-md border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Box className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold">INFINITY BOX</h1>
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* المحتوى */}
          <div className="flex-1 overflow-auto p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* خلفية الشريط الجانبي للجوال */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// مكونات المحتوى
const LeaderboardContent: React.FC = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-3 mb-8">
      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
        <Trophy className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white">لوحة المتصدرين</h2>
    </div>
    
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">لوحة المتصدرين</h3>
        <p className="text-gray-300">قريباً - سيتم عرض أفضل اللاعبين هنا</p>
      </div>
    </div>
  </div>
);

const ProfileContent: React.FC<{ userData: any }> = ({ userData }) => (
  <div className="space-y-8">
    <div className="flex items-center gap-3 mb-8">
      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
        <Users className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white">الملف الشخصي</h2>
    </div>
    
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
          {userData?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{userData?.username || 'مستخدم'}</h3>
        <p className="text-gray-300">قريباً - إعدادات الملف الشخصي</p>
      </div>
    </div>
  </div>
);

export default MainDashboard;