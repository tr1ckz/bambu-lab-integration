import { useEffect, useState } from 'react';
import './LoadingSplash.css';

interface LoadingSplashProps {
  message?: string;
  progress?: number;
  onComplete?: () => void;
  checkServerHealth?: boolean;
  backgroundImage?: string;
}

function LoadingSplash({ 
  message = 'Loading...', 
  progress, 
  onComplete,
  checkServerHealth = false,
  backgroundImage
}: LoadingSplashProps) {
  const [serverReady, setServerReady] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showRefresh, setShowRefresh] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (serverReady || !checkServerHealth) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShowRefresh(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [serverReady, checkServerHealth]);

  useEffect(() => {
    if (!checkServerHealth) return;

    const checkServer = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          cache: 'no-cache',
        });
        if (response.ok) {
          setServerReady(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 500);
        }
      } catch (error) {
        // Server not ready yet, keep checking
        setTimeout(checkServer, 1000);
      }
    };

    // Start checking after a brief delay
    setTimeout(checkServer, 2000);
  }, [checkServerHealth, onComplete]);

  return (
    <div className="loading-splash" style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}>
      <div className="loading-content">
        <div className="loading-logo">
          <div className="loading-spinner"></div>
          <h1>PrintHive</h1>
        </div>
        
        <div className="loading-message">
          {message}
        </div>

        {checkServerHealth && !serverReady && (
          <div className="loading-countdown">
            {countdown}s
          </div>
        )}

        {showRefresh && (
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem' }}
          >
            Refresh
          </button>
        )}

        {progress !== undefined && (
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill"
                style={{ width: `${progress}%` }}
              >
                <span className="loading-progress-text">{progress}%</span>
              </div>
            </div>
          </div>
        )}

        {serverReady && (
          <div className="loading-success">
            ✓ Server ready! Redirecting...
          </div>
        )}
      </div>

      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

export default LoadingSplash;
