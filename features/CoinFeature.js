class CoinFeature {
  constructor() {
    this.name = 'coin';
    this.description = '_Lempar koin (kepala/ekor)_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const result = Math.random() < 0.5 ? 'Kepala' : 'Ekor';
      const emoji = result === 'Kepala' ? '🪙' : '💿';
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*COIN FLIP* 🪙\n\n${emoji}\n\n> Hasil: ${result}` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*COIN FLIP*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = CoinFeature;
