const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// --- 1. استيراد المسارات ---
const authApiRoutes = require('./auth');
const userRoutes = require('./user');
const voiceRoutes = require('./voiceRoutes');

dotenv.config();

// تعريف ثابت للمنفذ PORT
const PORT = process.env.PORT || 3000;

// إنشاء تطبيق Express
const app = express();

// --- 2. إعداد الـ Middleware للأمان والأداء ---

// إضافة Helmet للأمان
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"]
        }
    }
}));

// إضافة Compression للأداء
app.use(compression());

// إعداد Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد أقصى 100 طلب لكل IP
    message: {
        error: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// تطبيق Rate Limiting على جميع الطلبات
app.use(limiter);

// إعداد CORS محسن
const allowedOrigins = [
    'https://mygame25bita-1-4ue6.onrender.com',
    'https://mygame25bita-7eqw.onrender.com',
    'http://localhost:3000',
    'http://localhost:8080'
];

app.use(cors({
    origin: function (origin, callback) {
        // السماح بالطلبات بدون origin (مثل Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('غير مسموح بهذا المصدر'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    // التحقق من المصدر للـ WebSocket
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
    }
    
    voiceServer.handleUpgrade(request, socket, head, (ws) => {
        voiceServer.emit('connection', ws, request);
    });
});

// --- 3. الاتصال بقاعدة البيانات ---
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// --- 4. ربط المسارات ---
app.use('/api/auth', authApiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voice', voiceRoutes);

// --- 5. إعداد الملفات الثابتة ---
app.use('/sounds', express.static(path.join(__dirname, '../frontend/sounds')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use(express.static(path.join(__dirname, '../frontend')));

// إعادة توجيه / إلى index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- 6. نقطة نهاية لفحص الحالة الصحية (Health Check) ---
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: userSockets.size,
        voiceRooms: voiceRooms.size
    });
});

// --- 7. معالجة الأخطاء ---
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'بيانات غير صحيحة' });
    }
    
    if (err.message === 'غير مسموح بهذا المصدر') {
        return res.status(403).json({ error: 'غير مسموح بالوصول من هذا المصدر' });
    }
    
    res.status(500).json({ error: 'خطأ في الخادم' });
});

// معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
    res.status(404).json({ error: 'المسار غير موجود' });
});

// --- 8. معالجة WebSocket مع تحسينات ---
voiceServer.on('connection', (ws, req) => {
    console.log('🔗 New WebSocket connection from:', req.socket.remoteAddress);
    
    // إضافة timestamp للاتصال
    ws.connectedAt = Date.now();
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'رسالة غير صحيحة' }));
        }
    });
    
    ws.on('close', () => {
        handleWebSocketClose(ws);
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        handleWebSocketClose(ws);
    });
});

// دالة معالجة رسائل WebSocket
function handleWebSocketMessage(ws, data) {
    console.log('📨 Received:', data.type, 'from:', data.username || 'unknown');
    
    switch (data.type) {
        case 'join':
            handleJoin(ws, data);
            break;
        case 'chat_message':
            handleChatMessage(ws, data);
            break;
        case 'voice_message':
            handleVoiceMessage(ws, data);
            break;
        case 'private_message':
            handlePrivateMessage(ws, data);
            break;
        case 'private_voice_message':
            handlePrivateVoiceMessage(ws, data);
            break;
        case 'join_voice_room':
            handleJoinVoiceRoom(ws, data);
            break;
        case 'leave_voice_room':
            handleLeaveVoiceRoom(ws, data);
            break;
        case 'webrtc_signal':
            handleWebRTCSignal(ws, data);
            break;
        case 'mute_user':
            handleMuteUser(ws, data);
            break;
        default:
            console.warn('⚠️ Unknown message type:', data.type);
    }
}

// دوال معالجة الرسائل
function handleJoin(ws, data) {
    console.log(`👤 Player ${data.username} joined`);
    ws.username = data.username;
    userSockets.set(data.username, ws);
    broadcast({ type: 'player_joined', username: data.username });
    broadcastPlayerList();
}

function handleChatMessage(ws, data) {
    console.log(`💬 Message from ${data.sender}: ${data.text}`);
    broadcast({
        type: 'chat_message',
        sender: data.sender,
        text: data.text,
        timestamp: Date.now()
    });
}

