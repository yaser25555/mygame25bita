// إعداد متغيرات WebRTC و WebSocket
let ws = null; // اتصال WebSocket
let username = window.currentUsername || localStorage.getItem('username') || prompt('ادخل اسمك');
let roomName = window.currentRoomName || 'game-room'; // يمكنك تغييره حسب منطق غرفتك
let localStream = null;
let peers = {}; // { username: RTCPeerConnection }
let joined = false;

// زر الميكروفون
const micBtn = document.getElementById('voiceChatBtn');

// إنشاء أو إعادة استخدام WebSocket
function getWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;
  
  // استخدام URL محدد للـ WebSocket
  const wsUrl = 'wss://mygame25bita.onrender.com';
  console.log('Attempting to connect to WebSocket:', wsUrl);
  
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    console.log('WebSocket connected successfully');
    console.log('WebSocket state:', ws.readyState);
  };
  
  ws.onmessage = handleWSMessage;
  
  ws.onclose = (event) => {
    console.log('WebSocket closed');
    console.log('Close event:', event);
    console.log('Close code:', event.code);
    console.log('Close reason:', event.reason);
    joined = false;
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
}

// بدء المحادثة الصوتية
async function joinVoiceChannel() {
  if (joined) return;
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ws = getWebSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
    joined = true;
  } else {
    ws.addEventListener('open', function handler() {
      ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
      joined = true;
      ws.removeEventListener('open', handler);
    });
  }
}

// مغادرة المحادثة الصوتية
function leaveVoiceChannel() {
  if (!joined) return;
  getWebSocket().send(JSON.stringify({ type: 'leave_voice_room', roomName, username }));
  Object.values(peers).forEach(pc => pc.close());
  peers = {};
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  joined = false;
}

// التعامل مع رسائل WebSocket
async function handleWSMessage(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'voice_user_joined') {
    if (data.username !== username) createPeerConnection(data.username, true);
  } else if (data.type === 'voice_user_left') {
    if (peers[data.username]) { peers[data.username].close(); delete peers[data.username]; }
    const audio = document.getElementById('audio-' + data.username);
    if (audio) audio.remove();
  } else if (data.type === 'webrtc_signal') {
    handleSignal(data.from, data.signal);
  } else if (data.type === 'muted_by_admin') {
    muteMyMic();
  }
}

// إنشاء PeerConnection
function createPeerConnection(remoteUsername, isInitiator) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  if (localStream) localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      getWebSocket().send(JSON.stringify({
        type: 'webrtc_signal', roomName, from: username, to: remoteUsername, signal: { candidate: event.candidate }
      }));
    }
  };
  pc.ontrack = (event) => { playRemoteAudio(remoteUsername, event.streams[0]); };
  peers[remoteUsername] = pc;
  if (isInitiator) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      getWebSocket().send(JSON.stringify({
        type: 'webrtc_signal', roomName, from: username, to: remoteUsername, signal: { sdp: offer }
      }));
    });
  }
}

// استقبال إشارات WebRTC
async function handleSignal(from, signal) {
  let pc = peers[from];
  if (!pc) { createPeerConnection(from, false); pc = peers[from]; }
  if (signal.sdp) {
    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    if (signal.sdp.type === 'offer') {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getWebSocket().send(JSON.stringify({
        type: 'webrtc_signal', roomName, from: username, to: from, signal: { sdp: answer }
      }));
    }
  } else if (signal.candidate) {
    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
  }
}

// تشغيل صوت الطرف الآخر
function playRemoteAudio(username, stream) {
  let audio = document.getElementById('audio-' + username);
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'audio-' + username;
    audio.autoplay = true;
    document.body.appendChild(audio);
  }
  audio.srcObject = stream;
}

// ربط زر الميكروفون
if (micBtn) {
  micBtn.addEventListener('click', async () => {
    if (!joined) {
      await joinVoiceChannel();
      micBtn.classList.add('active');
    } else {
      leaveVoiceChannel();
      micBtn.classList.remove('active');
    }
  });
}

function muteMyMic() {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => track.enabled = false);
    alert('تم كتم صوتك من قبل المشرف');
  }
} 