class VoteFeature {
  constructor() {
    this.name = 'vote';
    this.description = 'Vote dalam polling';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const chatId = m.key.remoteJid;
      const userId = m.key.participant || m.key.remoteJid;
      const userName = m.pushName || 'User';

      const Helper = require('../utils/helper');
      const features = Helper.loadFeatures();
      const pollFeature = features.get('poll');

      if (!pollFeature || !pollFeature.activePolls.has(chatId)) {
        await sock.sendMessage(chatId, {
          text: '❌ Tidak ada polling aktif di grup ini!'
        }, { quoted: m });
        return;
      }

      const voteNum = parseInt(text.split(' ')[1]);
      const poll = pollFeature.activePolls.get(chatId);

      if (!voteNum || !poll.votes[voteNum]) {
        await sock.sendMessage(chatId, {
          text: `❌ Nomor vote tidak valid!\n\nPilih 1-${Object.keys(poll.votes).length}`
        }, { quoted: m });
        return;
      }

      // Remove previous vote
      Object.keys(poll.votes).forEach(key => {
        poll.votes[key] = poll.votes[key].filter(v => v.id !== userId);
      });

      // Add new vote
      poll.votes[voteNum].push({ id: userId, name: userName });

      await sock.sendMessage(chatId, {
        text: `✅ Vote kamu tersimpan!\n\n${voteNum}️⃣ ${poll.options[voteNum - 1]}`
      }, { quoted: m });

    } catch (error) {
      console.error('Vote Error:', error);
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Gagal vote!'
      }, { quoted: m });
    }
  }
}

module.exports = VoteFeature;
