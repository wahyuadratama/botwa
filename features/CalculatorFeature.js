class CalculatorFeature {
  constructor() {
    this.name = 'calc';
    this.description = '_Kalkulator sederhana_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      const expression = messageText.replace(/^\.calc\s*/i, '').trim();

      if (!expression) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*CALCULATOR* 🔢\n\n❌ Format: .calc [operasi]\nContoh: .calc 2 + 3' 
        });
        return;
      }

      const result = eval(expression);
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*CALCULATOR* 🔢\n\n> Operasi: ${expression}\n> Hasil: ${result}` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*CALCULATOR*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = CalculatorFeature;
