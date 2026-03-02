class PassGenFeature {
  constructor() {
    this.name = 'passgen';
    this.description = 'Generate password kuat';
    this.ownerOnly = false;
  }

  generatePassword(length = 16, options = {}) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    let password = '';

    // Default: include all
    if (options.lowercase !== false) chars += lowercase;
    if (options.uppercase !== false) chars += uppercase;
    if (options.numbers !== false) chars += numbers;
    if (options.symbols !== false) chars += symbols;

    // Ensure at least one from each category
    if (options.lowercase !== false) password += lowercase[Math.floor(Math.random() * lowercase.length)];
    if (options.uppercase !== false) password += uppercase[Math.floor(Math.random() * uppercase.length)];
    if (options.numbers !== false) password += numbers[Math.floor(Math.random() * numbers.length)];
    if (options.symbols !== false) password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  getStrength(password) {
    let strength = 0;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength >= 5) return '🟢 Sangat Kuat';
    if (strength >= 4) return '🟡 Kuat';
    if (strength >= 3) return '🟠 Sedang';
    return '🔴 Lemah';
  }

  async execute(m, sock) {
    try {
      const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
      const args = text.split(' ');

      // .passgen [length] [options]
      let length = 16;
      let options = {};

      if (args[1]) {
        const num = parseInt(args[1]);
        if (num >= 8 && num <= 32) {
          length = num;
        }
      }

      // Options: simple, medium, strong
      if (args[2] === 'simple') {
        options = { symbols: false };
      } else if (args[2] === 'medium') {
        options = {};
      } else if (args[2] === 'strong') {
        options = {};
      }

      const password = this.generatePassword(length, options);
      const strength = this.getStrength(password);

      const result = `🔐 *PASSWORD GENERATOR*\n\n🔑 Password:\n\`\`\`${password}\`\`\`\n\n📊 Kekuatan: ${strength}\n📏 Panjang: ${length} karakter\n\n💡 Tips:\n• Jangan gunakan password yang sama\n• Simpan di password manager\n• Ganti password secara berkala\n\n_Gunakan: .passgen [8-32] [simple/medium/strong]_`;

      await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });

    } catch (error) {
      console.error('PassGen Error:', error);
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Gagal generate password!'
      }, { quoted: m });
    }
  }
}

module.exports = PassGenFeature;
