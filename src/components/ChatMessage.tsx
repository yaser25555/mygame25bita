import React from 'react';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  type: 'user' | 'system';
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs">
          {message.text}
        </div>
      </div>
    );
  }

  const isCurrentUser = message.sender === 'أنت';

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isCurrentUser 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
            : 'bg-white/10 text-white'
        }`}>
          {!isCurrentUser && (
            <p className="text-xs font-semibold mb-1 opacity-70">{message.sender}</p>
          )}
          <p className="text-sm leading-relaxed">{message.text}</p>
          <p className={`text-xs mt-1 ${
            isCurrentUser ? 'text-white/70' : 'text-gray-400'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;