const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const express = require('express'); // أضف هذا السطر
const mongoose = require('mongoose'); // Add this line
const User = require('../models/User'); // استيراد موديل المستخدم

// --- 1. استيراد المسارات ---
const authApiRoutes = require('./auth');
const userRoutes = require('./user');
const voiceRoutes = require('./voiceRoutes');
const tradingRoutes = require('./trading');
const relationshipsRoutes = require('./relationships');
const shieldRoutes = require('./shield');
// const gameRoutes = require('./game'); // استيراد مسار اللعبة الجديد

dotenv.config();

// تعريف ثابت للمنفذ PORT
const PORT = process.env.PORT || 3000;

// إنشاء تطبيق Express
const app = express();

// --- 2. إعداد CORS ---
app.use(cors({
  origin: [
    'https://mygame25bita-7eqw.onrender.com',
    'https://mygame25bita-1-4ue6.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// --- 3. إعداد الـ Middleware ---
app.use(express.json());

// إعدادات لحجم الطلبات الكبير (لرفع الصور)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2.5 إعداد WebSocket ---
const voiceServer = new WebSocket.Server({ noServer: true });

// خريطة للاحتفاظ بمرجع WebSocket لكل مستخدم
const userSockets = new Map();
// خريطة لإدارة غرف الصوت
const voiceRooms = new Map(); // roomName => Set of usernames

// إعداد خادم HTTP
const httpServer = http.createServer(app);


// معالجة طلبات WebSocket
httpServer.on('upgrade', (request, socket, head) => {
  voiceServer.handleUpgrade(request, socket, head, (ws) => {
    voiceServer.emit('connection', ws, request);
  });
});

// --- 3. الاتصال بقاعدة البيانات ---
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// --- 4. ربط المسارات ---
app.use('/api/auth', authApiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/relationships', relationshipsRoutes);
app.use('/api/shield', shieldRoutes);
// app.use('/api/game', gameRoutes); // مسار اللعبة

// --- 5. إعداد الملفات الثابتة (Static Files) ---
// خدمة ملفات الواجهة الأمامية
app.use(express.static(path.join(__dirname, '../frontend')));

// --- 6. نقطة نهاية لفحص الحالة الصحية (Health Check) ---
// Render يستخدم هذا المسار للتأكد من أن الخدمة تعمل بشكل سليم
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// مسار اختبار بسيط
app.get('/test', (req, res) => {
  res.json({ 
    message: 'الخادم يعمل بشكل صحيح',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// مسار اختبار CORS
app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS يعمل بشكل صحيح',
    origin: req.headers.origin,
    method: req.method
  });
});

// نقطة نهاية للصفحة الرئيسية - رسالة بسيطة
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Voice Boom Backend API</title></head>
      <body>
        <h1>Voice Boom Backend API</h1>
        <p>Status: Running</p>
        <p>This is the backend server. The frontend is served separately.</p>
      </body>
    </html>
  `);
});

// --- 7. معالجة الأخطاء ---
// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error('❌ خطأ في الخادم:', err);
  res.status(500).json({ 
    message: 'خطأ داخلي في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : 'حدث خطأ غير متوقع'
  });
});

// معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({ message: 'المسار غير موجود' });
});

// تحسين إدارة WebSocket
voiceServer.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // إضافة معرف فريد للاتصال
  ws.connectionId = Date.now() + Math.random();
  ws.isAuthenticated = false;
  
  console.log(`WebSocket connection ${ws.connectionId} established`);
  
  ws.on('message', (message) => {
    try {
      console.log(`Received message from connection ${ws.connectionId}:`, message.toString());
      const data = JSON.parse(message);
      
      // معالجة أنواع مختلفة من الرسائل
      if (data.type === 'join') {
        console.log(`Player ${data.username} joined via connection ${ws.connectionId}`);
        ws.username = data.username;
        ws.isAuthenticated = true;
        
        // إزالة الاتصالات القديمة لنفس المستخدم
        const existingConnections = Array.from(voiceServer.clients).filter(client => 
          client.username === data.username && client !== ws
        );
        existingConnections.forEach(client => {
          console.log(`Closing duplicate connection for user ${data.username}`);
          client.close(1000, 'Duplicate connection');
        });
        
        userSockets.set(data.username, ws); // حفظ السوكيت باسم المستخدم
        broadcast({ type: 'player_joined', username: data.username });
        broadcastPlayerList();
      } else if (data.type === 'chat_message') {
        // رسالة عامة
        if (!ws.isAuthenticated) {
          console.log(`Unauthorized chat message attempt from connection ${ws.connectionId}`);
          return;
        }
        console.log(`Message from ${data.sender}: ${data.text}`);
        broadcast({
          type: 'chat_message',
          sender: data.sender,
          text: data.text
        });
      } else if (data.type === 'voice_message') {
        // رسالة صوتية عامة
        if (!ws.isAuthenticated) {
          console.log(`Unauthorized voice message attempt from connection ${ws.connectionId}`);
          return;
        }
        console.log(`Voice message from ${data.sender}`);
        broadcast({
          type: 'voice_message',
          sender: data.sender,
          audio: data.audio
        });
      } else if (data.type === 'private_message') {
        // رسالة نصية خاصة
        if (!ws.isAuthenticated) {
          console.log(`Unauthorized private message attempt from connection ${ws.connectionId}`);
          return;
        }
        const targetSocket = userSockets.get(data.target);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify({
            type: 'private_message',
            sender: data.sender,
            text: data.text
          }));
        }
        // أرسل نسخة للمرسل أيضًا (اختياري)
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'private_message',
            sender: data.sender,
            text: data.text,
            self: true
          }));
        }
      } else if (data.type === 'private_voice_message') {
        // رسالة صوتية خاصة
        if (!ws.isAuthenticated) {
          console.log(`Unauthorized private voice message attempt from connection ${ws.connectionId}`);
          return;
        }
        const targetSocket = userSockets.get(data.target);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify({
            type: 'private_voice_message',
            sender: data.sender,
            audio: data.audio
          }));
        }
        // أرسل نسخة للمرسل أيضًا (اختياري)
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'private_voice_message',
            sender: data.sender,
            audio: data.audio,
            self: true
          }));
        }
      } else if (data.type === 'join_voice_room') {
        // انضمام المستخدم لغرفة صوتية
        const { roomName, username } = data;
        console.log(`User ${username} joined voice room ${roomName} via connection ${ws.connectionId}`);
        ws.voiceRoom = roomName;
        ws.username = username; // ضروري لتتبع المستخدم عند الخروج
        ws.isAuthenticated = true;
        
        // إزالة الاتصالات القديمة لنفس المستخدم
        const existingConnections = Array.from(voiceServer.clients).filter(client => 
          client.username === username && client !== ws
        );
        existingConnections.forEach(client => {
          console.log(`Closing duplicate voice connection for user ${username}`);
          client.close(1000, 'Duplicate voice connection');
        });
        
        userSockets.set(username, ws); // إضافة ضرورية
        if (!voiceRooms.has(roomName)) voiceRooms.set(roomName, new Set());
        voiceRooms.get(roomName).add(username);
        // أبلغ البقية أن هناك مستخدم جديد
        broadcastToVoiceRoom(roomName, { type: 'voice_user_joined', username }, username);
      } else if (data.type === 'leave_voice_room') {
        // خروج المستخدم من غرفة صوتية
        const { roomName, username } = data;
        console.log(`User ${username} left voice room ${roomName} via connection ${ws.connectionId}`);
        if (voiceRooms.has(roomName)) {
          voiceRooms.get(roomName).delete(username);
          if (voiceRooms.get(roomName).size === 0) voiceRooms.delete(roomName);
        }
        ws.voiceRoom = null;
        broadcastToVoiceRoom(roomName, { type: 'voice_user_left', username }, username);
      } else if (data.type === 'webrtc_signal') {
        // تمرير إشارات WebRTC (offer/answer/candidate) لباقي أعضاء الغرفة
        const { roomName, signal, from, to } = data;
        if (to) {
          // إرسال إشارة مباشرة لمستخدم محدد (ثنائي)
          const targetSocket = userSockets.get(to);
          if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({ type: 'webrtc_signal', signal, from }));
          }
        } else if (roomName) {
          // إرسال إشارة لكل أعضاء الغرفة (جماعي)
          broadcastToVoiceRoom(roomName, { type: 'webrtc_signal', signal, from }, from);
        }
      } else if (data.type === 'mute_user') {
        // كتم مستخدم من قبل المشرف
        const { targetUsername } = data;
        const targetSocket = userSockets.get(targetUsername);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify({ type: 'muted_by_admin' }));
        }
      } else {
        console.log(`Unknown message type: ${data.type} from connection ${ws.connectionId}`);
      }
    } catch (error) {
      console.error(`Error processing message from connection ${ws.connectionId}:`, error);
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`Client ${ws.username || 'unknown'} disconnected from connection ${ws.connectionId}`);
    console.log(`Close code: ${code}, reason: ${reason}`);
    
    if(ws.username) {
      userSockets.delete(ws.username); // إزالة السوكيت عند الخروج
      broadcast({ type: 'player_left', username: ws.username });
    }
    // إزالة المستخدم من أي غرفة صوتية
    if (ws.voiceRoom && voiceRooms.has(ws.voiceRoom)) {
      voiceRooms.get(ws.voiceRoom).delete(ws.username);
      if (voiceRooms.get(ws.voiceRoom).size === 0) voiceRooms.delete(ws.voiceRoom);
    }
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error on connection ${ws.connectionId}:`, error);
  });
});


