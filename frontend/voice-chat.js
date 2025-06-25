// إعداد متغيرات WebRTC و WebSocket
window.ws = null; // اتصال WebSocket عام
let username = window.currentUsername;
let roomName = window.currentRoomName || 'game-room'; // يمكنك تغييره حسب منطق غرفتك
let localStream = null;
let peers = {}; // { username: RTCPeerConnection }
let joined = false;

// زر الميكروفون
const micBtn = document.getElementById('voiceChatBtn');

console.log('username:', username, 'roomName:', roomName);

const BACKEND_URL = "https://mygame25bita-7eqw.onrender.com";

// إنشاء أو إعادة استخدام WebSocket
function getWebSocket() {
  if (window.ws && window.ws.readyState === WebSocket.OPEN) return window.ws;
  
  // استخدام URL محدد للـ WebSocket
  const wsUrl = BACKEND_URL;
  console.log('Attempting to connect to WebSocket:', wsUrl);
  
  window.ws = new WebSocket(wsUrl);
  window.ws.onopen = () => {
    console.log('WebSocket connected successfully');
    console.log('WebSocket state:', window.ws.readyState);
  };
  
  window.ws.onmessage = handleWSMessage;
  
  window.ws.onclose = (event) => {
    console.log('WebSocket closed');
    console.log('Close event:', event);
    console.log('Close code:', event.code);
    console.log('Close reason:', event.reason);
    joined = false;
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
    // تحسين إعدادات الميكروفون
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 2,
        sampleRate: 48000,
        sampleSize: 16
      }
    });
    const ws = getWebSocket();
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending join_voice_room', { roomName, username });
      ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
      joined = true;
    } else {
      ws.addEventListener('open', function handler() {
        console.log('Sending join_voice_room', { roomName, username });
        ws.send(JSON.stringify({ type: 'join_voice_room', roomName, username }));
        joined = true;
        ws.removeEventListener('open', handler);
      });
    }
  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('لم يتمكن من الوصول إلى الميكروفون. يرجى التأكد من إعطاء الإذن للموقع');
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
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
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

// تشغيل صوت الطرف الآخر
function playRemoteAudio(username, stream) {
  // تحسين جودة الصوت للطرف الآخر
  const audio = document.getElementById('audio-' + username) || document.createElement('audio');
  audio.id = 'audio-' + username;
  audio.controls = false;
  audio.autoplay = true;
  audio.volume = 0.8; // تقليل الصوت قليلاً لتجنب التشويش
  
  // إضافة معالج للتحكم في الصوت
  audio.addEventListener('volumechange', (event) => {
    if (audio.volume > 1.0) audio.volume = 1.0;
    if (audio.volume < 0.1) audio.volume = 0.1;
  });
  
  audio.srcObject = stream;
  document.body.appendChild(audio);
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