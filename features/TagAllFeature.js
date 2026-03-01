class TagAllFeature {
  constructor() {
    this.name = 'tagall';
    this.description = '_Tag semua anggota grup_';
    this.ownerOnly = false;
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
      const participants = groupMetadata.participants;
      
      // Get message text for announcement
      const msgText = m.message.conversation || 
                      m.message.extendedTextMessage?.text || '';
      const announcement = msgText.replace(/^\.tagall\s*/i, '').trim() || 'Halo semua! 👋';
      
      // Create mention text
      let mentionText = `*TAG ALL* 📢\n\n${announcement}\n\n`;
      const mentions = [];
      
      participants.forEach((participant, index) => {
        const number = participant.id.split('@')[0];
        mentionText += `${index + 1}. @${number}\n`;
        mentions.push(participant.id);
      });
      
      mentionText += `\n_Total: ${participants.length} anggota_`;
      
      // Send message with mentions
      await sock.sendMessage(chatId, {
        text: mentionText,
        mentions: mentions
      });

    } catch (error) {
      console.error('[TAGALL] Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { 
        text: `❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = TagAllFeature;
