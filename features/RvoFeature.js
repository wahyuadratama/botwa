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

      console.log('[RVO] Quoted message keys:', Object.keys(quotedMsg));

      let mediaMsg = null;
      let mediaType = null;
      let messageToDownload = null;

      // Check viewOnceMessageV2
      if (quotedMsg.viewOnceMessageV2?.message) {
        console.log('[RVO] Found viewOnceMessageV2');
        const msg = quotedMsg.viewOnceMessageV2.message;
        console.log('[RVO] Message keys:', Object.keys(msg));
        
        if (msg.imageMessage) {
          mediaMsg = msg.imageMessage;
          mediaType = 'image';
          messageToDownload = quotedMsg.viewOnceMessageV2.message;
        } else if (msg.videoMessage) {
          mediaMsg = msg.videoMessage;
          mediaType = 'video';
          messageToDownload = quotedMsg.viewOnceMessageV2.message;
        }
      }

      // Check viewOnceMessage
      if (!mediaMsg && quotedMsg.viewOnceMessage?.message) {
        console.log('[RVO] Found viewOnceMessage');
        const msg = quotedMsg.viewOnceMessage.message;
        console.log('[RVO] Message keys:', Object.keys(msg));
        
        if (msg.imageMessage) {
          mediaMsg = msg.imageMessage;
          mediaType = 'image';
          messageToDownload = quotedMsg.viewOnceMessage.message;
        } else if (msg.videoMessage) {
          mediaMsg = msg.videoMessage;
          mediaType = 'video';
          messageToDownload = quotedMsg.viewOnceMessage.message;
        }
      }

      // Check direct imageMessage or videoMessage with viewOnce flag
      if (!mediaMsg) {
        console.log('[RVO] Checking direct media with viewOnce');
        if (quotedMsg.imageMessage?.viewOnce) {
          mediaMsg = quotedMsg.imageMessage;
          mediaType = 'image';
          messageToDownload = quotedMsg;
        } else if (quotedMsg.videoMessage?.viewOnce) {
          mediaMsg = quotedMsg.videoMessage;
          mediaType = 'video';
          messageToDownload = quotedMsg;
        }
      }

      if (!mediaMsg || !messageToDownload) {
        console.log('[RVO] No valid view once media found');
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Bukan media view once yang valid!' });
        return;
      }

      console.log('[RVO] Media type:', mediaType);

      // Download media
      const buffer = await downloadMediaMessage(
        { message: messageToDownload },
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      console.log('[RVO] Downloaded buffer size:', buffer.length);

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
      console.error('[RVO] Error:', error.message);
      console.error('[RVO] Stack:', error.stack);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal ekstrak: ${error.message}` });
    }
  }
}

module.exports = RvoFeature;
