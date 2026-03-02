class LoveCalcFeature {
  constructor() {
    this.name = 'lovecalc';
    this.description = 'Hitung persentase cinta';
    this.ownerOnly = false;
  }

  calculateLove(name1, name2) {
    // Simple algorithm based on names
    const combined = (name1 + name2).toLowerCase();
    let sum = 0;
    for (let i = 0; i < combined.length; i++) {
      sum += combined.charCodeAt(i);
    }
    return (sum % 101); // 0-100
  }

  getComment(percentage) {
    if (percentage >= 90) return '💕 Jodoh banget! Couple goals nih!';
    if (percentage >= 75) return '❤️ Cocok banget! Ada chemistry yang kuat!';
    if (percentage >= 60) return '💗 Lumayan cocok! Bisa dikembangkan nih!';
    if (percentage >= 40) return '💛 Biasa aja sih, tapi siapa tau bisa jalan!';
    if (percentage >= 20) return '💔 Kurang cocok, tapi cinta bisa tumbuh kok!';
    return '😅 Waduh, kayaknya beda banget ya...';
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const args = text.split('|').map(s => s.trim());

      if (args.length < 2) {
        await sock.sendMessage(m.key.remoteJid, {
          text: `💕 *LOVE CALCULATOR*\n\nFormat:\n.lovecalc [nama1] | [nama2]\n\nContoh:\n.lovecalc Wahyu | Shabrina`
        }, { quoted: m });
        return;
      }

      const name1 = args[0].replace('.lovecalc', '').trim();
      const name2 = args[1].trim();

      if (!name1 || !name2) {
        await sock.sendMessage(m.key.remoteJid, {
          text: '❌ Nama tidak boleh kosong!'
        }, { quoted: m });
        return;
      }

      const percentage = this.calculateLove(name1, name2);
      const comment = this.getComment(percentage);
      const hearts = '❤️'.repeat(Math.floor(percentage / 20));

      const result = `💕 *LOVE CALCULATOR* 💕\n\n👤 ${name1}\n💞\n👤 ${name2}\n\n${hearts}\n\n💯 Persentase Cinta: *${percentage}%*\n\n${comment}\n\n_Disclaimer: Ini hanya untuk hiburan ya! 😄_`;

      await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });

    } catch (error) {
      console.error('LoveCalc Error:', error);
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Gagal menghitung cinta!'
      }, { quoted: m });
    }
  }
}

module.exports = LoveCalcFeature;
