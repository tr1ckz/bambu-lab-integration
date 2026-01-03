const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Connect to Bambu Lab printer via FTPS using curl
 * (FTP libraries have issues with Bambu's passive mode implementation)
 */
class BambuFtpService {
  constructor() {
    this.printerIp = null;
    this.accessCode = null;
  }

  /**
   * Set connection credentials and test connection
   * @param {string} printerIp - Printer IP address
   * @param {string} accessCode - Printer access code
   */
  async connect(printerIp, accessCode) {
    this.printerIp = printerIp;
    this.accessCode = accessCode;
    
    console.log(`Testing FTPS connection to ${printerIp}:990...`);
    
    try {
      // Test connection by listing directory
      await execAsync(
        `curl --user bblp:${accessCode} --ssl-reqd --insecure --list-only ftps://${printerIp}:990/timelapse/`,
        { timeout: 10000 }
      );
      
      console.log(`✓ Connected via FTPS (curl) to printer at ${printerIp}`);
      return true;
    } catch (error) {
      console.error(`FTPS connection failed:`, error.message);
      return false;
    }
  }

  /**
   * List all timelapse files from the printer
   * @returns {Promise<Array>} Array of timelapse file info
   */
  async listTimelapses() {
    if (!this.printerIp || !this.accessCode) {
      throw new Error('Not connected to printer. Call connect() first.');
    }

    try {
      console.log('Listing files in /timelapse directory...');
      console.log(`DEBUG: Using IP=${this.printerIp}, AccessCode=${this.accessCode.substring(0,2)}***${this.accessCode.substring(this.accessCode.length-2)}`);
      
      const { stdout } = await execAsync(
        `curl --user bblp:${this.accessCode} --ssl-reqd --insecure --list-only ftps://${this.printerIp}:990/timelapse/`,
        { timeout: 30000, maxBuffer: 10 * 1024 * 1024 } // 30 sec timeout, 10MB buffer for large listings
      );
      
      // Parse filenames from curl output (one per line)
      const files = stdout.trim().split('\n').filter(f => f.length > 0).map(f => f.trim());
      
      // Filter for video files and map to objects
      const timelapses = files
        .filter(file => 
          file.endsWith('.mp4') || file.endsWith('.avi') ||
          file.endsWith('.MP4') || file.endsWith('.AVI')
        )
        .map(name => ({
          name,
          path: `/timelapse/${name}`
        }));
      
      console.log(`Found ${timelapses.length} timelapse video(s):`, timelapses.map(t => t.name));
      return timelapses;
    } catch (error) {
      console.error('Failed to list timelapses:', error.message);
      return [];
    }
  }

  /**
   * Download a timelapse file from the printer
   * @param {string} remotePath - Remote file path on printer (e.g., /timelapse/video.mp4)
   * @param {string} localPath - Local file path to save to
   * @returns {Promise<boolean>} Success status
   */
  async downloadTimelapse(remotePath, localPath) {
    if (!this.printerIp || !this.accessCode) {
      throw new Error('Not connected to printer. Call connect() first.');
    }

    try {
      console.log(`Downloading ${remotePath} to ${localPath}...`);
      
      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download using curl with output to file
      await execAsync(
        `curl --user bblp:${this.accessCode} --ssl-reqd --insecure --silent --output "${localPath}" ftps://${this.printerIp}:990${remotePath}`,
        { timeout: 120000, maxBuffer: 100 * 1024 * 1024 } // 2min timeout, 100MB buffer for large videos
      );
      
      // Verify file was created
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
        console.log(`✓ Downloaded ${remotePath} (${(fs.statSync(localPath).size / 1024 / 1024).toFixed(2)} MB)`);
        return true;
      } else {
        console.error(`Download failed: ${localPath} is empty or missing`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to download ${remotePath}:`, error.message);
      return false;
    }
  }

  /**
   * Download all timelapses from the printer
   * @param {string} localDir - Local directory to save timelapses
   * @param {boolean} deleteAfterDownload - Delete files from printer after download
   * @returns {Promise<Array>} Array of downloaded file info
   */
  async downloadAllTimelapses(localDir, deleteAfterDownload = false) {
    try {
      const timelapses = await this.listTimelapses();
      const downloaded = [];

      for (const timelapse of timelapses) {
        const localPath = path.join(localDir, timelapse.name);
        
        // Skip if already exists (check both AVI and MP4)
        const baseName = timelapse.name.replace(/\.(avi|mp4)$/i, '');
        const aviPath = path.join(localDir, baseName + '.avi');
        const mp4Path = path.join(localDir, baseName + '.mp4');
        
        if (fs.existsSync(aviPath) || fs.existsSync(mp4Path)) {
          console.log(`Skipping ${timelapse.name} (already exists as AVI or MP4)`);
          downloaded.push({
            filename: timelapse.name,
            path: fs.existsSync(mp4Path) ? mp4Path : aviPath,
            skipped: true
          });
          continue;
        }

        const success = await this.downloadTimelapse(timelapse.path, localPath);
        if (success) {
          downloaded.push({
            filename: timelapse.name,
            path: localPath,
            size: fs.statSync(localPath).size
          });
          
          // Delete from printer if requested
          if (deleteAfterDownload) {
            try {
              await this.deleteTimelapse(timelapse.path);
              console.log(`✓ Deleted ${timelapse.name} from printer`);
            } catch (err) {
              console.log(`Failed to delete ${timelapse.name} from printer:`, err.message);
            }
          }
        }
      }

      console.log(`Downloaded ${downloaded.filter(d => !d.skipped).length} new timelapses from printer`);
      return downloaded;
    } catch (error) {
      console.error('Failed to download timelapses:', error.message);
      return [];
    }
  }

  /**
   * Delete a timelapse file from the printer
   * @param {string} remotePath - Remote file path on printer (e.g., /timelapse/video.mp4)
   * @returns {Promise<boolean>} Success status
   */
  async deleteTimelapse(remotePath) {
    if (!this.printerIp || !this.accessCode) {
      throw new Error('Not connected to printer. Call connect() first.');
    }

    try {
      console.log(`Deleting ${remotePath} from printer...`);
      
      // Use curl with -Q DELE command to delete file
      await execAsync(
        `curl --user bblp:${this.accessCode} --ssl-reqd --insecure --silent -Q "DELE ${remotePath}" ftps://${this.printerIp}:990/`,
        { timeout: 10000 }
      );
      
      console.log(`✓ Deleted ${remotePath} from printer`);
      return true;
    } catch (error) {
      console.error(`Failed to delete ${remotePath}:`, error.message);
      return false;
    }
  }

  /**
   * Disconnect (no-op for curl-based implementation)
   */
  async disconnect() {
    console.log('Disconnected from printer');
    this.printerIp = null;
    this.accessCode = null;
  }

  /**
   * List all 3MF files from the printer
   * @returns {Promise<Array>} Array of 3MF file info
   */
  async list3mfFiles(directory = '/model') {
    if (!this.printerIp || !this.accessCode) {
      throw new Error('Not connected to printer. Call connect() first.');
    }

    try {
      console.log(`Listing files in ${directory} directory...`);
      
      const { stdout } = await execAsync(
        `curl --user bblp:${this.accessCode} --ssl-reqd --insecure --list-only ftps://${this.printerIp}:990${directory}/`,
        { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      
      const files = stdout.trim().split('\n').filter(f => f.length > 0).map(f => f.trim());
      
      const models = files
        .filter(file => file.endsWith('.3mf') || file.endsWith('.3MF'))
        .map(name => ({
          name,
          path: `${directory}/${name}`
        }));
      
      console.log(`Found ${models.length} 3MF file(s)`);
      return models;
    } catch (error) {
      console.error('Failed to list 3MF files:', error.message);
      return [];
    }
  }

  /**
   * Download a 3MF file from the printer
   * @param {string} remotePath - Remote file path on printer
   * @param {string} localPath - Local file path to save to
   * @returns {Promise<boolean>} Success status
   */
  async download3mf(remotePath, localPath) {
    if (!this.printerIp || !this.accessCode) {
      throw new Error('Not connected to printer. Call connect() first.');
    }

    try {
      console.log(`Downloading ${remotePath} to ${localPath}...`);
      
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await execAsync(
        `curl --user bblp:${this.accessCode} --ssl-reqd --insecure --silent --output "${localPath}" ftps://${this.printerIp}:990${remotePath}`,
        { timeout: 120000, maxBuffer: 100 * 1024 * 1024 }
      );
      
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
        console.log(`✓ Downloaded ${remotePath} (${(fs.statSync(localPath).size / 1024 / 1024).toFixed(2)} MB)`);
        return true;
      } else {
        console.error(`Download failed: ${localPath} is empty or missing`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to download ${remotePath}:`, error.message);
      return false;
    }
  }

  /**
   * Download all 3MF files from the printer
   * @param {string} localDir - Local directory to save 3MF files
   * @returns {Promise<Array>} Array of downloaded file info
   */
  async downloadAll3mfFiles(localDir, directory = '/model') {
    try {
      const models = await this.list3mfFiles(directory);
      const downloaded = [];

      for (const model of models) {
        const localPath = path.join(localDir, model.name);
        
        // Skip if already exists
        if (fs.existsSync(localPath)) {
          console.log(`Skipping ${model.name} (already exists)`);
          downloaded.push({
            filename: model.name,
            path: localPath,
            skipped: true
          });
          continue;
        }

        const success = await this.download3mf(model.path, localPath);
        if (success) {
          downloaded.push({
            filename: model.name,
            path: localPath,
            skipped: false
          });
        }
      }

      return downloaded;
    } catch (error) {
      console.error('Failed to download 3MF files:', error);
      return [];
    }
  }
}

module.exports = new BambuFtpService();
