const User = require('../models/User');

// In-memory storage for chat messages (in production, use database)
const chatMessages = new Map();
const onlineUsers = new Map();
const userSockets = new Map();

// Initialize chat for a user
function initializeUserChat(userId) {
    if (!chatMessages.has(userId)) {
        chatMessages.set(userId, []);
    }
}

// Get chat messages between two users
function getChatMessages(userId1, userId2) {
    const chatId = [userId1, userId2].sort().join('_');
    return chatMessages.get(chatId) || [];
}

// Save a message
function saveMessage(senderId, receiverId, message, type = 'text') {
    const chatId = [senderId, receiverId].sort().join('_');
    
    if (!chatMessages.has(chatId)) {
        chatMessages.set(chatId, []);
    }
    
    const messageObj = {
        id: Date.now() + Math.random(),
        senderId: senderId,
        receiverId: receiverId,
        message: message,
        type: type, // text, image, file
        timestamp: new Date().toISOString(),
        read: false
    };
    
    chatMessages.get(chatId).push(messageObj);
    return messageObj;
}

// Mark messages as read
function markMessagesAsRead(userId, otherUserId) {
    const chatId = [userId, otherUserId].sort().join('_');
    const messages = chatMessages.get(chatId) || [];
    
    messages.forEach(msg => {
        if (msg.receiverId === userId && !msg.read) {
            msg.read = true;
        }
    });
}

// Get unread message count
function getUnreadCount(userId) {
    let count = 0;
    for (const [chatId, messages] of chatMessages) {
        const userIds = chatId.split('_');
        if (userIds.includes(userId.toString())) {
            count += messages.filter(msg => 
                msg.receiverId === userId && !msg.read
            ).length;
        }
    }
    return count;
}

// Get recent chats for a user
function getRecentChats(userId) {
    const userChats = new Map();
    
    for (const [chatId, messages] of chatMessages) {
        const userIds = chatId.split('_');
        if (userIds.includes(userId.toString())) {
            const otherUserId = userIds.find(id => id !== userId.toString());
            const lastMessage = messages[messages.length - 1];
            const unreadCount = messages.filter(msg => 
                msg.receiverId === userId && !msg.read
            ).length;
            
            userChats.set(otherUserId, {
                lastMessage: lastMessage,
                unreadCount: unreadCount,
                lastActivity: lastMessage ? lastMessage.timestamp : null
            });
        }
    }
    
    return Array.from(userChats.entries()).map(([otherUserId, data]) => ({
        userId: otherUserId,
        ...data
    })).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
}

// Socket.IO event handlers
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        
        // User joins with their ID
        socket.on('join', async (userId) => {
            try {
                const user = await User.findOne({ userId: userId });
                if (user) {
                    socket.userId = userId;
                    onlineUsers.set(userId, {
                        socketId: socket.id,
                        username: user.username,
                        avatar: user.avatar,
                        lastSeen: new Date()
                    });
                    userSockets.set(socket.id, userId);
                    
                    // Join user's personal room
                    socket.join(`user_${userId}`);
                    
                    // Notify others that user is online
                    socket.broadcast.emit('user_online', {
                        userId: userId,
                        username: user.username,
                        avatar: user.avatar
                    });
                    
                    console.log(`User ${user.username} (${userId}) joined`);
                }
            } catch (error) {
                console.error('Error joining user:', error);
            }
        });
        
        // Send private message
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, message, type = 'text' } = data;
                const senderId = socket.userId;
                
                if (!senderId || !receiverId || !message) {
                    return;
                }
                
                // Save message
                const savedMessage = saveMessage(senderId, receiverId, message, type);
                
                // Send to receiver if online
                const receiverSocket = onlineUsers.get(receiverId);
                if (receiverSocket) {
                    io.to(receiverSocket.socketId).emit('new_message', {
                        ...savedMessage,
                        senderUsername: onlineUsers.get(senderId)?.username
                    });
                }
                
                // Send confirmation to sender
                socket.emit('message_sent', savedMessage);
                
                console.log(`Message sent from ${senderId} to ${receiverId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });
        
        // Mark messages as read
        socket.on('mark_read', async (data) => {
            try {
                const { otherUserId } = data;
                const userId = socket.userId;
                
                if (!userId || !otherUserId) return;
                
                markMessagesAsRead(userId, otherUserId);
                
                // Notify sender that messages were read
                const senderSocket = onlineUsers.get(otherUserId);
                if (senderSocket) {
                    io.to(senderSocket.socketId).emit('messages_read', {
                        readerId: userId
                    });
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        
        // Typing indicator
        socket.on('typing_start', (data) => {
            const { receiverId } = data;
            const senderId = socket.userId;
            
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit('user_typing', {
                    userId: senderId,
                    username: onlineUsers.get(senderId)?.username
                });
            }
        });
        
        socket.on('typing_stop', (data) => {
            const { receiverId } = data;
            const senderId = socket.userId;
            
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit('user_stopped_typing', {
                    userId: senderId
                });
            }
        });
        
        // Disconnect
        socket.on('disconnect', () => {
            const userId = userSockets.get(socket.id);
            if (userId) {
                onlineUsers.delete(userId);
                userSockets.delete(socket.id);
                
                // Notify others that user is offline
                socket.broadcast.emit('user_offline', { userId });
                
                console.log(`User ${userId} disconnected`);
            }
        });
    });
}

// REST API routes for chat
function setupChatRoutes(app) {
    // Get chat messages between two users
    app.get('/api/chat/messages/:otherUserId', async (req, res) => {
        try {
            const { otherUserId } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const messages = getChatMessages(userId, otherUserId);
            res.json({ messages });
        } catch (error) {
            console.error('Error getting messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    // Get recent chats
    app.get('/api/chat/recent', async (req, res) => {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const recentChats = getRecentChats(userId);
            
            // Get user details for each chat
            const chatsWithDetails = await Promise.all(
                recentChats.map(async (chat) => {
                    const user = await User.findOne({ userId: chat.userId });
                    return {
                        ...chat,
                        username: user?.username || 'Unknown User',
                        avatar: user?.avatar || '/images/default-avatar.png',
                        online: onlineUsers.has(chat.userId)
                    };
                })
            );
            
            res.json({ chats: chatsWithDetails });
        } catch (error) {
            console.error('Error getting recent chats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    // Get unread count
    app.get('/api/chat/unread-count', async (req, res) => {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const count = getUnreadCount(userId);
            res.json({ unreadCount: count });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    // Mark messages as read
    app.post('/api/chat/mark-read/:otherUserId', async (req, res) => {
        try {
            const { otherUserId } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            markMessagesAsRead(userId, otherUserId);
            res.json({ success: true });
        } catch (error) {
            console.error('Error marking messages as read:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}

module.exports = {
    setupSocketHandlers,
    setupChatRoutes,
    initializeUserChat,
    getChatMessages,
    saveMessage,
    markMessagesAsRead,
    getUnreadCount,
    getRecentChats,
    onlineUsers
}; 