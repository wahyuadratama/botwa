const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

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
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*RVO EXTRACTOR*\n\n❌ Reply ke media view once!' 
        });
        return;
      }

      await sock.sendMessage(m.key.remoteJid, { 
        text: '*RVO EXTRACTOR*\n\n⏳ Mengekstrak media...' 
      });

      // Try multiple approaches to extract view once
      let buffer = null;
      let mediaType = null;

      // Approach 1: viewOnceMessageV2
      if (quotedMsg.viewOnceMessageV2?.message) {
        const msg = quotedMsg.viewOnceMessageV2.message;
        if (msg.imageMessage) {
          buffer = await downloadMediaMessage(
            { message: msg },
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          mediaType = 'image';
        } else if (msg.videoMessage) {
          buffer = await downloadMediaMessage(
            { message: msg },
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          mediaType = 'video';
        }
      }

      // Approach 2: viewOnceMessage
      if (!buffer && quotedMsg.viewOnceMessage?.message) {
        const msg = quotedMsg.viewOnceMessage.message;
        if (msg.imageMessage) {
          buffer = await downloadMediaMessage(
            { message: msg },
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          mediaType = 'image';
        } else if (msg.videoMessage) {
          buffer = await downloadMediaMessage(
            { message: msg },
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          mediaType = 'video';
        }
      }

      // Approach 3: Direct download from quoted message
      if (!buffer) {
        const contextInfo = m.message.extendedTextMessage.contextInfo;
        const participant = contextInfo.participant || m.key.remoteJid;
        const quotedMsgObj = {
          key: {
            remoteJid: m.key.remoteJid,
            fromMe: false,
            id: contextInfo.stanzaId,
            participant: participant
          },
          message: quotedMsg
        };

        try {
          buffer = await downloadMediaMessage(
            quotedMsgObj,
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          
          // Detect media type from quoted message
          if (quotedMsg.viewOnceMessageV2?.message?.imageMessage || quotedMsg.viewOnceMessage?.message?.imageMessage) {
            mediaType = 'image';
          } else if (quotedMsg.viewOnceMessageV2?.message?.videoMessage || quotedMsg.viewOnceMessage?.message?.videoMessage) {
            mediaType = 'video';
          }
        } catch (e) {
          console.log('Approach 3 failed:', e.message);
        }
      }

      if (!buffer) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*RVO EXTRACTOR*\n\n❌ Gagal mengekstrak media!\n\nPastikan ini adalah media view once yang valid.' 
        });
        return;
      }

      // Send extracted media
      if (mediaType === 'image') {
        await sock.sendMessage(m.key.remoteJid, {
          image: buffer,
          caption: '*RVO EXTRACTOR*\n\n✅ Berhasil ekstrak gambar view once!'
        });
      } else if (mediaType === 'video') {
        await sock.sendMessage(m.key.remoteJid, {
          video: buffer,
          caption: '*RVO EXTRACTOR*\n\n✅ Berhasil ekstrak video view once!'
        });
      } else {
        // If type unknown, try as image first
        try {
          await sock.sendMessage(m.key.remoteJid, {
            image: buffer,
            caption: '*RVO EXTRACTOR*\n\n✅ Berhasil ekstrak media view once!'
          });
        } catch {
          await sock.sendMessage(m.key.remoteJid, {
            video: buffer,
            caption: '*RVO EXTRACTOR*\n\n✅ Berhasil ekstrak media view once!'
          });
        }
      }

    } catch (error) {
      console.error('RVO Error:', error);
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*RVO EXTRACTOR*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = RvoFeature;
