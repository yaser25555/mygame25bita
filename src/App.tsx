import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import MainDashboard from './components/MainDashboard';
import { wsService } from './services/websocket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (token && username) {
      setUserData({ token, username, isAdmin });
      setIsAuthenticated(true);
      
      // Connect to WebSocket
      wsService.connect().catch(error => {
        console.error('Failed to connect to WebSocket:', error);
      });
    }
    
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = async (userData: any) => {
    setUserData(userData);
    setIsAuthenticated(true);
    
    // Connect to WebSocket after successful authentication
    try {
      await wsService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    wsService.disconnect();
    setIsAuthenticated(false);
    setUserData(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <MainDashboard userData={userData} onLogout={handleLogout} />;
}

export default App;