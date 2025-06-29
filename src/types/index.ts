export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  isAdmin: boolean;
  coins: number;
  level: number;
  experience: number;
  joinedAt: Date;
  lastActive: Date;
  status: 'online' | 'offline' | 'away';
}

export interface VoiceUser extends User {
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  role: 'admin' | 'moderator' | 'member';
  roomId?: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  type: 'user' | 'system' | 'admin';
  roomId?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  currentUsers: number;
  isPrivate: boolean;
  password?: string;
  createdBy: string;
  createdAt: Date;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  totalCoins: number;
  highScore: number;
  achievements: string[];
}