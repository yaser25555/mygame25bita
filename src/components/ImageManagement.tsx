import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Upload,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Eye
} from 'lucide-react';
import { apiService } from '../services/api';

interface User {
  userId: string;
  username: string;
  displayName?: string;
  email: string;
  avatar?: string;
  profileImage?: string;
  coverImage?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalUsers: number;
}

const ImageManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSearch, setCurrentSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadUsers = async (page: number = 1, search: string = '') => {
    setIsLoading(true);
    try {
      const data = await apiService.getUsersWithImages(page, 12, search);
      setUsers(data.users || []);
      setPagination(data.pagination);
      setCurrentPage(page);
      setCurrentSearch(search);
    } catch (error: any) {
      showMessage('error', 'خطأ في تحميل المستخدمين: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = () => {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchTerm = searchInput?.value.trim() || '';
    loadUsers(1, searchTerm);
  };

  const handleImageAction = (user: User, action: string) => {
    setSelectedUser(user);
    setSelectedAction(action);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsModalOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showMessage('error', 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, أو GIF');
        return;
      }

      // التحقق من حجم الملف (2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        showMessage('error', 'حجم الصورة كبير جداً. الحد الأقصى 2MB');
        return;
      }

      setSelectedFile(file);
      
      // إنشاء معاينة
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedUser || !selectedAction) return;

    try {
      let imageData = null;
      let imageType = null;

      if (selectedAction.startsWith('change_') && selectedFile) {
        imageData = await fileToBase64(selectedFile);
        imageType = selectedFile.type;
      }

      await apiService.manageUserImage(
        selectedUser.userId,
        selectedAction,
        imageData || undefined,
        imageType || undefined
      );

      showMessage('success', 'تم تحديث الصورة بنجاح');
      closeModal();
      loadUsers(currentPage, currentSearch);
    } catch (error: any) {
      showMessage('error', 'خطأ في إدارة الصورة: ' + error.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedAction('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const getImageStatus = (imageUrl?: string) => {
    return imageUrl ? 'موجودة' : 'غير موجودة';
  };

  const getImagePreview = (imageUrl?: string) => {
    return imageUrl || '/images/default-avatar.png';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <Image className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">إدارة صور المستخدمين</h2>
      </div>

      {/* رسائل التنبيه */}
      {message && (
        <div className={`p-4 rounded-2xl border ${
          message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
          message.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
          'bg-blue-500/20 border-blue-500/50 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <XCircle className="w-5 h-5" />}
            {message.type === 'info' && <AlertTriangle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* شريط البحث */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="searchInput"
                type="text"
                placeholder="البحث عن مستخدم..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <button
              onClick={searchUsers}
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl px-6 py-3 text-purple-300 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              بحث
            </button>
            <button
              onClick={() => loadUsers()}
              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl px-6 py-3 text-green-300 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
          </div>
        </div>

        {/* قائمة المستخدمين */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-300">جاري التحميل...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">لا توجد مستخدمين</h3>
              <p className="text-gray-300">لم يتم العثور على أي مستخدمين</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div key={user.userId} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={getImagePreview(user.avatar)}
                      alt="صورة المستخدم"
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{user.displayName || user.username}</h3>
                      <p className="text-sm text-gray-400">ID: {user.userId}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImagePreview(user.avatar)}
                          alt="الصورة الشخصية"
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">الصورة الشخصية</p>
                          <p className="text-xs text-gray-400">{getImageStatus(user.avatar)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleImageAction(user, 'remove_avatar')}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleImageAction(user, 'change_avatar')}
                          className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-300 transition-colors"
                          title="تغيير"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* التصفح */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {pagination.hasPrevPage && (
                <button
                  onClick={() => loadUsers(currentPage - 1, currentSearch)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                >
                  السابق
                </button>
              )}
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadUsers(page, currentSearch)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === currentPage
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {pagination.hasNextPage && (
                <button
                  onClick={() => loadUsers(currentPage + 1, currentSearch)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                >
                  التالي
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* مودال إدارة الصور */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                إدارة صور المستخدم {selectedUser?.userId}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الإجراء</label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">اختر الإجراء</option>
                  <option value="remove_avatar">حذف الصورة الشخصية</option>
                  <option value="change_avatar">تغيير الصورة الشخصية</option>
                </select>
              </div>

              {selectedAction.startsWith('change_') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">اختر الصورة</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="imageFile"
                    />
                    <label
                      htmlFor="imageFile"
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl px-4 py-3 text-purple-300 cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      اختيار ملف
                    </label>
                  </div>
                  
                  {previewUrl && (
                    <div className="mt-4">
                      <img
                        src={previewUrl}
                        alt="معاينة الصورة"
                        className="w-full max-h-40 object-cover rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  حفظ التغييرات
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagement;