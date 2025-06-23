const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
const User = require('../models/User'); // استيراد موديل المستخدم

// --- 1. استيراد المسارات ---
const authRoutes = require('./authRoutes');
const authApiRoutes = require('./auth');
const userRoutes = require('./user');
// const gameRoutes = require('./game'); // استيراد مسار اللعبة الجديد

dotenv.config();

const app = express();

// --- 2. إعداد الـ Middleware ---
app.use(cors({ 
    origin: [
        'http://localhost:8080', 
        'http://127.0.0.1:8080', 
        'http://127.0.0.1:5500',
        'https://mygame25bita.onrender.com', // رابط Render الخاص بك
        'https://mygame25bita-1.onrender.com', // رابط الواجهة الأمامية الجديد
        'https://*.onrender.com' // السماح لجميع روابط Render
    ],
    credentials: true 
}));
app.use(express.json());

// إضافة route للتحقق من صحة الخدمة
app.get('/', (req, res) => {
    res.json({ message: 'VoiceBoom API is running!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- 3. الاتصال بقاعدة البيانات ---
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    // لا توقف التطبيق إذا فشل الاتصال بقاعدة البيانات
});

// --- 4. استخدام المسارات ---
app.use('/api/auth', authRoutes);
app.use('/api/auth', authApiRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/game', gameRoutes); // استخدام مسار اللعبة الجديد

// --- 5. إعداد خادم HTTP و WebSocket ---
const server = http.createServer(app);

// محاولة إنشاء WebSocket server مع معالجة الأخطاء
let wss;
try {
    wss = new WebSocket.Server({ server });
    console.log('WebSocket server initialized successfully');
} catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
    wss = null;
}

// دالة لإرسال رسالة إلى جميع العملاء المتصلين
function broadcast(data) {
    if (!wss) return;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// دالة لجلب قائمة اللاعبين وتحديثها للجميع
async function broadcastPlayerList() {
    if (!wss) return;
    try {
        const players = await User.find({}, 'username highScore').sort({ highScore: -1 }).limit(20);
        broadcast({ type: 'player_list_update', players });
    } catch (error) {
        console.error('Error fetching player list:', error);
    }
}

// إعداد WebSocket events فقط إذا تم إنشاء الخادم بنجاح
if (wss) {
    wss.on('connection', ws => {
        console.log('Client connected');

        // عند اتصال عميل جديد، أرسل له قائمة اللاعبين الحالية
        broadcastPlayerList();

        ws.on('message', async message => {
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'join') {
                    console.log(`Player ${data.username} joined`);
                    ws.username = data.username;
                    broadcast({ type: 'player_joined', username: data.username });
                    await broadcastPlayerList();
                } else if (data.type === 'chat_message') {
                    // When a chat message is received, broadcast it to all clients
                    console.log(`Message from ${data.sender}: ${data.text}`);
                    broadcast({
                        type: 'chat_message',
                        sender: data.sender,
                        text: data.text
                    });
                }
            } catch (e) {
                console.error('Failed to parse message or process', e);
            }
        });

        ws.on('close', () => {
            console.log(`Client ${ws.username || ''} disconnected`);
            if(ws.username) {
                broadcast({ type: 'player_left', username: ws.username });
            }
        });
    });
}

// --- 6. تشغيل الخادم ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
});