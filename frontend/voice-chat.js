// إعداد متغيرات WebRTC و WebSocket
window.ws = null; // اتصال WebSocket عام
let username = window.currentUsername;
let roomName = window.currentRoomName || 'game-room';
let localStream = null;
let peers = {}; // { username: RTCPeerConnection }
let joined = false;
let isMuted = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// زر الميكروفون
const micBtn = document.getElementById('voiceChatBtn');

console.log('username:', username, 'roomName:', roomName);

const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// إنشاء أو إعادة استخدام WebSocket
function getWebSocket() {
  if (window.ws && window.ws.readyState === WebSocket.OPEN) return window.ws;
  
  const wsUrl = BACKEND_URL.replace('https://', 'wss://');
  console.log('Attempting to connect to WebSocket:', wsUrl);
  
  window.ws = new WebSocket(wsUrl);
  window.ws.onopen = () => {
    console.log('WebSocket connected successfully');
    reconnectAttempts = 0;
    
    // إرسال رسالة انضمام
    if (username) {
      window.ws.send(JSON.stringify({ 
        type: 'join', 
        username: username 
      }));
    }
  };
  
  window.ws.onmessage = handleWSMessage;
  
  window.ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    joined = false;
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
      
      setTimeout(() => {
        getWebSocket();
      }, 5000);
    } else {
      console.error('Max reconnect attempts reached');
      showError('فشل في إعادة الاتصال. يرجى تحديث الصفحة');
    }
  };
  
  window.ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return window.ws;
}

// بدء المحادثة الصوتية
async function joinVoiceChannel() {
  if (joined) return;
  
  try {
    // طلب إذن الميكروفون
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1, // تحسين للأداء
        sampleRate: 48000,
        sampleSize: 16
      }
    });
    
    console.log('Microphone access granted');
    
    const ws = getWebSocket();
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending join_voice_room', { roomName, username });
      ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
      joined = true;
      showSuccess('تم الانضمام للغرفة الصوتية');
    } else {
      ws.addEventListener('open', function handler() {
        console.log('Sending join_voice_room', { roomName, username });
        ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
        joined = true;
        showSuccess('تم الانضمام للغرفة الصوتية');
        ws.removeEventListener('open', handler);
      });
    }
  } catch (error) {
    console.error('Error accessing microphone:', error);
    
    if (error.name === 'NotAllowedError') {
      showError('تم رفض إذن الميكروفون. يرجى السماح بالوصول للميكروفون');
    } else if (error.name === 'NotFoundError') {
      showError('لم يتم العثور على ميكروفون. تأكد من توصيل الميكروفون');
    } else {
      showError('خطأ في الوصول للميكروفون: ' + error.message);
    }
    
    throw error;
  }
}

// مغادرة المحادثة الصوتية
function leaveVoiceChannel() {
  if (!joined) return;
  
  try {
    const ws = getWebSocket();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave_voice_room', roomName, username }));
    }
    
    // إغلاق جميع الاتصالات
    Object.values(peers).forEach(pc => {
      try {
        pc.close();
      } catch (e) {
        console.warn('Error closing peer connection:', e);
      }
    });
    peers = {};
    
    // إيقاف الميكروفون
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      localStream = null;
    }
    
    joined = false;
    isMuted = false;
    showSuccess('تم مغادرة الغرفة الصوتية');
    
  } catch (error) {
    console.error('Error leaving voice channel:', error);
    showError('خطأ في مغادرة الغرفة الصوتية');
  }
}

