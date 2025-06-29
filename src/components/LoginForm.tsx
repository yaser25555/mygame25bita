import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Box, Infinity } from 'lucide-react';
import { apiService } from '../services/api';

interface LoginFormProps {
  onLoginSuccess: (userData: any) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.login(formData.username, formData.password);
      onLoginSuccess(response);
    } catch (error: any) {
      setError(error.message || 'فشل في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Box className="w-10 h-10 text-white" />
            <Infinity className="w-5 h-5 text-white absolute -top-1 -right-1" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
          <p className="text-gray-300">مرحباً بك في INFINITY BOX</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="اسم المستخدم أو البريد الإلكتروني"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="كلمة المرور"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                <Box className="w-5 h-5" />
                دخول INFINITY BOX
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            ليس لديك حساب في INFINITY BOX؟{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              إنشاء حساب جديد
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;