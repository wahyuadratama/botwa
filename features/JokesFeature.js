class JokesFeature {
  constructor() {
    this.name = 'jokes';
    this.description = '_Lelucon random_';
    this.ownerOnly = false;
    this.jokes = [
      "Kenapa programmer selalu bingung di supermarket? Karena tidak ada function 'cari barang'! 😂",
      "Apa bedanya kucing dan kucring? Kalau kucing kakinya empat, kalau kucring kakinya emping! 🤣",
      "Kenapa singa disebut raja hutan? Karena dia yang paling berani ngutang! 🦁",
      "Kenapa hantu tidak pernah bohong? Karena mereka transparan! 👻",
      "Kenapa Superman pakai baju ketat? Karena kalau pakai baju longgar nanti dikira Batman! 🦸",
      "Apa yang ada di tengah laut? Huruf 'a'! 🌊",
      "Kenapa cicak di dinding? Karena tidak bisa terbang! 🦎",
      "Apa yang hitam putih dan merah? Zebra pakai lipstik! 🦓💄",
      "Kenapa matahari terbit dari timur? Karena kalau dari barat namanya terbenam! ☀️",
      "Apa persamaan antara uang dan rahasia? Sama-sama susah dipegang! 💰",
      "Kenapa ayam menyeberang jalan? Karena di seberang ada KFC! 🐔",
      "Apa bedanya semut dengan orang kaya? Semut punya rumah di pohon, orang kaya punya pohon di rumah! 🐜",
      "Kenapa ikan tidak bisa main basket? Karena takut kena jaring! 🐟🏀",
      "Apa yang jatuh tapi tidak pernah sakit? Hujan! ☔",
      "Kenapa buku tulis tidak bisa jalan? Karena tidak punya kaki! 📚",
      "Apa yang punya kaki tapi tidak bisa jalan? Meja! 🪑",
      "Kenapa WiFi lemot? Karena lagi diet bandwidth! 📶",
      "Apa bedanya kamu dan Google? Google punya jawaban! 😎",
      "Kenapa programmer suka gelap? Karena takut bug kelihatan! 🐛💻",
      "Apa yang bulat, hijau, dan kalau dipencet keluar air? Timun! 🥒",
      "Kenapa ninja selalu menang? Karena musuhnya tidak pernah lihat! 🥷",
      "Apa bedanya kopi dan kamu? Kopi bikin melek, kamu bikin meleleh! ☕❤️",
      "Kenapa zombie suka jalan kaki? Karena tidak punya SIM! 🧟",
      "Apa yang lebih berat, 1kg kapas atau 1kg besi? Sama-sama berat, yang beda cuma hatimu! 😢",
      "Kenapa kucing suka tidur? Karena tidak ada kerjaan! 😺💤",
      "Apa bedanya kamu dan WiFi? WiFi ada sinyal, kamu tidak ada kabar! 📱",
      "Kenapa Batman tidak pernah selfie? Karena kameranya gelap! 🦇📸",
      "Apa yang lebih cepat dari cahaya? Gosip! 💬⚡",
      "Kenapa dinosaurus punah? Karena tidak ada yang ajarin coding! 🦕💻",
      "Apa bedanya kamu dan matahari? Matahari terbit setiap hari, kamu terbit kalau ada duit! 🌅💰"
    ];
  }

  async execute(m, sock) {
    try {
      const randomJoke = this.jokes[Math.floor(Math.random() * this.jokes.length)];
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*JOKES* 😂\n\n${randomJoke}\n\n> Ketik .jokes lagi untuk lelucon lainnya!` 
      });

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*JOKES*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = JokesFeature;
