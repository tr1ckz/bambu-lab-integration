import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/check-auth', {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      // If OIDC logout, redirect to provider's end-session endpoint FIRST
      // Don't set authenticated to false yet - let the redirect happen
      if (data.oidcLogout && data.endSessionUrl) {
        window.location.href = data.endSessionUrl;
        return; // Don't continue after redirect
      }
      
      // Only set unauthenticated for non-OIDC logouts
      setIsAuthenticated(false);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
