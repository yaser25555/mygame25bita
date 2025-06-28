// إعداد متغيرات WebRTC و WebSocket
window.ws = null; // اتصال WebSocket عام
let username = localStorage.getItem('username') || 'مستخدم';
let roomName = 'game-room'; // يمكنك تغييره حسب منطق غرفتك
let localStream = null;
let peers = {}; // { username: RTCPeerConnection }
let joined = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let participants = new Set(); // قائمة المشاركين
let isMuted = false;
let isSettingsOpen = false;

// عناصر DOM
const micBtn = document.getElementById('mic-btn');
const settingsBtn = document.getElementById('settings-btn');
const leaveBtn = document.getElementById('leave-btn');
const settingsPanel = document.getElementById('settings-panel');
const usersGrid = document.getElementById('users-grid');
const participantsList = document.getElementById('participants-list');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const participantCount = document.getElementById('participant-count');
const notification = document.getElementById('notification');

// إعدادات الصوت
const audioSettings = {
  noiseSuppression: true,
  echoCancellation: true,
  autoGain: true
};

console.log('username:', username, 'roomName:', roomName);

// استخدام ملف التكوين المركزي
const BACKEND_URL = CONFIG.BACKEND_URL;

// إنشاء أو إعادة استخدام WebSocket
function getWebSocket() {
  if (window.ws && window.ws.readyState === WebSocket.OPEN) return window.ws;
  
  // إصلاح URL للـ WebSocket - تحويل HTTPS إلى WSS
  const wsUrl = BACKEND_URL.replace('https://', 'wss://');
  console.log('Attempting to connect to WebSocket:', wsUrl);
  
  window.ws = new WebSocket(wsUrl);
  window.ws.onopen = () => {
    console.log('WebSocket connected successfully');
    console.log('WebSocket state:', window.ws.readyState);
    reconnectAttempts = 0; // إعادة تعيين عداد المحاولات عند نجاح الاتصال
    showNotification('تم الاتصال بالخادم بنجاح', 'success');
    
    // إعادة الانضمام للغرفة الصوتية إذا كان المستخدم متصل سابقاً
    if (joined && localStream) {
      console.log('Reconnecting to voice room after WebSocket reconnection');
      window.ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
    }
  };
  
  window.ws.onmessage = handleWSMessage;
  
  window.ws.onclose = (event) => {
    console.log('WebSocket closed');
    console.log('Close event:', event);
    console.log('Close code:', event.code);
    console.log('Close reason:', event.reason);
    joined = false;
    showNotification('انقطع الاتصال بالخادم', 'error');
    
    // محاولة إعادة الاتصال إذا لم يكن الإغلاق مقصوداً
    if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      showNotification(`محاولة إعادة الاتصال ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`, 'info');
      setTimeout(() => {
        getWebSocket();
      }, 2000 * reconnectAttempts); // زيادة وقت الانتظار مع كل محاولة
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      showNotification('فشل في الاتصال بالخادم بعد عدة محاولات. يرجى تحديث الصفحة.', 'error');
    }
  };
  
  window.ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    showNotification('خطأ في الاتصال بالخادم', 'error');
  };
  
  return window.ws;
}

// بدء المحادثة الصوتية
async function joinVoiceChannel() {
  if (joined) return;
  try {
    // تحسين إعدادات الميكروفون
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: audioSettings.echoCancellation,
        noiseSuppression: audioSettings.noiseSuppression,
        autoGainControl: audioSettings.autoGain,
        channelCount: 2,
        sampleRate: 48000,
        sampleSize: 16
      }
    });
    
    console.log('Microphone access granted, stream obtained');
    showNotification('تم الوصول للميكروفون بنجاح', 'success');
    
    const ws = getWebSocket();
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending join_voice_room', { roomName, username });
      ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
      joined = true;
      updateMicButton(true);
      addSystemMessage(`${username} انضم للغرفة الصوتية`);
    } else {
      ws.addEventListener('open', function handler() {
        console.log('Sending join_voice_room', { roomName, username });
        ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
        joined = true;
        updateMicButton(true);
        addSystemMessage(`${username} انضم للغرفة الصوتية`);
        ws.removeEventListener('open', handler);
      });
    }
  } catch (error) {
    console.error('Error accessing microphone:', error);
    if (error.name === 'NotAllowedError') {
      showNotification('تم رفض الوصول للميكروفون. يرجى السماح للموقع بالوصول للميكروفون في إعدادات المتصفح.', 'error');
    } else if (error.name === 'NotFoundError') {
      showNotification('لم يتم العثور على ميكروفون. يرجى التأكد من توصيل ميكروفون بالجهاز.', 'error');
    } else {
      showNotification('خطأ في الوصول للميكروفون: ' + error.message, 'error');
    }
  }
}