// دالة لإرسال رسالة إلى جميع العملاء المتصلين
function broadcast(data) {
    voiceServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// دالة لإرسال رسالة إلى كل أعضاء غرفة صوتية ما عدا المرسل
function broadcastToVoiceRoom(roomName, data, excludeUsername = null) {
  if (!voiceRooms.has(roomName)) return;
  console.log('broadcastToVoiceRoom', roomName, data, 'exclude:', excludeUsername);
  voiceRooms.get(roomName).forEach(username => {
    if (username !== excludeUsername) {
      const ws = userSockets.get(username);
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Sending to', username, data);
        ws.send(JSON.stringify(data));
      }
    }
  });
}

// دالة لجلب قائمة اللاعبين وتحديثها للجميع
async function broadcastPlayerList() {
    try {
        const players = await User.find({}, 'username highScore').sort({ highScore: -1 }).limit(20);
        broadcast({ type: 'player_list_update', players });
    } catch (error) {
        console.error('Error fetching player list:', error);
    }
}

// Export httpServer and PORT for use in external scripts (like server-listen.js)
module.exports = { httpServer, PORT };

// تشغيل الخادم
// httpServer.listen(PORT, () => {
//   console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
//   console.log(`📡 API متاح على: http://localhost:${PORT}/api`);
//   console.log(`