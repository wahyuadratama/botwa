const config = require('../config/config');
const fs = require('fs');
const path = require('path');

class OwnerFeature {
  constructor() {
    this.name = 'owner';
    this.description = '_Kelola owner bot_';
    this.ownerOnly = true;
  }

  async execute(m, sock) {
    try {
      const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      const args = messageText.split(' ').slice(1);
      const command = args[0]?.toLowerCase();

      if (command === 'add') {
        const number = args[1]?.replace(/[^0-9]/g, '');
        if (!number) {
          await sock.sendMessage(m.key.remoteJid, { 
            text: '*OWNER MANAGER*\n\n❌ Format: !owner add [nomor]' 
          });
          return;
        }

        if (config.ownerNumbers.includes(number)) {
          await sock.sendMessage(m.key.remoteJid, { 
            text: '*OWNER MANAGER*\n\n⚠️ Nomor sudah terdaftar sebagai owner!' 
          });
          return;
        }

        config.ownerNumbers.push(number);
        this.saveConfig();
        
        await sock.sendMessage(m.key.remoteJid, { 
          text: `*OWNER MANAGER*\n\n✅ Berhasil menambahkan owner:\n${number}` 
        });

      } else if (command === 'remove') {
        const number = args[1]?.replace(/[^0-9]/g, '');
        if (!number) {
          await sock.sendMessage(m.key.remoteJid, { 
            text: '*OWNER MANAGER*\n\n❌ Format: !owner remove [nomor]' 
          });
          return;
        }

        const index = config.ownerNumbers.indexOf(number);
        if (index === -1) {
          await sock.sendMessage(m.key.remoteJid, { 
            text: '*OWNER MANAGER*\n\n⚠️ Nomor tidak terdaftar sebagai owner!' 
          });
          return;
        }

        config.ownerNumbers.splice(index, 1);
        this.saveConfig();
        
        await sock.sendMessage(m.key.remoteJid, { 
          text: `*OWNER MANAGER*\n\n✅ Berhasil menghapus owner:\n${number}` 
        });

      } else if (command === 'list') {
        const list = config.ownerNumbers.map((num, i) => `${i + 1}. ${num}`).join('\n');
        await sock.sendMessage(m.key.remoteJid, { 
          text: `*OWNER MANAGER*\n\n👑 Daftar Owner:\n${list}` 
        });

      } else {
        await sock.sendMessage(m.key.remoteJid, { 
          text: '*OWNER MANAGER*\n\nCommand:\n!owner add [nomor]\n!owner remove [nomor]\n!owner list' 
        });
      }

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*OWNER MANAGER*\n\n❌ Error: ${error.message}` 
      });
    }
  }

  saveConfig() {
    const configPath = path.join(__dirname, '../config/config.js');
    const content = `module.exports = {\n  ownerNumbers: ${JSON.stringify(config.ownerNumbers)},\n  ownerPrefix: '${config.ownerPrefix}',\n  userPrefix: '${config.userPrefix}'\n};\n`;
    fs.writeFileSync(configPath, content);
  }
}

module.exports = OwnerFeature;
