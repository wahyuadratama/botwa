const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

class ToImgFeature {
  constructor() {
    this.name = 'toimg';
    this.description = 'Convert sticker to image';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quoted || !quoted.stickerMessage) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '❌ Reply sticker dengan .toimg untuk convert ke gambar!' 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(m.key.remoteJid, { 
        text: '⏳ Converting sticker to image...' 
      }, { quoted: m });

      const buffer = await downloadMediaMessage(
        { message: { stickerMessage: quoted.stickerMessage }, key: m.key },
        'buffer',
        {}
      );

      const fileName = `${Date.now()}.png`;
      const filePath = path.join('./temp', fileName);
      
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }

      fs.writeFileSync(filePath, buffer);

      await sock.sendMessage(m.key.remoteJid, {
        image: fs.readFileSync(filePath),
        caption: '✅ Sticker berhasil diconvert ke gambar!'
      }, { quoted: m });

      fs.unlinkSync(filePath);

    } catch (error) {
      console.error('ToImg Error:', error);
      await sock.sendMessage(m.key.remoteJid, { 
        text: '❌ Gagal convert sticker! Pastikan reply sticker yang valid.' 
      }, { quoted: m });
    }
  }
}

module.exports = ToImgFeature;
