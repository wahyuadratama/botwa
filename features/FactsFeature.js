class FactsFeature {
  constructor() {
    this.name = 'facts';
    this.description = '_Fakta menarik random_';
    this.ownerOnly = false;
    this.facts = [
      "🍯 Madu tidak akan pernah basi. Madu yang ditemukan di makam Mesir kuno berusia 3000 tahun masih bisa dimakan!",
      "🐙 Gurita memiliki 3 jantung dan darah berwarna biru karena mengandung tembaga.",
      "🍌 Pisang secara teknis adalah buah berry, tapi stroberi bukan berry!",
      "🦈 Hiu sudah ada lebih lama dari pohon. Hiu ada sejak 400 juta tahun lalu, pohon baru 350 juta tahun.",
      "🦒 Jerapah hanya tidur 30 menit hingga 2 jam per hari dan bisa tidur sambil berdiri!",
      "🧠 Otak manusia menggunakan sekitar 20% dari total energi tubuh meskipun hanya 2% dari berat badan.",
      "🦩 Flamingo berwarna pink karena makanan mereka mengandung karotenoid (udang dan alga).",
      "🐨 Koala memiliki sidik jari yang sangat mirip dengan manusia, bahkan bisa mengecoh forensik!",
      "🐝 Lebah dapat mengenali wajah manusia dan mengingat siapa yang baik kepada mereka.",
      "🐬 Lumba-lumba memiliki nama untuk diri mereka sendiri dan memanggil satu sama lain dengan nama tersebut.",
      "⚡ Petir 5 kali lebih panas dari permukaan matahari (30.000°C vs 6.000°C)!",
      "🌍 Bumi berputar dengan kecepatan 1.670 km/jam di khatulistiwa, tapi kita tidak merasakannya!",
      "🐜 Semut dapat mengangkat beban 50 kali berat tubuhnya sendiri.",
      "🦅 Burung unta memiliki mata yang lebih besar dari otaknya!",
      "🌊 Air laut mengandung emas, sekitar 20 juta ton emas terlarut di lautan dunia.",
      "🐢 Kura-kura dapat bernapas melalui pantatnya! Ini disebut respirasi kloaka.",
      "🌕 Bulan menjauh dari Bumi sekitar 3,8 cm setiap tahunnya.",
      "🦆 Bebek tidak bisa berjalan mundur karena struktur kakinya.",
      "🐻 Beruang kutub sebenarnya memiliki kulit hitam di bawah bulu putihnya.",
      "🌋 Ombak terbesar yang pernah tercatat setinggi 524 meter di Alaska tahun 1958!",
      "🐛 Kupu-kupu dapat merasakan rasa dengan kakinya.",
      "🦇 Batman (kelelawar) adalah satu-satunya mamalia yang bisa terbang.",
      "🌻 Bunga matahari dapat membantu membersihkan tanah dari radiasi nuklir.",
      "🐠 Ikan mas memiliki memori hingga 3 bulan, bukan 3 detik seperti mitos!",
      "❄️ Tidak ada dua kepingan salju yang identik di dunia ini.",
      "🍎 Apel mengapung di air karena 25% dari volumenya adalah udara.",
      "🐘 Gajah adalah satu-satunya mamalia yang tidak bisa melompat.",
      "🌌 Lautan kita baru dieksplorasi sekitar 5%, sisanya masih misteri!",
      "🐼 Panda menghabiskan 12-16 jam sehari hanya untuk makan bambu.",
      "⭐ Cahaya dari bintang yang kita lihat malam ini mungkin sudah tidak ada lagi, karena cahayanya butuh jutaan tahun sampai ke Bumi."
    ];
  }

  async execute(m, sock) {
    try {
      const randomFact = this.facts[Math.floor(Math.random() * this.facts.length)];
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*FAKTA MENARIK* 🤓\n\n${randomFact}\n\n> Ketik .facts lagi untuk fakta lainnya!` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*FAKTA MENARIK*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = FactsFeature;
