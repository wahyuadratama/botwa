class TranslateFeature {
  constructor() {
    this.name = 'translate';
    this.description = '_Translate teks (format: .translate [teks])_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      const text = messageText.replace(/^\.translate\s*/i, '').trim();

      if (!text) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*🌐 TRANSLATE*\n\n❌ Format: .translate [teks]\n\nContoh:\n.translate Hello world\n.translate Selamat pagi' 
        });
        return;
      }

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const translated = data[0].map(item => item[0]).join('');
      const sourceLang = data[2] || 'auto';

      await sock.sendMessage(m.key.remoteJid, { 
        text: `*🌐 TRANSLATE*\n\n📝 Original (${sourceLang}):\n${text}\n\n✅ Terjemahan (id):\n${translated}` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*TRANSLATE*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = TranslateFeature;
