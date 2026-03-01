class DiceFeature {
  constructor() {
    this.name = 'dice';
    this.description = '_Lempar dadu 1-6_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const result = Math.floor(Math.random() * 6) + 1;
      const emoji = diceEmojis[result - 1];
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*DICE ROLL* 🎲\n\n${emoji}\n\n> Hasil: ${result}` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*DICE ROLL*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = DiceFeature;
