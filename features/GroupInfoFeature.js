class GroupInfoFeature {
  constructor() {
    this.name = 'groupinfo';
    this.description = '_Lihat info grup (untuk whitelist)_';
    this.ownerOnly = true;
  }

  async execute(m, sock) {
    try {
      const chatId = m.key.remoteJid;
      
      // Check if it's a group
      if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
          text: '❌ Command ini hanya bisa digunakan di grup!' 
        });
        return;
      }

      // Get group metadata
      const groupMetadata = await sock.groupMetadata(chatId);
      
      const info = `*INFO GRUP* 📋

📌 Nama: ${groupMetadata.subject}
🆔 ID: ${chatId}
👥 Anggota: ${groupMetadata.participants.length}
📝 Deskripsi: ${groupMetadata.desc || 'Tidak ada'}

💡 Copy ID di atas untuk whitelist grup!`;

      await sock.sendMessage(chatId, { text: info });

    } catch (error) {
      console.error('[GROUPINFO] Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { 
        text: `❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = GroupInfoFeature;
