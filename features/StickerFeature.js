const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

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
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*STICKER MAKER*\n\n❌ Reply ke gambar atau video!' 
        });
        return;
      }

      await sock.sendMessage(m.key.remoteJid, { 
        text: '*STICKER MAKER*\n\n⏳ Membuat sticker...' 
      });

      const buffer = await downloadMediaMessage(
        quotedMsg ? { message: quotedMsg } : m,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      await sock.sendMessage(m.key.remoteJid, {
        sticker: buffer
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*STICKER MAKER*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = StickerFeature;
