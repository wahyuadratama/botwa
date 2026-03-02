class HelpFeature {
  constructor() {
    this.name = 'help';
    this.description = '_Menu bantuan_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const helpText = `*BOT MENU*

*UTILITY*
.ping .help .info .sticker
.qr .calc .translate .remind .ad
.toimg .steks .passgen .meme

*FUN*
.dice .coin .quotes
.jokes .facts .lovecalc

*PRODUCTIVITY*
.note - Catatan pribadi
.poll - Buat polling (grup)
.vote - Vote polling
.pollresult - Hasil polling

*AI*
wahyu [pertanyaan]
.ai [pertanyaan]

*OWNER*
!rvo !owner

_Bot by WahyuAdratama_`;

      const imageUrl = 'https://i.pinimg.com/736x/a4/45/61/a44561dd0273d1a94103c707bc2a38ea.jpg';

      await sock.sendMessage(m.key.remoteJid, { 
        image: { url: imageUrl },
        caption: helpText
      });

    } catch (error) {
      const helpText = `*BOT MENU*

*UTILITY*
.ping .help .info .sticker
.qr .calc .translate .remind .ad
.toimg .steks .passgen .meme

*FUN*
.dice .coin .quotes
.jokes .facts .lovecalc

*PRODUCTIVITY*
.note - Catatan pribadi
.poll - Buat polling (grup)
.vote - Vote polling
.pollresult - Hasil polling

*AI*
wahyu [pertanyaan]
.ai [pertanyaan]

*OWNER*
!rvo !owner

_Bot by WahyuAdratama_`;

      await sock.sendMessage(m.key.remoteJid, { text: helpText });
    }
  }
}

module.exports = HelpFeature;