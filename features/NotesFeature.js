const fs = require('fs');
const path = require('path');

class NotesFeature {
  constructor() {
    this.name = 'note';
    this.description = 'Simpan catatan pribadi';
    this.ownerOnly = false;
    this.notesFile = './storage/notes.json';
    this.loadNotes();
  }

  loadNotes() {
    if (!fs.existsSync('./storage')) {
      fs.mkdirSync('./storage');
    }
    if (!fs.existsSync(this.notesFile)) {
      fs.writeFileSync(this.notesFile, JSON.stringify({}));
    }
    this.notes = JSON.parse(fs.readFileSync(this.notesFile, 'utf-8'));
  }

  saveNotes() {
    fs.writeFileSync(this.notesFile, JSON.stringify(this.notes, null, 2));
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const args = text.split(' ').slice(1);
      const userId = m.key.participant || m.key.remoteJid;

      if (!this.notes[userId]) {
        this.notes[userId] = [];
      }

      // .note add [catatan]
      if (args[0] === 'add' && args.length > 1) {
        const note = args.slice(1).join(' ');
        this.notes[userId].push({
          id: Date.now(),
          text: note,
          date: new Date().toLocaleString('id-ID')
        });
        this.saveNotes();
        
        await sock.sendMessage(m.key.remoteJid, {
          text: `✅ *CATATAN TERSIMPAN*\n\n📝 ${note}\n⏰ ${new Date().toLocaleString('id-ID')}`
        }, { quoted: m });
        return;
      }

      // .note list
      if (args[0] === 'list' || args.length === 0) {
        const userNotes = this.notes[userId];
        if (!userNotes || userNotes.length === 0) {
          await sock.sendMessage(m.key.remoteJid, {
            text: '📝 *CATATAN SAYA*\n\n❌ Belum ada catatan.\n\nGunakan: .note add [catatan]'
          }, { quoted: m });
          return;
        }

        let notesList = '*📝 CATATAN SAYA*\n\n';
        userNotes.forEach((note, index) => {
          notesList += `${index + 1}. ${note.text}\n⏰ ${note.date}\n\n`;
        });
        notesList += `Total: ${userNotes.length} catatan\n\n_Hapus: .note del [nomor]_`;

        await sock.sendMessage(m.key.remoteJid, { text: notesList }, { quoted: m });
        return;
      }

      // .note del [nomor]
      if (args[0] === 'del' && args[1]) {
        const index = parseInt(args[1]) - 1;
        if (index >= 0 && index < this.notes[userId].length) {
          const deleted = this.notes[userId].splice(index, 1)[0];
          this.saveNotes();
          
          await sock.sendMessage(m.key.remoteJid, {
            text: `🗑️ *CATATAN DIHAPUS*\n\n📝 ${deleted.text}`
          }, { quoted: m });
        } else {
          await sock.sendMessage(m.key.remoteJid, {
            text: '❌ Nomor catatan tidak valid!'
          }, { quoted: m });
        }
        return;
      }

      // Help
      await sock.sendMessage(m.key.remoteJid, {
        text: `📝 *NOTES - CATATAN PRIBADI*\n\nCommand:\n• .note add [teks] - Tambah catatan\n• .note list - Lihat semua catatan\n• .note del [nomor] - Hapus catatan\n\nContoh:\n.note add Beli susu besok\n.note del 1`
      }, { quoted: m });

    } catch (error) {
      console.error('Notes Error:', error);
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Gagal memproses catatan!'
      }, { quoted: m });
    }
  }
}

module.exports = NotesFeature;
