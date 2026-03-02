class PollFeature {
  constructor() {
    this.name = 'poll';
    this.description = 'Buat polling di grup';
    this.ownerOnly = false;
    this.activePolls = new Map();
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const chatId = m.key.remoteJid;

      // Check if group
      if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
          text: '❌ Polling hanya bisa digunakan di grup!'
        }, { quoted: m });
        return;
      }

      // .poll [pertanyaan] | [opsi1] | [opsi2] | ...
      const args = text.slice(6).trim();
      
      if (!args) {
        await sock.sendMessage(chatId, {
          text: `📊 *POLLING*\n\nFormat:\n.poll [pertanyaan] | [opsi1] | [opsi2] | [opsi3]\n\nContoh:\n.poll Makan dimana? | Warteg | Resto | Cafe\n\nMax 5 opsi`
        }, { quoted: m });
        return;
      }

      const parts = args.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        await sock.sendMessage(chatId, {
          text: '❌ Minimal 1 pertanyaan dan 2 opsi!\n\nContoh:\n.poll Setuju? | Ya | Tidak'
        }, { quoted: m });
        return;
      }

      const question = parts[0];
      const options = parts.slice(1, 6); // Max 5 options

      if (options.length > 5) {
        await sock.sendMessage(chatId, {
          text: '❌ Maksimal 5 opsi!'
        }, { quoted: m });
        return;
      }

      // Create poll
      const pollId = Date.now();
      const poll = {
        id: pollId,
        question: question,
        options: options,
        votes: {},
        creator: m.key.participant || m.key.remoteJid,
        createdAt: new Date().toLocaleString('id-ID')
      };

      options.forEach((opt, i) => {
        poll.votes[i + 1] = [];
      });

      this.activePolls.set(chatId, poll);

      let pollText = `📊 *POLLING*\n\n❓ ${question}\n\n`;
      options.forEach((opt, i) => {
        pollText += `${i + 1}️⃣ ${opt}\n`;
      });
      pollText += `\n_Vote dengan: .vote [nomor]_\n_Hasil: .pollresult_`;

      await sock.sendMessage(chatId, { text: pollText }, { quoted: m });

    } catch (error) {
      console.error('Poll Error:', error);
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Gagal membuat polling!'
      }, { quoted: m });
    }
  }
}

module.exports = PollFeature;
