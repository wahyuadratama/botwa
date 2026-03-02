const { downloadMediaMessage } = require('@whiskeysockets/baileys');

class RvoFeature {
  constructor() {
    this.name = 'rvo';
    this.description = '_Ekstrak media view once (reply media)_';
    this.ownerOnly = true;
  }

  async execute(m, sock) {
    try {
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quotedMsg) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Reply ke media view once!' });
        return;
      }

      let mediaMsg = null;
      let mediaType = null;

      // Extract from viewOnceMessageV2
      if (quotedMsg.viewOnceMessageV2?.message) {
        const msg = quotedMsg.viewOnceMessageV2.message;
        if (msg.imageMessage) {
          mediaMsg = msg.imageMessage;
          mediaType = 'image';
        } else if (msg.videoMessage) {
          mediaMsg = msg.videoMessage;
          mediaType = 'video';
        }
      }

      // Extract from viewOnceMessage
      if (!mediaMsg && quotedMsg.viewOnceMessage?.message) {
        const msg = quotedMsg.viewOnceMessage.message;
        if (msg.imageMessage) {
          mediaMsg = msg.imageMessage;
          mediaType = 'image';
        } else if (msg.videoMessage) {
          mediaMsg = msg.videoMessage;
          mediaType = 'video';
        }
      }

      if (!mediaMsg) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Bukan media view once yang valid!' });
        return;
      }

      // Download media
      const buffer = await downloadMediaMessage(
        { message: quotedMsg.viewOnceMessageV2?.message || quotedMsg.viewOnceMessage?.message },
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      // Send based on type
      if (mediaType === 'image') {
        await sock.sendMessage(m.key.remoteJid, {
          image: buffer,
          caption: '✅ View once image extracted!'
        });
      } else if (mediaType === 'video') {
        await sock.sendMessage(m.key.remoteJid, {
          video: buffer,
          caption: '✅ View once video extracted!',
          gifPlayback: false
        });
      }

    } catch (error) {
      console.error('RVO Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal ekstrak: ${error.message}` });
    }
  }
}

module.exports = RvoFeature;