// التعامل مع رسائل WebSocket
async function handleWSMessage(event) {
  try {
    const data = JSON.parse(event.data);
    console.log('Received message:', data.type);
    
    switch (data.type) {
      case 'voice_user_joined':
        if (data.username !== username) {
          console.log('New user joined:', data.username);
          createPeerConnection(data.username, true);
        }
        break;
        
      case 'voice_user_left':
        console.log('User left:', data.username);
        if (peers[data.username]) {
          try {
            peers[data.username].close();
            delete peers[data.username];
          } catch (e) {
            console.warn('Error closing peer connection:', e);
          }
        }
        const audio = document.getElementById('audio-' + data.username);
        if (audio) {
          try {
            audio.remove();
          } catch (e) {
            console.warn('Error removing audio element:', e);
          }
        }
        break;
        
      case 'webrtc_signal':
        await handleSignal(data.from, data.signal);
        break;
        
      case 'muted_by_admin':
        muteMyMic();
        showWarning('تم كتم صوتك من قبل المشرف');
        break;
        
      case 'error':
        showError(data.message || 'خطأ في الخادم');
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
}

// إنشاء PeerConnection
function createPeerConnection(remoteUsername, isInitiator) {
  console.log('Creating peer connection for:', remoteUsername, 'initiator:', isInitiator);
  
  try {
    // تحسين إعدادات RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // إضافة الميكروفون المحلي
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        // تحسين جودة الصوت
        const audioParams = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };
        
        try {
          audioTrack.applyConstraints(audioParams);
        } catch (e) {
          console.warn('Could not apply audio constraints:', e);
        }
        
        pc.addTrack(audioTrack, localStream);
      }
    }

    // معالجة ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to', remoteUsername);
        const ws = getWebSocket();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'webrtc_signal',
            roomName,
            from: username,
            to: remoteUsername,
            signal: { candidate: event.candidate }
          }));
        }
      }
    };

    // معالجة الصوت الوارد
    pc.ontrack = (event) => {
      console.log('Received remote track from', remoteUsername);
      
      try {
        const remoteAudio = document.createElement('audio');
        remoteAudio.id = 'audio-' + remoteUsername;
        remoteAudio.controls = false;
        remoteAudio.autoplay = true;
        remoteAudio.volume = 0.8;
        remoteAudio.srcObject = event.streams[0];
        
        // إضافة معالجة الأخطاء
        remoteAudio.onerror = (e) => {
          console.error('Audio error:', e);
        };
        
        remoteAudio.onloadedmetadata = () => {
          console.log('Remote audio loaded for:', remoteUsername);
        };
        
        document.body.appendChild(remoteAudio);
      } catch (error) {
        console.error('Error creating remote audio:', error);
      }
    };

    // معالجة تغيير حالة الاتصال
    pc.onconnectionstatechange = () => {
      console.log('Connection state for', remoteUsername, ':', pc.connectionState);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('Connection failed/disconnected for:', remoteUsername);
        try {
          pc.close();
          delete peers[remoteUsername];
        } catch (e) {
          console.warn('Error closing failed connection:', e);
        }
      }
    };

    // إنشاء offer إذا كان initiator
    if (isInitiator) {
      pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      }).then(offer => {
        console.log('Created offer for', remoteUsername);
        return pc.setLocalDescription(offer);
      }).then(() => {
        console.log('Sending SDP offer to', remoteUsername);
        const ws = getWebSocket();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'webrtc_signal',
            roomName,
            from: username,
            to: remoteUsername,
            signal: { sdp: pc.localDescription }
          }));
        }
      }).catch(error => {
        console.error('Error creating offer:', error);
        showError('خطأ في إنشاء الاتصال الصوتي');
      });
    }
    
    peers[remoteUsername] = pc;
    return pc;
    
  } catch (error) {
    console.error('Error creating peer connection:', error);
    showError('خطأ في إنشاء الاتصال الصوتي');
    throw error;
  }
}

// استقبال إشارات WebRTC
async function handleSignal(from, signal) {
  console.log('Handling signal from', from, 'type:', signal.sdp ? 'SDP' : 'ICE');
  
  try {
    let pc = peers[from];
    if (!pc) {
      createPeerConnection(from, false);
      pc = peers[from];
    }
    
    if (signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      
      if (signal.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Sending SDP answer to', from);
        
        const ws = getWebSocket();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'webrtc_signal',
            roomName,
            from: username,
            to: from,
            signal: { sdp: answer }
          }));
        }
      }
    } else if (signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      console.log('Added ICE candidate from', from);
    }
  } catch (error) {
    console.error('Error handling signal:', error);
    showError('خطأ في معالجة إشارة الاتصال');
  }
}

// تشغيل صوت الطرف الآخر
function playRemoteAudio(username, stream) {
  try {
    const audio = document.getElementById('audio-' + username) || document.createElement('audio');
    audio.id = 'audio-' + username;
    audio.controls = false;
    audio.autoplay = true;
    audio.volume = 0.8;
    
    // إضافة معالج للتحكم في الصوت
    audio.addEventListener('volumechange', (event) => {
      if (audio.volume > 1.0) audio.volume = 1.0;
      if (audio.volume < 0.1) audio.volume = 0.1;
    });
    
    audio.srcObject = stream;
    document.body.appendChild(audio);
    
  } catch (error) {
    console.error('Error playing remote audio:', error);
  }
}

// كتم/إلغاء كتم الميكروفون
function toggleMute() {
  if (!localStream) return;
  
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  
  const micBtn = document.getElementById('voiceChatBtn');
  if (micBtn) {
    if (isMuted) {
      micBtn.classList.add('muted');
      micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      showWarning('تم كتم الميكروفون');
    } else {
      micBtn.classList.remove('muted');
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      showSuccess('تم إلغاء كتم الميكروفون');
    }
  }
}

// كتم الميكروفون من قبل المشرف
function muteMyMic() {
  if (!localStream) return;
  
  isMuted = true;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = false;
  });
  
  const micBtn = document.getElementById('voiceChatBtn');
  if (micBtn) {
    micBtn.classList.add('muted');
    micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
  }
}

// دوال الإشعارات
function showSuccess(message) {
  if (window.showNotification) {
    window.showNotification(message, 'success');
  } else {
    console.log('Success:', message);
  }
}

function showError(message) {
  if (window.showNotification) {
    window.showNotification(message, 'error');
  } else {
    console.error('Error:', message);
  }
}

function showWarning(message) {
  if (window.showNotification) {
    window.showNotification(message, 'warning');
  } else {
    console.warn('Warning:', message);
  }
}

// ربط زر الميكروفون
if (micBtn) {
  micBtn.addEventListener('click', async () => {
    if (!joined) {
      try {
        await joinVoiceChannel();
        micBtn.classList.add('active');
      } catch (error) {
        console.error('Failed to join voice channel:', error);
      }
    } else {
      leaveVoiceChannel();
      micBtn.classList.remove('active');
    }
  });
}

// تصدير الدوال للاستخدام الخارجي
window.joinVoiceChannel = joinVoiceChannel;
window.leaveVoiceChannel = leaveVoiceChannel;
window.toggleMute = toggleMute;
window.muteMyMic = muteMyMic; 