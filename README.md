# 🤖 BOTWA WAHYUDRTMA

WhatsApp Bot canggih dengan berbagai fitur menarik dan berguna.

## ✨ Fitur Utama

### 🔧 Utility (12 Fitur)
- Ping checker
- Info & statistik bot
- Sticker maker
- QR code generator
- Calculator
- Translator
- Reminder
- Anti-delete message

### 🎮 Fun (6 Fitur)
- Dice roll
- Coin flip
- Random quotes
- Random jokes
- Random facts
- Kangen message

### 🤖 AI Features
- AI Wahyu chatbot
- Custom knowledge base

### 👑 Owner Features
- View once extractor
- Owner management
- Multi-owner support

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run bot
npm start
```

## 📝 Commands

### User Commands (prefix: .)
```
.help - Menu bantuan
.info - Info bot
.ping - Cek ping
.sticker - Buat sticker
.qr [teks] - Generate QR
.calc [operasi] - Kalkulator
.translate [teks] - Translate
.remind [detik] [pesan] - Set reminder
.ad - Lihat pesan dihapus
.dice - Lempar dadu
.coin - Lempar koin
.quotes - Quote motivasi
.jokes - Lelucon
.facts - Fakta menarik
.kangen - Pesan kangen
wahyu [pertanyaan] - Chat AI
```

### Owner Commands (prefix: !)
```
!rvo - Ekstrak view once
!owner add [nomor] - Tambah owner
!owner remove [nomor] - Hapus owner
!owner list - List owner
```

## ⚙️ Configuration

Edit `config/config.js`:
```javascript
module.exports = {
  ownerNumbers: ['6283895937947'],
  ownerPrefix: '!',
  userPrefix: '.'
};
```

## 📦 Tech Stack

- Node.js
- @whiskeysockets/baileys
- QRCode Terminal
- Pino Logger

## 👨💻 Developer

**WahyuAdratama**

## 📄 License

MIT License

---
Made with ❤️ by WahyuAdratama
