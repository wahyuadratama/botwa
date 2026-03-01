const axios = require('axios');
const { Sticker } = require('wa-sticker-formatter');

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
      
      let stickerText = '';
      
      // Check if replying to a message
      if (quoted) {
        stickerText = quoted.conversation || quoted.extendedTextMessage?.text || '';
      } else {
        // Use text after command
        stickerText = text.replace(/^\.steks\s*/i, '').trim();
      }
      
      if (!stickerText) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '❌ Gunakan:\n\n1. .steks [teks]\n2. Reply chat dengan .steks\n\nContoh: .steks Halo Dunia!' 
        }, { quoted: m });
        return;
      }

      // Limit text length
      if (stickerText.length > 100) {
        stickerText = stickerText.substring(0, 100);
      }

      await sock.sendMessage(m.key.remoteJid, { 
        text: '⏳ Membuat sticker...' 
      }, { quoted: m });

      // Use API to generate image
      const apiUrl = `https://dummyimage.com/512x512/000/fff.png&text=${encodeURIComponent(stickerText)}`;
      
      const response = await axios.get(apiUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000 
      });

      // Convert to sticker with wa-sticker-formatter
      const sticker = new Sticker(response.data, {
        pack: 'BOTWA',
        author: 'Wahyu',
        type: 'full',
        quality: 50
      });

      const stickerBuffer = await sticker.toBuffer();

      // Send as sticker
      await sock.sendMessage(m.key.remoteJid, {
        sticker: stickerBuffer
      }, { quoted: m });

    } catch (error) {
      console.error('TextSticker Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { 
        text: '❌ Gagal membuat sticker! Coba lagi dengan teks lebih pendek.' 
      }, { quoted: m });
    }
  }
}

module.exports = TextStickerFeature;
