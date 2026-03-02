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
      "💪 Yang membedakan pemenang dan pecundang adalah bagaimana mereka menangani kekalahan. - Unknown",
      "🌟 Hidup dimulai di ujung zona nyamanmu. - Neale Donald Walsch",
      "🔥 Jangan tanya apa yang dunia butuhkan. Tanya apa yang membuatmu hidup, lalu lakukanlah. - Howard Thurman",
      "💎 Tekanan membuat berlian. - Thomas Carlyle",
      "🎯 Tindakan adalah kunci dasar untuk semua kesuksesan. - Pablo Picasso",
      "🚀 Hal terbaik untuk memulai adalah berhenti bicara dan mulai melakukan. - Walt Disney",
      "⭐ Jangan menunggu momen sempurna, ambil momen dan buat itu sempurna. - Unknown",
      "💪 Kekuatan tidak datang dari kemenangan. Perjuanganmu mengembangkan kekuatanmu. - Arnold Schwarzenegger",
      "🌈 Setelah badai, selalu ada pelangi. - Unknown",
      "🔑 Rahasia untuk maju adalah memulai. - Mark Twain",
      "🎯 Fokus pada apa yang bisa kamu kontrol. - Epictetus",
      "✨ Bintang tidak bisa bersinar tanpa kegelapan. - Unknown",
      "🏆 Juara adalah seseorang yang bangkit ketika dia tidak bisa. - Jack Dempsey",
      "💡 Pikiran adalah segalanya. Apa yang kamu pikirkan, kamu menjadi itu. - Buddha",
      "🌟 Jangan biarkan kemarin menghabiskan terlalu banyak hari ini. - Will Rogers",
      "🔥 Passion adalah energi. Rasakan kekuatan yang datang dari fokus pada apa yang membuatmu bersemangat. - Oprah Winfrey",
      "🚀 Masa depan tergantung pada apa yang kamu lakukan hari ini. - Mahatma Gandhi",
      "💪 Kamu lebih kuat dari yang kamu pikirkan. - Unknown",
      "🌱 Setiap ahli pernah menjadi pemula. - Robin Sharma",
      "⚡ Energi dan ketekunan menaklukkan segalanya. - Benjamin Franklin",
      "🎯 Tujuan tanpa rencana hanyalah keinginan. - Antoine de Saint-Exupéry",
      "🌟 Percayalah pada dirimu sendiri dan semua yang kamu miliki. - Christian D. Larson",
      "🔥 Jangan menunggu inspirasi. Jadilah inspirasi. - Unknown",
      "💎 Kesulitan mempersiapkan orang biasa untuk takdir luar biasa. - C.S. Lewis",
      "🏆 Sukses adalah perjalanan, bukan tujuan. - Ben Sweetland",
      "✨ Kamu tidak pernah terlalu tua untuk menetapkan tujuan baru atau bermimpi impian baru. - C.S. Lewis",
      "🚀 Lakukan apa yang kamu bisa, dengan apa yang kamu punya, di mana kamu berada. - Theodore Roosevelt",
      "💪 Kegagalan adalah bumbu yang memberi rasa pada kesuksesan. - Truman Capote",
      "🌈 Kehidupan adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu bereaksi terhadapnya. - Lou Holtz",
      "🔑 Kunci kesuksesan adalah memulai sebelum kamu siap. - Marie Forleo",
      "🎯 Jangan hitung hari, buat hari berarti. - Muhammad Ali"
    ];
  }

  async execute(m, sock) {
    try {
      const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
      await sock.sendMessage(m.key.remoteJid, { text: `💭 *QUOTE HARI INI*\n\n${randomQuote}` });
    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal mengambil quote!' });
    }
  }
}

module.exports = QuotesFeature;
