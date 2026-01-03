const express = require('express');
const router = express.Router();
const bambuCloud = require('../services/bambuCloud');
const { storePrints, downloadCoverImage, downloadTimelapseVideo, updatePrintVideoPath, getAllPrintsFromDb } = require('../../database');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  console.log('Auth check:', {
    isAuthenticated: req.session.isAuthenticated,
    hasToken: !!req.session.accessToken,
    sessionID: req.sessionID
  });
  
  if (!req.session.isAuthenticated || !req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get user's printers
router.get('/printers', requireAuth, async (req, res) => {
  const result = await bambuCloud.getPrinters(req.session.accessToken, req.session.region || 'us');
  
  if (result.success) {
    res.json(result.printers);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Get print history/models
router.get('/models', requireAuth, async (req, res) => {
  const source = req.query.source || 'db'; // 'db' or 'cloud'
  
  if (source === 'cloud') {
    // Fetch from Bambu Cloud API
    const result = await bambuCloud.getPrintHistory(req.session.accessToken, req.session.region || 'us');
    
    if (result.success) {
      res.json({ hits: result.models || [] });
    } else {
      res.status(500).json({ error: result.error });
    }
  } else {
    // Fetch from local database
    try {
      const prints = getAllPrintsFromDb();
      res.json({ hits: prints });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch from database' });
    }
  }
});

// Get timelapses
router.get('/timelapses', requireAuth, async (req, res) => {
  const result = await bambuCloud.getTimelapses(req.session.accessToken, req.session.region || 'us');
  
  if (result.success) {
    res.json(result.timelapses);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Get timelapse video URL for a specific model
router.get('/timelapse/:modelId', requireAuth, async (req, res) => {
  const { modelId } = req.params;
  const result = await bambuCloud.getTimelapseUrl(modelId, req.session.accessToken, req.session.region || 'us');
  
  if (result.success && result.url) {
    // Redirect to the timelapse video URL
    res.redirect(result.url);
  } else {
    res.status(404).json({ error: result.error || 'Timelapse not found' });
  }
});

// Sync print history and download timelapses
router.post('/sync', requireAuth, async (req, res) => {
  try {
    console.log('Starting sync...');
    
    // Fetch print history from Bambu Cloud
    const result = await bambuCloud.getPrintHistory(req.session.accessToken, req.session.region || 'us');
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const tasks = result.models || [];
    console.log(`Fetched ${tasks.length} tasks from Bambu Cloud`);

    // Store prints in database
    const syncResult = storePrints(tasks);
    console.log(`Stored ${syncResult.newPrints} new prints, ${syncResult.updated} updated`);

    // Download cover images and timelapses
    console.log('Starting downloads...');
    console.log(`Processing ${Math.min(tasks.length, 50)} tasks for downloads`);
    
    // Process downloads (limit to avoid overwhelming the system)
    const downloadResults = await Promise.all(
      tasks.slice(0, 50).map(async (task) => {
        const result = { cover: false, video: false, modelId: task.modelId };
        
        // Download cover image
        if (task.cover) {
          try {
            const coverPath = await downloadCoverImage(task.cover, task.modelId);
            if (coverPath) result.cover = true;
          } catch (error) {
            console.log(`Failed to download cover for ${task.modelId}:`, error.message);
          }
        }

        // Download timelapse video
        try {
          console.log(`Checking timelapse for task ${task.id} / ${task.modelId}`);
          const videoResult = await bambuCloud.getTimelapseUrl(
            task.modelId, 
            req.session.accessToken, 
            req.session.region || 'us'
          );
          
          console.log(`Video result for ${task.modelId}:`, videoResult.success ? 'found' : videoResult.error);
          
          if (videoResult.success && videoResult.url) {
            console.log(`Downloading video from: ${videoResult.url.substring(0, 100)}...`);
            const videoPath = await downloadTimelapseVideo(videoResult.url, task.modelId, task.id);
            if (videoPath) {
              updatePrintVideoPath(task.modelId, videoPath);
              result.video = true;
              console.log(`✓ Downloaded video for ${task.modelId}`);
            }
          }
        } catch (error) {
          // This is normal - not all prints have timelapses
        }
        
        return result;
      })
    );

    const downloadedCovers = downloadResults.filter(r => r.cover).length;
    const downloadedVideos = downloadResults.filter(r => r.video).length;

    console.log(`=== DOWNLOAD SUMMARY ===`);
    console.log(`Downloaded ${downloadedCovers} covers and ${downloadedVideos} videos`);
    console.log(`Videos downloaded for:`, downloadResults.filter(r => r.video).map(r => r.modelId));

    res.json({
      success: true,
      newPrints: syncResult.newPrints,
      updated: syncResult.updated,
      total: syncResult.total,
      downloadedCovers,
      downloadedVideos
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed: ' + error.message });
  }
});

module.exports = router;
