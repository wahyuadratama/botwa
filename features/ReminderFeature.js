class ReminderFeature {
  constructor() {
    this.name = 'remind';
    this.description = '_Set reminder (format: .remind [detik] [pesan])_';
    this.ownerOnly = false;
  }

  async execute(m, sock) {
    try {
      const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      const args = messageText.split(' ').slice(1);
      
      if (args.length < 2) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*⏰ REMINDER*\n\n❌ Format: .remind [detik] [pesan]\n\nContoh:\n.remind 60 Minum obat\n.remind 300 Meeting dimulai' 
        });
        return;
      }

      const seconds = parseInt(args[0]);
      const reminderText = args.slice(1).join(' ');

      if (isNaN(seconds) || seconds < 1) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*⏰ REMINDER*\n\n❌ Waktu harus berupa angka (dalam detik)' 
        });
        return;
      }

      if (seconds > 86400) {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*⏰ REMINDER*\n\n❌ Maksimal 24 jam (86400 detik)' 
        });
        return;
      }

      await sock.sendMessage(m.key.remoteJid, { 
        text: `*⏰ REMINDER SET*\n\n✅ Reminder akan muncul dalam ${seconds} detik\n📝 Pesan: ${reminderText}` 
      });

      setTimeout(async () => {
        await sock.sendMessage(m.key.remoteJid, { 
          text: `*⏰ REMINDER*\n\n🔔 ${reminderText}` 
        });
      }, seconds * 1000);

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*REMINDER*\n\n❌ Error: ${error.message}` 
      });
    }
  }
}

module.exports = ReminderFeature;