// مغادرة المحادثة الصوتية
function leaveVoiceChannel() {
  if (!joined) return;
  
  console.log('Leaving voice channel');
  showNotification('مغادرة الغرفة الصوتية', 'info');
  
  try {
    getWebSocket().send(JSON.stringify({ type: 'leave_voice_room', roomName, username }));
  } catch (error) {
    console.error('Error sending leave message:', error);
  }
  
  // إغلاق جميع الاتصالات مع الأقران
  Object.values(peers).forEach(pc => {
    try {
      pc.close();
    } catch (error) {
      console.error('Error closing peer connection:', error);
    }
  });
  peers = {};
  
  // إيقاف تيار الميكروفون المحلي
  if (localStream) {
    localStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (error) {
        console.error('Error stopping track:', error);
      }
    });
    localStream = null;
  }
  
  // إزالة عناصر الصوت من الصفحة
  document.querySelectorAll('[id^="audio-"]').forEach(audio => {
    try {
      audio.remove();
    } catch (error) {
      console.error('Error removing audio element:', error);
    }
  });
  
  joined = false;
  participants.clear();
  updateParticipantsList();
  updateUsersGrid();
  updateMicButton(false);
  addSystemMessage(`${username} غادر الغرفة الصوتية`);
}

// التعامل مع رسائل WebSocket
async function handleWSMessage(event) {
  const data = JSON.parse(event.data);
  console.log('Received WebSocket message:', data);
  
  switch (data.type) {
    case 'voice_user_joined':
      if (data.username !== username) {
        createPeerConnection(data.username, true);
        participants.add(data.username);
        updateParticipantsList();
        updateUsersGrid();
        addSystemMessage(`${data.username} انضم للغرفة الصوتية`);
      }
      break;
      
    case 'voice_user_left':
      if (peers[data.username]) { 
        peers[data.username].close(); 
        delete peers[data.username]; 
      }
      participants.delete(data.username);
      updateParticipantsList();
      updateUsersGrid();
      const audio = document.getElementById('audio-' + data.username);
      if (audio) audio.remove();
      addSystemMessage(`${data.username} غادر الغرفة الصوتية`);
      break;
      
    case 'webrtc_signal':
      handleSignal(data.from, data.signal);
      break;
      
    case 'muted_by_admin':
      muteMyMic();
      showNotification('تم كتم صوتك من قبل المشرف', 'error');
      break;
      
    case 'chat_message':
      addChatMessage(data.sender, data.text, data.sender === username ? 'own' : 'other');
      break;
      
    case 'speaking_started':
      updateSpeakingStatus(data.username, true);
      break;
      
    case 'speaking_stopped':
      updateSpeakingStatus(data.username, false);
      break;
  }
}

// إنشاء PeerConnection
function createPeerConnection(remoteUsername, isInitiator) {
  console.log('createPeerConnection', remoteUsername, isInitiator);
  // تحسين إعدادات RTCPeerConnection
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle'
  });

  // تحسين جودة الصوت
  pc.setConfiguration({
    encodedInsertableStreams: true,
    rtcp: {
      reducedSize: true
    }
  });

  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const audioParams = {
        echoCancellation: audioSettings.echoCancellation,
        noiseSuppression: audioSettings.noiseSuppression,
        autoGainControl: audioSettings.autoGain
      };
      audioTrack.applyConstraints(audioParams);
      pc.addTrack(audioTrack, localStream);
    }
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('Sending ICE candidate to', remoteUsername, event.candidate);
      getWebSocket().send(JSON.stringify({
        type: 'webrtc_signal', roomName, from: username, to: remoteUsername, signal: { candidate: event.candidate }
      }));
    }
  };

  pc.ontrack = (event) => {
    console.log('Received remote track from', remoteUsername, event);
    // تحسين جودة الصوت للطرف الآخر
    const remoteAudio = document.createElement('audio');
    remoteAudio.id = 'audio-' + remoteUsername;
    remoteAudio.controls = false;
    remoteAudio.autoplay = true;
    remoteAudio.volume = 0.8; // تقليل الصوت قليلاً لتجنب التشويش
    remoteAudio.srcObject = event.streams[0];
    document.body.appendChild(remoteAudio);
  };

  if (isInitiator) {
    pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    }).then(offer => {
      console.log('Created offer for', remoteUsername, offer);
      return pc.setLocalDescription(offer);
    }).then(() => {
      console.log('Sending SDP offer to', remoteUsername, pc.localDescription);
      getWebSocket().send(JSON.stringify({
        type: 'webrtc_signal', roomName, from: username, to: remoteUsername, signal: { sdp: pc.localDescription }
      }));
    });
  }
  peers[remoteUsername] = pc;
  return pc;
}

