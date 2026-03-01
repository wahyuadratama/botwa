class PingFeature {
  constructor() {
    this.name = 'ping';
    this.description = '_Cek ping bot_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const start = Date.now();
      await sock.sendMessage(m.key.remoteJid, { text: 'Pong! 🏓' });
      const ping = Date.now() - start;
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*PING* 🏓\n\n> Response Time: ${ping}ms` 
      });
    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*PING*\n\n> Error: ${error.message}` 
      });
    }
  }
}

module.exports = PingFeature;
