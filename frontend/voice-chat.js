// إعداد Agora Voice Chat
const AGORA_SERVER_URL = 'https://mygame25bita-1.onrender.com/api/voice/token'; // عدل هذا للرابط الصحيح
const CHANNEL_NAME = 'game-room';

let client, localAudioTrack, joined = false;

async function joinVoiceChannel() {
  if (joined) return;
  const res = await fetch(`${AGORA_SERVER_URL}?channelName=${CHANNEL_NAME}`);
  const data = await res.json();
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(data.appId, CHANNEL_NAME, data.token, data.uid);
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([localAudioTrack]);
  joined = true;
}

async function leaveVoiceChannel() {
  if (!joined) return;
  await localAudioTrack.close();
  await client.leave();
  joined = false;
}

// ربط زر الميكروفون
const micBtn = document.getElementById('voiceChatBtn');
if (micBtn) {
  micBtn.addEventListener('click', async () => {
    if (!joined) {
      await joinVoiceChannel();
      micBtn.classList.add('active');
    } else {
      await leaveVoiceChannel();
      micBtn.classList.remove('active');
    }
  });
} 