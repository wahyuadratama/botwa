const os = require('os');

class InfoFeature {
  constructor() {
    this.name = 'info';
    this.description = '_Info dan statistik bot_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const usedMem = (totalMem - freeMem).toFixed(2);
      
      const info = `*ℹ️ INFO BOT*

📊 *Statistik*
⏱️ Uptime: ${hours}j ${minutes}m ${seconds}d
💾 Memory: ${usedMem}GB / ${totalMem}GB
🖥️ Platform: ${os.platform()}
⚡ Node: ${process.version}

🤖 *Bot Info*
📱 Nama: BOTWA WAHYUDRTMA
👨‍💻 Developer: WahyuAdratama
🔧 Version: 1.0.0
📦 Features: 15+ fitur

_Ketik .help untuk lihat semua fitur_`;

      await sock.sendMessage(m.key.remoteJid, { text: info });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*INFO*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = InfoFeature;
