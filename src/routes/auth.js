const express = require('express');
const router = express.Router();
const bambuCloud = require('../services/bambuCloud');
const passport = require('passport');

// Email/password login - the real deal!
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }

  try {
    const result = await bambuCloud.loginWithCredentials(email, password);
    
    if (result.success) {
      req.session.accessToken = result.token;
      req.session.region = result.region;
      req.session.isAuthenticated = true;
      
      return res.json({ 
        success: true, 
        message: 'Login successful',
        region: result.region
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: result.error || 'Login failed'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

// Simple token login
router.post('/token-login', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ 
      success: false, 
      error: 'Access token is required' 
    });
  }

  try {
    const result = await bambuCloud.loginWithToken(accessToken);
    
    if (result.success) {
      req.session.accessToken = result.token;
      req.session.region = result.region;
      req.session.isAuthenticated = true;
      
      return res.json({ 
        success: true, 
        message: 'Login successful' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: result.error || 'Invalid access token'
      });
    }
  } catch (error) {
    console.error('Token login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication
    req.session.isAuthenticated = true;
    req.session.user = req.user;
    res.redirect('/');
  }
);

// Check authentication status
router.get('/check-auth', (req, res) => {
  res.json({
    authenticated: !!req.session.isAuthenticated,
    region: req.session.region
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Login endpoint - supports both password and token auth
router.post('/login', async (req, res) => {
  const { email, password, authToken } = req.body;

  // If auth token is provided, use that instead
  if (authToken) {
    const result = await bambuCloud.loginWithToken(authToken);
    
    if (result.success) {
      req.session.accessToken = result.token;
      req.session.region = result.region;
      req.session.isAuthenticated = true;
      
      return res.json({ 
        success: true, 
        message: 'Login successful' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: result.error 
      });
    }
  }

  // Otherwise use email/password
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password (or auth token) are required' });
  }

  const result = await bambuCloud.login(email, password);

  if (result.success) {
    // Store token in session
    req.session.accessToken = result.token;
    req.session.refreshToken = result.refreshToken;
    req.session.isAuthenticated = true;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      console.log('Login successful, session saved:', {
        hasToken: !!req.session.accessToken,
        isAuthenticated: req.session.isAuthenticated,
        tokenLength: result.token ? result.token.length : 0
      });

      res.json({ 
        success: true, 
        message: 'Login successful' 
      });
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: result.error 
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({ 
    authenticated: !!req.session.isAuthenticated 
  });
});

// Check if Bambu session exists (for popup login)
router.get('/check-bambu-session', (req, res) => {
  // This endpoint would check if the user has logged in via the popup
  // For now, just return current auth status
  res.json({ 
    authenticated: !!req.session.isAuthenticated,
    message: 'After logging in at bambulab.com, manually enter your token from browser storage'
  });
});

module.exports = router;