// استقبال إشارات WebRTC
async function handleSignal(from, signal) {
  console.log('handleSignal from', from, signal);
  let pc = peers[from];
  if (!pc) { createPeerConnection(from, false); pc = peers[from]; }
  if (signal.sdp) {
    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    if (signal.sdp.type === 'offer') {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Sending SDP answer to', from, answer);
      getWebSocket().send(JSON.stringify({
        type: 'webrtc_signal', roomName, from: username, to: from, signal: { sdp: answer }
      }));
    }
  } else if (signal.candidate) {
    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    console.log('Added ICE candidate from', from, signal.candidate);
  }
}

// تحديث قائمة المشاركين
function updateParticipantsList() {
  participantsList.innerHTML = '';
  
  // إضافة المستخدم الحالي أولاً
  const currentUserItem = createParticipantItem(username, true);
  participantsList.appendChild(currentUserItem);
  
  // إضافة باقي المشاركين
  participants.forEach(participant => {
    if (participant !== username) {
      const participantItem = createParticipantItem(participant, false);
      participantsList.appendChild(participantItem);
    }
  });
  
  // تحديث العداد
  participantCount.textContent = `${participants.size + 1} مشارك`;
}

// إنشاء عنصر مشارك
function createParticipantItem(participantName, isCurrentUser) {
  const item = document.createElement('div');
  item.className = 'participant-item';
  if (isCurrentUser) item.classList.add('you');
  
  const avatar = document.createElement('div');
  avatar.className = 'participant-avatar';
  avatar.textContent = participantName[0]?.toUpperCase() || '?';
  
  const info = document.createElement('div');
  info.className = 'participant-info';
  
  const name = document.createElement('div');
  name.className = 'participant-name';
  name.textContent = participantName + (isCurrentUser ? ' (أنت)' : '');
  
  const status = document.createElement('div');
  status.className = 'participant-status';
  status.textContent = isCurrentUser ? 'متصل' : 'متصل';
  
  info.appendChild(name);
  info.appendChild(status);
  item.appendChild(avatar);
  item.appendChild(info);
  
  return item;
}

// تحديث شبكة المستخدمين
function updateUsersGrid() {
  usersGrid.innerHTML = '';
  
  // إضافة المستخدم الحالي
  const currentUserCard = createUserCard(username, true);
  usersGrid.appendChild(currentUserCard);
  
  // إضافة باقي المستخدمين
  participants.forEach(participant => {
    if (participant !== username) {
      const userCard = createUserCard(participant, false);
      usersGrid.appendChild(userCard);
    }
  });
}

// إنشاء بطاقة مستخدم
function createUserCard(userName, isCurrentUser) {
  const card = document.createElement('div');
  card.className = 'user-card';
  if (isCurrentUser) card.classList.add('you');
  
  const avatar = document.createElement('div');
  avatar.className = 'user-avatar';
  if (isCurrentUser) avatar.classList.add('you');
  avatar.textContent = userName[0]?.toUpperCase() || '?';
  
  const name = document.createElement('div');
  name.className = 'user-name';
  name.textContent = userName + (isCurrentUser ? ' (أنت)' : '');
  
  const status = document.createElement('div');
  status.className = 'user-status';
  status.textContent = 'متصل';
  
  card.appendChild(avatar);
  card.appendChild(name);
  card.appendChild(status);
  
  return card;
}

// تحديث حالة الميكروفون
function updateMicButton(isActive) {
  if (isActive) {
    micBtn.classList.add('active');
    micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  } else {
    micBtn.classList.remove('active');
    micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
  }
}

