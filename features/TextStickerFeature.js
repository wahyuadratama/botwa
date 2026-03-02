const { createCanvas } = require('canvas');
const sharp = require('sharp');

class TextStickerFeature {
  constructor() {
    this.name = 'steks';
    this.description = 'Buat sticker dari teks';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
      
      let stickerText = quoted ? (quoted.conversation || quoted.extendedTextMessage?.text || '') : text.replace(/^\.steks\s*/i, '').trim();
      
      if (!stickerText) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Gunakan: .steks [teks] atau reply chat dengan .steks' });
        return;
      }

      if (stickerText.length > 100) stickerText = stickerText.substring(0, 100);

      // Create canvas locally (faster than API)
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = stickerText.split(' ');
      const lines = [];
      let line = '';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 480 && line) {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const lineHeight = 50;
      const startY = 256 - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, i) => {
        ctx.fillText(line.trim(), 256, startY + i * lineHeight);
      });

      const buffer = canvas.toBuffer('image/png');
      const webp = await sharp(buffer).webp({ quality: 80 }).toBuffer();

      await sock.sendMessage(m.key.remoteJid, { sticker: webp });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal membuat sticker!' });
    }
  }
}

module.exports = TextStickerFeature;
