const fs = require('fs');
const path = require('path');

class BotControlFeature {
  constructor() {
    this.name = 'bot';
    this.description = 'On/Off bot di grup';
    this.ownerOnly = true;
    this.configPath = path.join(__dirname, '../storage/bot-control.json');
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(data);
        this.disabledGroups = config.disabledGroups || [];
        this.enabledGroups = config.enabledGroups || [];
      } else {
        this.disabledGroups = [];
        this.enabledGroups = [];
      }
    } catch (error) {
      this.disabledGroups = [];
      this.enabledGroups = [];
    }
  }

  saveConfig() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify({ 
        disabledGroups: this.disabledGroups,
        enabledGroups: this.enabledGroups 
      }, null, 2));
    } catch (error) {
      console.error('[BotControl] Save error:', error.message);
    }
  }

  isGroupDisabled(groupId) {
    return this.disabledGroups.includes(groupId);
  }

  isGroupEnabled(groupId) {
    return this.enabledGroups.includes(groupId);
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const args = text.split(' ');
      const command = args[1]?.toLowerCase();
      const groupId = m.key.remoteJid;

      if (!groupId.endsWith('@g.us')) {
        await sock.sendMessage(groupId, { text: '❌ Command ini hanya untuk grup!' });
        return;
      }

      if (command === 'off') {
        if (!this.disabledGroups.includes(groupId)) {
          this.disabledGroups.push(groupId);
          this.saveConfig();
          await sock.sendMessage(groupId, { text: '✅ Bot dimatikan di grup ini!' });
        } else {
          await sock.sendMessage(groupId, { text: '⚠️ Bot sudah dalam keadaan off!' });
        }
      } else if (command === 'on') {
        if (this.disabledGroups.includes(groupId)) {
          this.disabledGroups = this.disabledGroups.filter(id => id !== groupId);
          this.saveConfig();
          await sock.sendMessage(groupId, { text: '✅ Bot dinyalakan di grup ini!' });
        } else {
          await sock.sendMessage(groupId, { text: '⚠️ Bot sudah dalam keadaan on!' });
        }
      } else if (command === 'enable') {
        if (!this.enabledGroups.includes(groupId)) {
          this.enabledGroups.push(groupId);
          this.saveConfig();
          await sock.sendMessage(groupId, { text: '✅ Bot diaktifkan untuk grup ini! Sekarang bot bisa jalan di sini.' });
        } else {
          await sock.sendMessage(groupId, { text: '⚠️ Bot sudah diaktifkan untuk grup ini!' });
        }
      } else if (command === 'disable') {
        if (this.enabledGroups.includes(groupId)) {
          this.enabledGroups = this.enabledGroups.filter(id => id !== groupId);
          this.saveConfig();
          await sock.sendMessage(groupId, { text: '✅ Bot dinonaktifkan untuk grup ini! Bot tidak akan jalan lagi di sini.' });
        } else {
          await sock.sendMessage(groupId, { text: '⚠️ Bot belum diaktifkan untuk grup ini!' });
        }
      } else {
        const isDisabled = this.disabledGroups.includes(groupId);
        const isEnabled = this.enabledGroups.includes(groupId);
        const status = isDisabled ? 'OFF' : 'ON';
        const access = isEnabled ? 'ENABLED' : 'NOT ENABLED';
        
        await sock.sendMessage(groupId, { 
          text: `🤖 *BOT CONTROL*\n\nStatus: ${status}\nAkses: ${access}\n\nCommand:\n!bot enable - Aktifkan bot di grup\n!bot disable - Nonaktifkan akses bot\n!bot on - Nyalakan bot\n!bot off - Matikan bot` 
        });
      }

    } catch (error) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${error.message}` });
    }
  }
}

module.exports = BotControlFeature;