// إضافة رسالة محادثة
function addChatMessage(sender, text, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;
  
  const senderDiv = document.createElement('div');
  senderDiv.className = 'message-sender';
  senderDiv.textContent = sender;
  
  const textDiv = document.createElement('div');
  textDiv.className = 'message-text';
  textDiv.textContent = text;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString();
  
  messageDiv.appendChild(senderDiv);
  messageDiv.appendChild(textDiv);
  messageDiv.appendChild(timeDiv);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// إضافة رسالة نظام
function addSystemMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message system';
  
  const textDiv = document.createElement('div');
  textDiv.className = 'message-text';
  textDiv.textContent = text;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString();
  
  messageDiv.appendChild(textDiv);
  messageDiv.appendChild(timeDiv);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// إظهار إشعار
function showNotification(message, type = 'info') {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// تحديث حالة التحدث
function updateSpeakingStatus(userName, isSpeaking) {
  const userCard = document.querySelector(`[data-username="${userName}"]`);
  if (userCard) {
    if (isSpeaking) {
      userCard.classList.add('speaking');
    } else {
      userCard.classList.remove('speaking');
    }
  }
}

// كتم الميكروفون
function muteMyMic() {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => track.enabled = false);
    isMuted = true;
    updateMicButton(false);
    micBtn.classList.add('muted');
  }
}

// إرسال رسالة محادثة
function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  
  try {
    getWebSocket().send(JSON.stringify({
      type: 'chat_message',
      sender: username,
      text: text
    }));
    chatInput.value = '';
  } catch (error) {
    console.error('Error sending chat message:', error);
    showNotification('خطأ في إرسال الرسالة', 'error');
  }
}

// تبديل الإعدادات
function toggleSettings() {
  isSettingsOpen = !isSettingsOpen;
  settingsPanel.classList.toggle('show', isSettingsOpen);
}

// تحديث إعدادات الصوت
function updateAudioSettings() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.applyConstraints({
        echoCancellation: audioSettings.echoCancellation,
        noiseSuppression: audioSettings.noiseSuppression,
        autoGainControl: audioSettings.autoGain
      });
    }
  }
}

// إعداد الأحداث
document.addEventListener('DOMContentLoaded', () => {
  // زر الميكروفون
  micBtn.addEventListener('click', async () => {
    if (!joined) {
      await joinVoiceChannel();
    } else {
      if (isMuted) {
        // إلغاء الكتم
        if (localStream) {
          localStream.getAudioTracks().forEach(track => track.enabled = true);
        }
        isMuted = false;
        updateMicButton(true);
        micBtn.classList.remove('muted');
        showNotification('تم إلغاء كتم الميكروفون', 'success');
      } else {
        // كتم الميكروفون
        muteMyMic();
        showNotification('تم كتم الميكروفون', 'info');
      }
    }
  });

  // زر الإعدادات
  settingsBtn.addEventListener('click', toggleSettings);

  // زر المغادرة
  leaveBtn.addEventListener('click', () => {
    leaveVoiceChannel();
    setTimeout(() => {
      window.location.href = 'game.html';
    }, 1000);
  });

  // إرسال رسالة محادثة
  sendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  // إعدادات الصوت
  document.getElementById('noise-suppression').addEventListener('click', () => {
    audioSettings.noiseSuppression = !audioSettings.noiseSuppression;
    document.getElementById('noise-suppression').classList.toggle('active', audioSettings.noiseSuppression);
    updateAudioSettings();
  });

  document.getElementById('echo-cancellation').addEventListener('click', () => {
    audioSettings.echoCancellation = !audioSettings.echoCancellation;
    document.getElementById('echo-cancellation').classList.toggle('active', audioSettings.echoCancellation);
    updateAudioSettings();
  });

  document.getElementById('auto-gain').addEventListener('click', () => {
    audioSettings.autoGain = !audioSettings.autoGain;
    document.getElementById('auto-gain').classList.toggle('active', audioSettings.autoGain);
    updateAudioSettings();
  });

  // تفعيل الإعدادات الافتراضية
  document.getElementById('noise-suppression').classList.add('active');
  document.getElementById('echo-cancellation').classList.add('active');
  document.getElementById('auto-gain').classList.add('active');

  // إضافة رسالة ترحيب
  addSystemMessage('مرحباً بك في غرفة المحادثة الصوتية! اضغط على زر الميكروفون للانضمام.');
  
  // الاتصال بالخادم
  getWebSocket();
});

// معالجة إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  if (joined) {
    leaveVoiceChannel();
  }
}); 