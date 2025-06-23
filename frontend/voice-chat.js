// Voice Chat Manager using Agora.io
class VoiceChatManager {
    constructor() {
        this.client = null;
        this.localAudioTrack = null;
        this.remoteUsers = {};
        this.isJoined = false;
        this.isMuted = false;
        
        // Agora Configuration
        this.appId = '852ff5f55a7a49b081b799358f2fc329'; // App ID من Agora.io
        this.channelName = 'voiceboom-game';
        this.token = null; // سيتم الحصول عليه من الخادم
        
        // UI Elements
        this.micButton = null;
        this.voiceStatus = null;
        
        this.init();
    }
    
    async init() {
        try {
            // إنشاء Agora Client
            this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            
            // إعداد event listeners
            this.setupEventListeners();
            
            console.log('🎤 Voice Chat Manager initialized');
        } catch (error) {
            console.error('❌ Error initializing Voice Chat:', error);
        }
    }
    
    setupEventListeners() {
        // عند انضمام مستخدم جديد
        this.client.on("user-published", async (user, mediaType) => {
            await this.client.subscribe(user, mediaType);
            console.log("🎤 New user joined voice chat:", user.uid);
            
            if (mediaType === "audio") {
                user.audioTrack.play();
                this.remoteUsers[user.uid] = user;
                this.updateVoiceStatus();
            }
        });
        
        // عند مغادرة مستخدم
        this.client.on("user-unpublished", (user) => {
            console.log("🎤 User left voice chat:", user.uid);
            delete this.remoteUsers[user.uid];
            this.updateVoiceStatus();
        });
        
        // عند انضمام المستخدم المحلي
        this.client.on("user-joined", (user) => {
            console.log("🎤 Local user joined voice chat");
            this.isJoined = true;
            this.updateVoiceStatus();
        });
        
        // عند مغادرة المستخدم المحلي
        this.client.on("user-left", (user) => {
            console.log("🎤 Local user left voice chat");
            this.isJoined = false;
            this.updateVoiceStatus();
        });
    }
    
    async joinVoiceChat(username) {
        try {
            if (!this.appId) {
                console.warn('⚠️ Agora App ID not set');
                return false;
            }
            
            // الحصول على token من الخادم
            await this.getToken(username);
            
            // الانضمام للقناة
            const uid = await this.client.join(this.appId, this.channelName, this.token, username);
            console.log("🎤 Joined voice chat with UID:", uid);
            
            // إنشاء وتشغيل الصوت المحلي
            this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            await this.client.publish(this.localAudioTrack);
            
            this.isJoined = true;
            this.updateVoiceStatus();
            
            return true;
        } catch (error) {
            console.error('❌ Error joining voice chat:', error);
            return false;
        }
    }
    
    async leaveVoiceChat() {
        try {
            if (this.localAudioTrack) {
                this.localAudioTrack.close();
                this.localAudioTrack = null;
            }
            
            await this.client.leave();
            this.isJoined = false;
            this.remoteUsers = {};
            this.updateVoiceStatus();
            
            console.log("🎤 Left voice chat");
        } catch (error) {
            console.error('❌ Error leaving voice chat:', error);
        }
    }
    
    toggleMute() {
        if (this.localAudioTrack) {
            if (this.isMuted) {
                this.localAudioTrack.setEnabled(true);
                this.isMuted = false;
                console.log("🎤 Microphone unmuted");
            } else {
                this.localAudioTrack.setEnabled(false);
                this.isMuted = true;
                console.log("🎤 Microphone muted");
            }
            this.updateVoiceStatus();
        }
    }
    
    async getToken(username) {
        try {
            // الحصول على token من الخادم
            const response = await fetch(`${BACKEND_URL}/api/voice/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    channelName: this.channelName,
                    username: username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
            } else {
                throw new Error('Failed to get token');
            }
        } catch (error) {
            console.error('❌ Error getting token:', error);
            // استخدام token مؤقت للتطوير
            this.token = null;
        }
    }
    
    updateVoiceStatus() {
        if (this.voiceStatus) {
            const userCount = Object.keys(this.remoteUsers).length + (this.isJoined ? 1 : 0);
            this.voiceStatus.textContent = `🎤 ${userCount} مستخدم في المحادثة الصوتية`;
        }
        
        if (this.micButton) {
            if (this.isMuted) {
                this.micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                this.micButton.classList.add('muted');
            } else {
                this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
                this.micButton.classList.remove('muted');
            }
        }
    }
    
    setAppId(appId) {
        this.appId = appId;
        console.log('🎤 Agora App ID set:', appId);
    }
    
    setUIElements(micButton, voiceStatus) {
        this.micButton = micButton;
        this.voiceStatus = voiceStatus;
        this.updateVoiceStatus();
    }
}

// إنشاء instance عام
window.voiceChatManager = new VoiceChatManager(); 