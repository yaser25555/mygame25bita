import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, UserPlus, Box, Infinity } from 'lucide-react';
import { apiService } from '../services/api';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.username.trim()) {
      return 'اسم المستخدم مطلوب';
    }
    if (formData.username.length < 3) {
      return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }
    if (!formData.email.trim()) {
      return 'البريد الإلكتروني مطلوب';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return 'البريد الإلكتروني غير صالح';
    }
    if (!formData.password) {
      return 'كلمة المرور مطلوبة';
    }
    if (formData.password.length < 6) {
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'كلمات المرور غير متطابقة';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await apiService.register(formData.username, formData.email, formData.password);
      onRegisterSuccess();
    } catch (error: any) {
      setError(error.message || 'فشل في إنشاء الحساب');
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
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <UserPlus className="w-10 h-10 text-white" />
            <Infinity className="w-5 h-5 text-white absolute -top-1 -right-1" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h2>
          <p className="text-gray-300">انضم إلى مجتمع INFINITY BOX</p>
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
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="اسم المستخدم"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="البريد الإلكتروني"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="تأكيد كلمة المرور"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
              >
                {showConfirmPassword ? (
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
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : (
              <>
                <Box className="w-5 h-5" />
                انضم إلى INFINITY BOX
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            لديك حساب في INFINITY BOX بالفعل؟{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              تسجيل الدخول
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;