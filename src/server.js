require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'bambu-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve downloaded videos
app.use('/data/videos', express.static(path.join(__dirname, '../data/videos')));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve the simple login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index_simple.html'));
});

// Default route for all other paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index_simple.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Bambu Lab Integration server running on http://localhost:${PORT}`);
});
