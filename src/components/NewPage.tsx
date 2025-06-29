import React from 'react';
import { Box, Star, Users, Trophy, MessageCircle } from 'lucide-react';

const NewPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Box className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">صفحتي الجديدة</h2>
      </div>

      {/* Main Content */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-12 h-12 text-yellow-300" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-4">مرحباً بك في صفحتي الجديدة</h3>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            هذه صفحة جديدة تمت إضافتها إلى موقعك. يمكنك تعديل هذا النص وإضافة المحتوى الذي تريده هنا.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">ميزة رائعة</h4>
              <p className="text-gray-400 text-sm">وصف قصير للميزة الأولى التي تريد إبرازها.</p>
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">إنجازات</h4>
              <p className="text-gray-400 text-sm">عرض الإنجازات أو الإحصائيات المهمة.</p>
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">اتصل بنا</h4>
              <p className="text-gray-400 text-sm">معلومات الاتصال أو نموذج للتواصل.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPage;
