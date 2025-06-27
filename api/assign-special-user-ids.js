const mongoose = require('mongoose');
const User = require('./../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voiceboom';

// قائمة الأرقام المميزة
const specialIds = [111, 222, 333, 444, 555, 666];

async function assignSpecialUserIds() {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ متصل بقاعدة البيانات');

    // ابحث عن المستخدمين بدون userId أو userId < 1500
    const users = await User.find({ $or: [ { userId: { $exists: false } }, { userId: { $lt: 1500 } } ] });
    console.log(`🔎 وجد ${users.length} مستخدم قديم بدون معرف أو بمعرف أقل من 1500`);

    // تحقق من الأرقام المميزة المستخدمة بالفعل
    const usedIds = (await User.find({ userId: { $in: specialIds } }, { userId: 1 })).map(u => u.userId);
    const availableIds = specialIds.filter(id => !usedIds.includes(id));

    if (users.length === 0 || availableIds.length === 0) {
        console.log('🚫 لا يوجد مستخدمين بحاجة لتعيين أو لا يوجد أرقام متاحة');
        await mongoose.disconnect();
        return;
    }

    let assigned = 0;
    for (let i = 0; i < users.length && i < availableIds.length; i++) {
        const user = users[i];
        const newId = availableIds[i];
        
        // استخدم updateOne لتجنب مشاكل التحقق من الصحة
        const result = await User.updateOne(
            { _id: user._id },
            { $set: { userId: newId } }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`✅ تم تعيين المعرف ${newId} للمستخدم ${user.username || user._id}`);
            assigned++;
        } else {
            console.log(`❌ فشل في تعيين المعرف ${newId} للمستخدم ${user.username || user._id}`);
        }
    }

    if (assigned === 0) {
        console.log('🚫 لم يتم تعيين أي معرفات. ربما جميع الأرقام مستخدمة.');
    } else {
        console.log(`🎉 تم تعيين ${assigned} معرفات مميزة بنجاح!`);
    }
    await mongoose.disconnect();
}

assignSpecialUserIds().catch(err => {
    console.error('❌ خطأ أثناء تعيين المعرفات:', err);
    mongoose.disconnect();
}); 