import { useEffect, useState } from 'react';
import './LoadingSplash.css';

interface LoadingSplashProps {
  message?: string;
  progress?: number;
  onComplete?: () => void;
  checkServerHealth?: boolean;
}

function LoadingSplash({ 
  message, 
  progress, 
  onComplete,
  checkServerHealth = false
}: LoadingSplashProps) {
  const [serverReady, setServerReady] = useState(false);

  // Auto-refresh when server comes back up
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
          // Auto-refresh after brief delay
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (error) {
        // Server not ready yet, keep checking
        setTimeout(checkServer, 1000);
      }
    };

    // Start checking immediately
    checkServer();
  }, [checkServerHealth]);

  return (
    <div className="loading-splash" style={{ backgroundImage: `url(/images/splash.png)` }}>
      <div className="loading-content">
        <h1>PrintHive</h1>
      </div>

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
    </div>
  );
}

export default LoadingSplash;
