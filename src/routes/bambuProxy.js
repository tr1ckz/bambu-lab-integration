const express = require('express');
const router = express.Router();
const bambuCloud = require('../services/bambuCloud');

// Helper page for token entry
router.get('/login-proxy', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Bambu Lab Login</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            background: #f7fafc;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h2 { color: #2d3748; margin-top: 0; }
        .step {
            background: #edf2f7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }
        .step strong { color: #667eea; }
        .status {
            text-align: center;
            padding: 20px;
            font-size: 18px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error { color: #e53e3e; margin-top: 10px; }
        .success { color: #38a169; margin-top: 10px; }
        code { background: #2d3748; color: #68d391; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        button {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 15px;
        }
        button:hover { background: #5a67d8; }
        input {
            width: 100%;
            padding: 8px;
            margin-top: 8px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-family: monospace;
            font-size: 13px;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>🔐 Bambu Lab Login</h2>
        
        <div id="instructions">
            <div class="step">
                <strong>Instructions:</strong><br>
                1. Click the button below to open Bambu Lab login<br>
                2. Log in to your account<br>
                3. Come back to this window - the token will be detected automatically!
            </div>
            <button onclick="openAndMonitor()">Open Bambu Lab & Start Monitoring</button>
        </div>
        
        <div id="monitoring" style="display:none;">
            <div class="status">
                <div class="spinner"></div>
                <p>Monitoring for login...</p>
                <p style="font-size: 14px; color: #718096;">Log in to Bambu Lab in the other window</p>
                <p style="font-size: 12px; color: #a0aec0; margin-top: 10px;">If automatic detection fails, manual instructions will appear...</p>
            </div>
        </div>
        
        <div id="manualInstructions" style="display:none;">
            <div class="step">
                <strong>📋 Copy your token from Bambu Lab:</strong>
            </div>
            <div class="step">
                1. In the Bambu Lab window, press <code>F12</code><br>
                2. Click the <strong>Application</strong> tab (or <strong>Storage</strong>)<br>
                3. Expand <strong>Local Storage</strong> on the left<br>
                4. Click <strong>https://bambulab.com</strong><br>
                5. Find the row with Key: <code>accessToken</code><br>
                6. Double-click the Value column and copy it (Ctrl+C)
            </div>
            <div class="step">
                Paste your token here:<br>
                <input type="text" id="manualTokenInput" placeholder="Paste token here...">
                <button onclick="submitManualToken()">Submit Token</button>
            </div>
        </div>
        
        <div id="result"></div>
    </div>
    
    <script>
        let loginWindow = null;
        let monitorInterval = null;
        let attemptCount = 0;
        const MAX_ATTEMPTS = 15;
        
        function openAndMonitor() {
            loginWindow = window.open('https://bambulab.com/en-us/sign-in', 'bambu_login', 'width=800,height=900');
            
            if (!loginWindow) {
                document.getElementById('result').innerHTML = '<div class="error">Please allow popups and try again</div>';
                return;
            }
            
            document.getElementById('instructions').style.display = 'none';
            document.getElementById('monitoring').style.display = 'block';
            attemptCount = 0;
            
            monitorInterval = setInterval(checkForToken, 2000);
            
            const closedCheckInterval = setInterval(() => {
                if (loginWindow.closed) {
                    clearInterval(closedCheckInterval);
                    clearInterval(monitorInterval);
                    if (!document.getElementById('result').innerHTML) {
                        document.getElementById('monitoring').style.display = 'none';
                        document.getElementById('result').innerHTML = '<div class="error">Window closed. Please try again.</div>';
                        setTimeout(() => {
                            document.getElementById('instructions').style.display = 'block';
                            document.getElementById('result').innerHTML = '';
                        }, 3000);
                    }
                }
            }, 500);
        }
        
        async function checkForToken() {
            attemptCount++;
            
            if (attemptCount >= MAX_ATTEMPTS) {
                clearInterval(monitorInterval);
                document.getElementById('monitoring').style.display = 'none';
                document.getElementById('manualInstructions').style.display = 'block';
                return;
            }
            
            try {
                let token = null;
                
                try {
                    token = loginWindow.localStorage.getItem('accessToken') ||
                            loginWindow.localStorage.getItem('access_token') ||
                            loginWindow.localStorage.getItem('authToken') ||
                            loginWindow.localStorage.getItem('token');
                } catch (e) {
                    // Cross-origin blocked
                }
                
                if (token && token !== 'null' && token !== 'undefined') {
                    clearInterval(monitorInterval);
                    await submitToken(token);
                }
            } catch (error) {
                // Expected
            }
        }
        
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'BAMBU_TOKEN' && event.data.token) {
                clearInterval(monitorInterval);
                await submitToken(event.data.token);
            }
        });
        
        async function submitManualToken() {
            const token = document.getElementById('manualTokenInput').value.trim();
            if (token) {
                document.getElementById('manualInstructions').style.display = 'none';
                await submitToken(token);
            } else {
                document.getElementById('result').innerHTML = '<div class="error">Please paste a token</div>';
            }
        }
        
        async function submitToken(token) {
            document.getElementById('monitoring').style.display = 'none';
            document.getElementById('manualInstructions').style.display = 'none';
            document.getElementById('result').innerHTML = '<div class="status"><div class="spinner"></div><p>Validating token...</p></div>';
            
            try {
                const response = await fetch('/bambu-proxy/capture-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('result').innerHTML = '<div class="success">✓ Successfully logged in! Closing...</div>';
                    if (loginWindow && !loginWindow.closed) {
                        loginWindow.close();
                    }
                    window.opener.postMessage({ type: 'BAMBU_LOGIN_SUCCESS' }, '*');
                    setTimeout(() => window.close(), 1500);
                } else {
                    document.getElementById('result').innerHTML = '<div class="error">Invalid token: ' + (data.error || 'Unknown error') + '</div>';
                    setTimeout(() => {
                        document.getElementById('instructions').style.display = 'block';
                        document.getElementById('result').innerHTML = '';
                    }, 3000);
                }
            } catch (error) {
                document.getElementById('result').innerHTML = '<div class="error">Failed to validate token</div>';
                setTimeout(() => {
                    document.getElementById('instructions').style.display = 'block';
                    document.getElementById('result').innerHTML = '';
                }, 3000);
            }
        }
    </script>
</body>
</html>
  `);
});

// Endpoint to capture token from proxy
router.post('/capture-token', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, error: 'No token provided' });
  }
  
  try {
    console.log('Validating token from proxy...');
    const result = await bambuCloud.loginWithToken(token);
    
    if (result.success) {
      req.session.accessToken = result.token;
      req.session.region = result.region;
      req.session.isAuthenticated = true;
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, error: 'Session save error' });
        }
        
        console.log('Token validated and session saved. Region:', result.region);
        res.json({ success: true, region: result.region });
      });
    } else {
      console.error('Token validation failed:', result.error);
      res.status(401).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;
