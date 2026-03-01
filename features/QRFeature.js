class QRFeature {
  constructor() {
    this.name = 'qr';
    this.description = '_Generate QR code_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      const text = messageText.replace(/^\.qr\s*/i, '').trim();

      if (!text) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*QR CODE GENERATOR* 📱\n\n❌ Format: .qr [teks]\nContoh: .qr Hello World' 
        });
        return;
      }

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
      
      await sock.sendMessage(m.key.remoteJid, {
        image: { url: qrUrl },
        caption: `*QR CODE GENERATOR* 📱\n\n✅ QR Code untuk:\n${text}`
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*QR CODE GENERATOR*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = QRFeature;
