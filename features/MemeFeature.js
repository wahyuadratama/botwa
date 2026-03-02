const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

class MemeFeature {
  constructor() {
    this.name = 'meme';
    this.description = 'Buat meme dari gambar';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMsg = quotedMsg?.imageMessage || m.message?.imageMessage;

      if (!imageMsg) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Reply ke gambar dengan:\n.meme teks atas|teks bawah\n\nContoh: .meme WHEN YOU|FORGET PASSWORD' });
        return;
      }

      const memeText = text.replace(/^\.meme\s*/i, '').trim();
      if (!memeText) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Format: .meme teks atas|teks bawah' });
        return;
      }

      const [topText = '', bottomText = ''] = memeText.split('|').map(t => t.trim().toUpperCase());

      const buffer = await downloadMediaMessage(
        quotedMsg ? { message: quotedMsg } : m,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const img = await loadImage(buffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);
      
      const fontSize = Math.floor(img.width / 12);
      ctx.font = `bold ${fontSize}px Impact`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = fontSize / 15;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      if (topText) {
        ctx.strokeText(topText, img.width / 2, 20);
        ctx.fillText(topText, img.width / 2, 20);
      }

      if (bottomText) {
        ctx.textBaseline = 'bottom';
        ctx.strokeText(bottomText, img.width / 2, img.height - 20);
        ctx.fillText(bottomText, img.width / 2, img.height - 20);
      }

      const memeBuffer = canvas.toBuffer('image/jpeg');
      await sock.sendMessage(m.key.remoteJid, { image: memeBuffer, caption: '🎭 Meme created!' });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${error.message}` });
    }
  }
}

module.exports = MemeFeature;
