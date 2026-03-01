class QuotesFeature {
  constructor() {
    this.name = 'quotes';
    this.description = '_Quote motivasi random_';
    this.ownerOnly = false;
    this.quotes = [
      "✨ Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan. - Colin Powell",
      "🚀 Jangan menunggu kesempatan, ciptakan kesempatan itu sendiri. - George Bernard Shaw",
      "🎯 Mimpi besar dimulai dari langkah kecil yang konsisten. - Lao Tzu",
      "💪 Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas. - Henry Ford",
      "❤️ Percaya pada diri sendiri adalah langkah pertama menuju kesuksesan. - Ralph Waldo Emerson",
      "⏰ Waktu tidak akan pernah tepat, mulai sekarang adalah waktu yang tepat. - Napoleon Hill",
      "🌟 Kesulitan adalah kesempatan untuk menunjukkan kemampuan terbaik kita. - Duke Ellington",
      "🔥 Jangan takut gagal, takutlah tidak mencoba. - Michael Jordan",
      "🌅 Setiap hari adalah kesempatan baru untuk menjadi lebih baik. - Unknown",
      "🏆 Fokus pada progress, bukan perfection. - Unknown",
      "💡 Inovasi membedakan pemimpin dari pengikut. - Steve Jobs",
      "🌱 Cara terbaik memprediksi masa depan adalah menciptakannya. - Peter Drucker",
      "📚 Investasi terbaik adalah investasi pada diri sendiri. - Warren Buffett",
      "⚡ Kualitas bukan tindakan, tapi kebiasaan. - Aristotle",
      "🌈 Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya. - Charles R. Swindoll",
      "🔑 Kunci kesuksesan adalah fokus pada tujuan, bukan hambatan. - Unknown",
      "🎯 Jangan berhenti ketika lelah, berhentilah ketika selesai. - Unknown",
      "🚀 Satu-satunya batasan adalah yang kamu tetapkan sendiri. - Unknown",
      "🌟 Kesuksesan bukan kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan. - Albert Schweitzer",
      "💪 Kamu tidak harus hebat untuk memulai, tapi kamu harus memulai untuk menjadi hebat. - Zig Ziglar",
      "✨ Masa depan milik mereka yang percaya pada keindahan mimpi mereka. - Eleanor Roosevelt",
      "🏆 Pemenang tidak pernah berhenti, yang berhenti tidak pernah menang. - Vince Lombardi",
      "🔥 Jika kamu bisa bermimpi, kamu bisa mewujudkannya. - Walt Disney",
      "🌱 Perubahan adalah hasil akhir dari pembelajaran sejati. - Leo Buscaglia",
      "💡 Kreativitas adalah kecerdasan yang bersenang-senang. - Albert Einstein",
      "⚡ Kesempatan tidak datang, kamu yang menciptakannya. - Chris Grosser",
      "🌅 Hari ini adalah kesempatan sempurna untuk menjadi versi terbaik dirimu. - Unknown",
      "🚀 Jangan batasi tantanganmu, tantang batasanmu. - Unknown",
      "🎯 Sukses adalah jumlah dari usaha kecil yang diulang setiap hari. - Robert Collier",
      "💪 Yang membedakan pemenang dan pecundang adalah bagaimana mereka menangani kekalahan. - Unknown"
    ];
  }

  async execute(m, sock) {
    try {
      const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*QUOTES* 💭\n\n"${randomQuote}"\n\n> Ketik .quotes lagi untuk quote lainnya!` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*QUOTES*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = QuotesFeature;
