import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Gamepad2, Box, Infinity } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
  onAuthSuccess: (userData: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLoginSuccess = (userData: any) => {
    if (userData.isAdmin) {
      // Show admin choice modal
      const choice = window.confirm('مرحباً أيها المشرف! هل تريد الذهاب إلى لوحة التحكم؟ (إلغاء للذهاب إلى اللعبة)');
      if (choice) {
        window.location.href = '/admin.html';
        return;
      }
    }
    onAuthSuccess(userData);
  };

  const handleRegisterSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCurrentView('login');
    }, 3000);
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

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center py-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center relative">
              <Box className="w-8 h-8 text-white" />
              <Infinity className="w-4 h-4 text-white absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              INFINITY BOX
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            منصة الألعاب والمحادثة الصوتية اللانهائية - اكتشف عالماً من الإمكانيات اللامحدودة
          </p>
        </header>

        {/* Features */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Features List */}
              <div className="space-y-8">
                <div className="text-center lg:text-right">
                  <h2 className="text-3xl font-bold mb-6 text-white">
                    اكتشف الصندوق اللانهائي من الترفيه
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">محادثة صوتية عالية الجودة</h3>
                      <p className="text-gray-300">تواصل مع الأصدقاء بجودة صوت كريستالية في INFINITY BOX</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">ألعاب ربحية لانهائية</h3>
                      <p className="text-gray-300">اربح العملات الذهبية من خلال ألعاب شيقة ومتنوعة</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">غرف صوتية متعددة</h3>
                      <p className="text-gray-300">انضم إلى غرف مختلفة أو أنشئ غرفتك الخاصة في عالم INFINITY BOX</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Box className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">صناديق الكنوز اللانهائية</h3>
                      <p className="text-gray-300">افتح صناديق مليئة بالمفاجآت والجوائز القيمة</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auth Forms */}
              <div className="flex justify-center">
                {showSuccess ? (
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-green-500/20 border border-green-500/50 rounded-3xl p-8 text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">تم إنشاء الحساب بنجاح!</h3>
                      <p className="text-green-300">مرحباً بك في INFINITY BOX - يمكنك الآن تسجيل الدخول</p>
                    </div>
                  </div>
                ) : currentView === 'login' ? (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => setCurrentView('register')}
                  />
                ) : (
                  <RegisterForm
                    onRegisterSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => setCurrentView('login')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/10">
          <div className="space-y-4">
            <div className="flex justify-center items-center gap-6 text-sm text-gray-400">
              <span>للاستفسار وشحن العملات في INFINITY BOX</span>
            </div>
            <div className="flex justify-center items-center gap-8">
              <a href="mailto:YASER.HAROON79@GMAIL.COM" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                YASER.HAROON79@GMAIL.COM
              </a>
              <a href="https://wa.me/966554593007" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                00966554593007
              </a>
            </div>
            <div className="text-xs text-gray-500 mt-4">
              © 2024 INFINITY BOX - جميع الحقوق محفوظة
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AuthPage;