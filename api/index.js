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
// إعداد CORS للسماح بالطلبات من أي مصدر. هذا ضروري للنشر على Render.
app.use(cors()); 

app.use(express.json());

// --- 3. الاتصال بقاعدة البيانات ---
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// --- 4. استخدام المسارات ---
app.use('/api/auth', authRoutes);
app.use('/api/auth', authApiRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/game', gameRoutes); // استخدام مسار اللعبة الجديد

// --- نقطة نهاية لفحص الحالة الصحية (Health Check) ---
// Render يستخدم هذا المسار للتأكد من أن الخدمة تعمل بشكل سليم
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- 5. إعداد خادم HTTP و WebSocket ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// دالة لإرسال رسالة إلى جميع العملاء المتصلين
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
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
            // We could rebroadcast the player list here as well
            // broadcastPlayerList();
        }
    });
});

// --- 6. تشغيل الخادم ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));