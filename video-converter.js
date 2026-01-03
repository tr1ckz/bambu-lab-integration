const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Convert AVI to MP4
 * @param {string} inputPath - Path to AVI file
 * @param {string} outputPath - Path to output MP4 file
 * @returns {Promise<string>} - Resolves with output path
 */
function convertAviToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Converting ${path.basename(inputPath)} to MP4...`);
    
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',      // H.264 video codec
        '-preset fast',      // Fast encoding
        '-crf 23',           // Quality (lower = better, 18-28 is good)
        '-c:a aac',          // AAC audio codec
        '-b:a 128k',         // Audio bitrate
        '-movflags +faststart' // Enable streaming
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r  Progress: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('end', () => {
        console.log(`\n✓ Converted to ${path.basename(outputPath)}`);
        
        // Delete the original AVI file to save space
        try {
          fs.unlinkSync(inputPath);
          console.log(`  Deleted original AVI file to save space`);
        } catch (err) {
          console.log(`  Warning: Could not delete AVI file: ${err.message}`);
        }
        
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`\n✗ Conversion failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

/**
 * Get MP4 path for an AVI file (converts if needed)
 * @param {string} aviPath - Path to AVI file
 * @returns {Promise<string>} - Path to MP4 file
 */
async function getMp4Path(aviPath) {
  const mp4Path = aviPath.replace(/\.avi$/i, '.mp4');
  
  // Check if MP4 already exists and is newer than AVI
  if (fs.existsSync(mp4Path)) {
    const aviStat = fs.statSync(aviPath);
    const mp4Stat = fs.statSync(mp4Path);
    
    if (mp4Stat.mtime >= aviStat.mtime) {
      // MP4 is up to date
      return mp4Path;
    }
  }
  
  // Convert AVI to MP4
  await convertAviToMp4(aviPath, mp4Path);
  return mp4Path;
}

/**
 * Convert all AVI files in a directory
 * @param {string} dirPath - Directory path
 */
async function convertAllInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.avi'));
  
  console.log(`\nFound ${files.length} AVI files to convert`);
  
  let converted = 0;
  let skipped = 0;
  
  for (const file of files) {
    const aviPath = path.join(dirPath, file);
    const mp4Path = aviPath.replace(/\.avi$/i, '.mp4');
    
    if (fs.existsSync(mp4Path)) {
      const aviStat = fs.statSync(aviPath);
      const mp4Stat = fs.statSync(mp4Path);
      
      if (mp4Stat.mtime >= aviStat.mtime) {
        console.log(`Skipping ${file} (MP4 already exists)`);
        skipped++;
        continue;
      }
    }
    
    try {
      await convertAviToMp4(aviPath, mp4Path);
      converted++;
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err.message);
    }
  }
  
  console.log(`\n=== Conversion Complete ===`);
  console.log(`Converted: ${converted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${files.length}`);
}

module.exports = {
  convertAviToMp4,
  getMp4Path,
  convertAllInDirectory
};
