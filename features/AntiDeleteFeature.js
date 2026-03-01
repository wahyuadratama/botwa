class AntiDeleteFeature {
  constructor() {
    this.name = 'antidelete';
    this.description = '_Lihat pesan yang dihapus_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const fs = require('fs');
      const chatId = m.key.remoteJid;
      
      // Load from store
      let deletedMessages = [];
      if (fs.existsSync('./baileys_store.json')) {
        const data = JSON.parse(fs.readFileSync('./baileys_store.json', 'utf-8'));
        deletedMessages = data.deletedMessages || [];
      }
      
      const deletedInThisChat = deletedMessages.filter(msg => msg.chatId === chatId);

      if (deletedInThisChat.length === 0) {
        await sock.sendMessage(chatId, { 
          text: '*🗑️ ANTI DELETE*\n\n❌ Belum ada pesan yang dihapus di chat ini.' 
        });
        return;
      }

      // Show list first
      let text = '*🗑️ PESAN YANG DIHAPUS*\n\n';
      deletedInThisChat.slice(0, 10).forEach((msg, i) => {
        const mediaType = msg.mediaType ? ` [${msg.mediaType}]` : '';
        text += `${i + 1}. 👤 ${msg.senderName}${mediaType}\n`;
        text += `   💬 ${msg.text}\n`;
        text += `   ⏰ ${msg.time}\n\n`;
      });

      text += `_Total: ${deletedInThisChat.length} pesan dihapus_\n\n`;
      text += `💡 Media (gambar/video) akan dikirim otomatis jika tersimpan!`;

      await sock.sendMessage(chatId, { text });

      // Send media if available
      for (const msg of deletedInThisChat.slice(0, 5)) {
        if (msg.mediaPath && fs.existsSync(msg.mediaPath)) {
          const caption = `*🚨 MEDIA DIHAPUS*\n\n👤 ${msg.senderName}\n⏰ ${msg.time}`;
          
          if (msg.mediaType === 'image') {
            await sock.sendMessage(chatId, {
              image: fs.readFileSync(msg.mediaPath),
              caption: caption
            });
          } else if (msg.mediaType === 'video') {
            await sock.sendMessage(chatId, {
              video: fs.readFileSync(msg.mediaPath),
              caption: caption
            });
          } else if (msg.mediaType === 'sticker') {
            await sock.sendMessage(chatId, {
              sticker: fs.readFileSync(msg.mediaPath)
            });
          }
          
          // Small delay between media
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('[AD] Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*ANTI DELETE*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = AntiDeleteFeature;