function handleVoiceMessage(ws, data) {
    console.log(`🎤 Voice message from ${data.sender}`);
    broadcast({
        type: 'voice_message',
        sender: data.sender,
        audio: data.audio,
        timestamp: Date.now()
    });
}

function handlePrivateMessage(ws, data) {
    const targetSocket = userSockets.get(data.target);
    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(JSON.stringify({
            type: 'private_message',
            sender: data.sender,
            text: data.text,
            timestamp: Date.now()
        }));
    }
    
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'private_message',
            sender: data.sender,
            text: data.text,
            self: true,
            timestamp: Date.now()
        }));
    }
}

function handlePrivateVoiceMessage(ws, data) {
    const targetSocket = userSockets.get(data.target);
    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(JSON.stringify({
            type: 'private_voice_message',
            sender: data.sender,
            audio: data.audio,
            timestamp: Date.now()
        }));
    }
    
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'private_voice_message',
            sender: data.sender,
            audio: data.audio,
            self: true,
            timestamp: Date.now()
        }));
    }
}

function handleJoinVoiceRoom(ws, data) {
    const { roomName, username } = data;
    console.log('🎧 User joined voice room:', username, roomName);
    ws.voiceRoom = roomName;
    ws.username = username;
    userSockets.set(username, ws);
    
    if (!voiceRooms.has(roomName)) {
        voiceRooms.set(roomName, new Set());
    }
    voiceRooms.get(roomName).add(username);
    
    broadcastToVoiceRoom(roomName, { 
        type: 'voice_user_joined', 
        username,
        timestamp: Date.now()
    }, username);
}

function handleLeaveVoiceRoom(ws, data) {
    const { roomName, username } = data;
    if (voiceRooms.has(roomName)) {
        voiceRooms.get(roomName).delete(username);
        if (voiceRooms.get(roomName).size === 0) {
            voiceRooms.delete(roomName);
        }
    }
    ws.voiceRoom = null;
    broadcastToVoiceRoom(roomName, { 
        type: 'voice_user_left', 
        username,
        timestamp: Date.now()
    }, username);
}

function handleWebRTCSignal(ws, data) {
    const { roomName, signal, from, to } = data;
    if (to) {
        const targetSocket = userSockets.get(to);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({ 
                type: 'webrtc_signal', 
                signal, 
                from,
                timestamp: Date.now()
            }));
        }
    } else if (roomName) {
        broadcastToVoiceRoom(roomName, { 
            type: 'webrtc_signal', 
            signal, 
            from,
            timestamp: Date.now()
        }, from);
    }
}

function handleMuteUser(ws, data) {
    const { targetUsername } = data;
    const targetSocket = userSockets.get(targetUsername);
    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(JSON.stringify({ 
            type: 'muted_by_admin',
            timestamp: Date.now()
        }));
    }
}

function handleWebSocketClose(ws) {
    console.log(`🔌 Client ${ws.username || ''} disconnected`);
    if (ws.username) {
        userSockets.delete(ws.username);
        broadcast({ 
            type: 'player_left', 
            username: ws.username,
            timestamp: Date.now()
        });
    }
    
    if (ws.voiceRoom && voiceRooms.has(ws.voiceRoom)) {
        voiceRooms.get(ws.voiceRoom).delete(ws.username);
        if (voiceRooms.get(ws.voiceRoom).size === 0) {
            voiceRooms.delete(ws.voiceRoom);
        }
    }
}

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
    
    console.log('📢 broadcastToVoiceRoom', roomName, data.type, 'exclude:', excludeUsername);
    voiceRooms.get(roomName).forEach(username => {
        if (username !== excludeUsername) {
            const ws = userSockets.get(username);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        }
    });
}

// دالة لجلب قائمة اللاعبين وتحديثها للجميع
async function broadcastPlayerList() {
    try {
        const players = await User.find({}, 'username highScore')
            .sort({ highScore: -1 })
            .limit(20)
            .lean();
            
        broadcast({ 
            type: 'player_list_update', 
            players,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('❌ Error fetching player list:', error);
    }
}

// Export httpServer and PORT for use in external scripts
module.exports = { httpServer, PORT };