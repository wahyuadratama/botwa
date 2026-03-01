class HelpFeature {
  constructor() {
    this.name = 'help';
    this.description = '_Menu bantuan_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const helpText = `*BOT MENU* 🤖

*UTILITY*
.ping - Cek ping bot
.help - Menu bantuan
.info - Info bot
.sticker - Buat sticker dari gambar
.steks - Buat sticker dari teks
.toimg - Convert sticker ke gambar
.qr - Generate QR code
.calc - Kalkulator
.translate - Translate bahasa
.remind - Set reminder
.ad - Lihat pesan yang dihapus
.tagall - Tag semua anggota grup

*FUN*
.dice - Lempar dadu
.coin - Lempar koin
.quotes - Quote random
.jokes - Jokes random
.facts - Fakta random

*AI (PINTAR)*
wahyu [pertanyaan] - Chat dengan AI

*OWNER ONLY*
!rvo - View once bypass
!owner - Info owner
!groupinfo - Info grup (untuk whitelist)

_Bot by WahyuAdratama_`;

      const imageUrl = 'https://i.pinimg.com/originals/7c/8f/4d/7c8f4d89e830376e9e2f3a8c5b0e6f2a.jpg';

      await sock.sendMessage(m.key.remoteJid, { 
        image: { url: imageUrl },
        caption: helpText
      });

    } catch (error) {
      const helpText = `*BOT MENU* 🤖

*UTILITY*
.ping .help .info .sticker .steks
.toimg .qr .calc .translate .remind
.ad .tagall

*FUN*
.dice .coin .quotes .jokes .facts

*AI*
wahyu [pertanyaan]

*OWNER*
!rvo !owner !groupinfo

_Bot by WahyuAdratama_`;

      await sock.sendMessage(m.key.remoteJid, { text: helpText });
    }
  }
}

module.exports = HelpFeature;
