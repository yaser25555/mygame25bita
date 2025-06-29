const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mygame25bita-7eqw.onrender.com';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
      isAdmin: boolean;
      username: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.token = response.token;
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('isAdmin', response.isAdmin ? 'true' : 'false');

    return response;
  }

  async register(username: string, email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
  }

  // User management
  async getCurrentUser() {
    return this.request('/api/users/me');
  }

  async updateProfile(data: any) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request('/api/users/upload-avatar', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  // Admin methods
  async getAllUsersAdmin() {
    return this.request('/api/users/admin/all');
  }

  async searchUsersAdmin(searchTerm: string) {
    return this.request(`/api/users/admin/search?q=${encodeURIComponent(searchTerm)}`);
  }

  async updateUserAdmin(userId: string, updates: any) {
    return this.request(`/api/users/admin/update/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getGameSettings() {
    return this.request('/api/game/settings');
  }

  async updateGameSettings(settings: any) {
    return this.request('/api/game/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getSuspiciousActivity() {
    return this.request('/api/admin/suspicious-activity');
  }

  // Image management methods
  async getUsersWithImages(page: number = 1, limit: number = 12, search: string = '') {
    return this.request(`/api/users/admin/users-with-ids?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  async manageUserImage(targetUserId: string, action: string, imageData?: string, imageType?: string) {
    return this.request('/api/users/admin/manage-user-image', {
      method: 'PUT',
      body: JSON.stringify({
        targetUserId,
        action,
        imageData,
        imageType
      }),
    });
  }

  // Game data
  async getGameStats() {
    return this.request('/api/game/stats');
  }

  async updateGameStats(stats: any) {
    return this.request('/api/game/stats', {
      method: 'PUT',
      body: JSON.stringify(stats),
    });
  }

  // Voice chat
  async getRooms() {
    return this.request('/api/voice/rooms');
  }

  async createRoom(roomData: any) {
    return this.request('/api/voice/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async joinRoom(roomId: string, password?: string) {
    return this.request(`/api/voice/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async leaveRoom(roomId: string) {
    return this.request(`/api/voice/rooms/${roomId}/leave`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();