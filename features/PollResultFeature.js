class PollResultFeature {
  constructor() {
    this.name = 'pollresult';
    this.description = 'Lihat hasil polling';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const chatId = m.key.remoteJid;

      const Helper = require('../utils/helper');
      const features = Helper.loadFeatures();
      const pollFeature = features.get('poll');

      if (!pollFeature || !pollFeature.activePolls.has(chatId)) {
        await sock.sendMessage(chatId, {
          text: '❌ Tidak ada polling aktif di grup ini!'
        }, { quoted: m });
        return;
      }

      const poll = pollFeature.activePolls.get(chatId);
      let totalVotes = 0;
      Object.values(poll.votes).forEach(voters => {
        totalVotes += voters.length;
      });

      let resultText = `📊 *HASIL POLLING*\n\n❓ ${poll.question}\n\n`;

      poll.options.forEach((opt, i) => {
        const voters = poll.votes[i + 1];
        const count = voters.length;
        const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
        const bar = '█'.repeat(Math.floor(percentage / 10));
        
        resultText += `${i + 1}️⃣ ${opt}\n`;
        resultText += `${bar} ${percentage}% (${count} vote)\n\n`;
      });

      resultText += `👥 Total: ${totalVotes} vote\n⏰ ${poll.createdAt}`;

      await sock.sendMessage(chatId, { text: resultText }, { quoted: m });

    } catch (error) {
      console.error('PollResult Error:', error);
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Gagal menampilkan hasil!'
      }, { quoted: m });
    }
  }
}

module.exports = PollResultFeature;
