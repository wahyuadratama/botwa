const fs = require('fs');
const path = require('path');
const os = require('os');

class Helper {
  static loadFeatures() {
    const features = new Map();
    const featuresDir = path.join(__dirname, '../features');
    
    if (!fs.existsSync(featuresDir)) return features;
    
    const files = fs.readdirSync(featuresDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const FeatureClass = require(path.join(featuresDir, file));
          const feature = new FeatureClass();
          features.set(feature.name, feature);
        } catch (error) {
          console.error(`Failed to load ${file}:`, error.message);
        }
      }
    }
    return features;
  }

  static getSystemInfo() {
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      memory: {
        total: totalMem + ' GB',
        used: usedMem + ' GB',
        free: freeMem + ' GB'
      },
      cpu: os.cpus()[0].model
    };
  }

  static formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }
}

module.exports = Helper;