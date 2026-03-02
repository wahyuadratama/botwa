const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

class StickerFeature {
  constructor() {
    this.name = 'sticker';
    this.description = '_Convert gambar/video ke sticker (reply media)_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMsg = quotedMsg?.imageMessage || m.message?.imageMessage;
      const videoMsg = quotedMsg?.videoMessage || m.message?.videoMessage;

      if (!imageMsg && !videoMsg) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Reply ke gambar atau video!' });
        return;
      }

      const buffer = await downloadMediaMessage(
        quotedMsg ? { message: quotedMsg } : m,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      // Optimize with sharp - resize to 512x512 webp
      const optimized = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toBuffer();

      await sock.sendMessage(m.key.remoteJid, { sticker: optimized });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${error.message}` });
    }
  }
}

module.exports = StickerFeature;
