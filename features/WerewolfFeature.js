/**
 * WerewolfFeature — game Werewolf otomatis di WhatsApp.
 *
 * Perintah (prefix user '.', mis. ".ww baru"):
 *   Di grup:
 *     .ww baru    - buka lobby game baru
 *     .ww join    - ikut main
 *     .ww mulai   - mulai game (min. 7 pemain)
 *     .ww batal   - batalkan game (pembuat lobby)
 *     .ww status  - lihat status game
 *     .ww vote N  - voting siang (N = nomor pemain)
 *     .ww bantu   - panduan
 *   Di DM (chat pribadi dengan bot):
 *     .ww mangsa N    - (serigala) pilih korban malam ini
 *     .ww terawang N  - (dukun) terawang peran pemain N (0 = lewati)
 *     .ww lindungi N  - (dokter) lindungi pemain N (0 = lewati)
 *
 * Alur otomatis: lobby -> peran via DM -> malam (aksi via DM) ->
 * pagi (pengumuman) -> diskusi (timer) -> voting -> ulangi sampai menang.
 *
 * Pembuat lobby (.ww baru) menjadi MODERATOR: memandu game, tidak ikut main,
 * bisa memulai (.ww mulai), melewati fase (.ww skip), dan membatalkan (.ww batal).
 * Pemain join dengan nickname: .ww join <nickname> (ditampilkan di semua daftar).
 */
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const execFileAsync = promisify(execFile);

class WerewolfFeature {
  constructor() {
    this.name = 'ww';
    this.description = 'Game Werewolf otomatis';
    this.ownerOnly = false;

    this.games = new Map(); // groupJid -> game
    this.sock = null;

    this.MIN_PLAYERS = 2;
    this.RECOMMENDED_MIN = 7;
    this.MAX_PLAYERS = 30;
    this.NIGHT_MS = 120000;
    this.DISCUSS_MS = 300000;
    this.VOTE_MS = 90000;
    this.DM_DELAY_MS = 700;

    // Mode tes solo (di DM): .ww tes [jumlah]
    this.TEST_NIGHT_MS = 60000;
    this.TEST_DISCUSS_MS = 45000;
    this.TEST_VOTE_MS = 45000;
    this.TEST_NAMES = ['Budi', 'Ani', 'Candra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Intan', 'Joko', 'Kirana'];

    this.ROLE_LABEL = {
      serigala: '🐺 Serigala',
      dukun: '🔮 Dukun',
      dokter: '💉 Dokter',
      sk: '🔪 Serial Killer',
      warga: '🧑 Warga',
    };
    this.ROLE_DESC = {
      serigala:
        'Kamu SERIGALA. Setiap malam, pilih satu warga untuk dimangsa dengan:\n.ww mangsa <nomor>\nSuara terbanyak di antara para serigala yang jadi korban. Jangan sampai ketahuan!',
      dukun:
        'Kamu DUKUN. Setiap malam kamu boleh menerawang SATU pemain:\n.ww terawang <nomor>\natau lewati dengan:\n.ww terawang 0',
      dokter:
        'Kamu DOKTER. Setiap malam kamu boleh melindungi SATU pemain (termasuk dirimu):\n.ww lindungi <nomor>\natau lewati dengan:\n.ww lindungi 0',
      sk:
        'Kamu SERIAL KILLER 🔪. Setiap malam, bunuh SIAPA PUN yang kamu mau (termasuk serigala!) dengan:\n.ww bunuh <nomor>\nKamu menang jika kamu SATU-SATUNYA yang tersisa hidup. Hati-hati: kamu bisa mati dimangsa serigala atau divote siang hari!',
      warga:
        'Kamu WARGA biasa. Malam hari kamu tidur. Siang hari, diskusikan dan votinglah untuk menyingkirkan serigala yang bersembunyi di antara kalian!',
    };
  }

  // ============================================================ util
  getText(m) {
    return (
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      ''
    );
  }

  isGroup(chatId) {
    return chatId.endsWith('@g.us');
  }

  senderJid(m) {
    return m.key.participant || m.key.remoteJid;
  }

  mentionOf(jid) {
    return '@' + jid.split('@')[0];
  }

  disp(game, p) {
    // Nama tampilan: di mode tes pakai nama polos (JID bot tes tidak valid untuk mention)
    return game.isTest ? p.name : this.mentionOf(p.jid);
  }

  async send(chatId, text, mentions) {
    try {
      const msg = { text };
      if (mentions && mentions.length) msg.mentions = mentions;
      await this.sock.sendMessage(chatId, msg);
      return true;
    } catch (e) {
      console.error('[WW] send gagal:', e.message);
      return false;
    }
  }

  async dm(userJid, text) {
    try {
      await this.sock.sendMessage(userJid, { text });
      return true;
    } catch (e) {
      console.error('[WW] DM gagal ke', userJid, ':', e.message);
      return false;
    }
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  clearTimer(game) {
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }
  }

  // ============================================================ logika
  makeRoles(n) {
    // Mode tes (< 7 pemain): 1 serigala + 1 dukun + sisanya warga.
    // Game-nya tidak seimbang — hanya untuk coba-coba mekanisme bot.
    if (n < 7) {
      const roles = ['serigala', 'dukun'];
      while (roles.length < n) roles.push('warga');
      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
      }
      return roles;
    }
    const wolves = Math.max(2, Math.floor(n / 5));
    const roles = Array(wolves).fill('serigala');
    roles.push('dukun');
    roles.push('sk'); // serial killer: selalu 1 di game normal
    if (n >= 9) roles.push('dokter');
    if (n >= 16) roles.push('dokter');
    while (roles.length < n) roles.push('warga');
    // shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
  }

  alivePlayers(game) {
    return [...game.players.values()].filter((p) => p.alive);
  }

  aliveWolves(game) {
    return this.alivePlayers(game).filter((p) => p.role === 'serigala');
  }

  checkWinner(game) {
    const alive = this.alivePlayers(game);
    const wolves = alive.filter((p) => p.role === 'serigala').length;
    const sk = alive.filter((p) => p.role === 'sk').length;
    const others = alive.length - wolves - sk; // warga + dukun + dokter
    // Serial killer menang kalau tinggal dia sendiri
    if (alive.length === 1 && sk === 1) return 'sk';
    if (wolves === 0 && sk === 0) return 'warga';
    if (wolves > 0 && wolves >= others + sk) return 'serigala';
    return null;
  }

  plurality(votesMap) {
    // votesMap: voterJid -> targetJid ; seri -> null
    const counts = {};
    for (const t of votesMap.values()) counts[t] = (counts[t] || 0) + 1;
    const ids = Object.keys(counts);
    if (!ids.length) return null;
    const best = Math.max(...ids.map((id) => counts[id]));
    const winners = ids.filter((id) => counts[id] === best);
    return winners.length === 1 ? winners[0] : null;
  }

  numberedList(players) {
    return players.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  }

  cleanNick(s) {
    // Nickname: satu baris, maks 20 karakter
    if (!s) return '';
    return s.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 20);
  }

  isModerator(game, sender, m) {
    if (m && m.key.fromMe) return true; // owner via nomor bot
    return !!(game.moderator && sender === game.moderator.jid);
  }

  // ============================================================ router
  async execute(m, sock) {
    try {
      // CATATAN: fromMe TIDAK diabaikan — owner mengendalikan bot dari nomor bot itu sendiri,
      // dan pesan bot tidak pernah diawali prefix ".ww" sehingga tidak ada risiko loop.
      this.sock = sock;

      const chatId = m.key.remoteJid;
      const sender = this.senderJid(m);
      const name = m.pushName || 'Pemain';
      const body = this.getText(m).trim();
      const parts = body.slice(1).split(/\s+/); // ['ww','mangsa','3']
      const sub = (parts[1] || '').toLowerCase();
      const args = parts.slice(2);

      if (!sub || sub === 'bantu' || sub === 'help') return this.cmdBantu(chatId, m);

      switch (sub) {
        case 'baru': return this.cmdBaru(chatId, sender, name, args, m);
        case 'join': return this.cmdJoin(chatId, sender, name, args, m);
        case 'mulai': return this.cmdMulai(chatId, sender, m);
        case 'batal': return this.cmdBatal(chatId, sender, m);
        case 'status': return this.cmdStatus(chatId, m);
        case 'vote': return this.cmdVote(chatId, sender, name, args, m);
        case 'skip': return this.cmdSkip(chatId, sender, m);
        case 'tes': return this.cmdTes(chatId, sender, name, args, m);
        case 'stop': return this.cmdStop(chatId, sender);
        case 'nick': return this.cmdNick(chatId, sender, args, m);
        case 'foto': return this.cmdFoto(chatId, sender, name, m);
        case 'mangsa': return this.nightAction(sender, 'serigala', args, m);
        case 'bunuh': return this.nightAction(sender, 'sk', args, m);
        case 'terawang': return this.nightAction(sender, 'dukun', args, m);
        case 'lindungi': return this.nightAction(sender, 'dokter', args, m);
        default:
          return this.send(chatId, '❓ Perintah tidak dikenal. Ketik *.ww bantu* untuk panduan.');
      }
    } catch (e) {
      console.error('[WW] execute error:', e.message);
    }
  }

  getGame(chatId) {
    return this.games.get(chatId);
  }

  findNightGame(sender) {
    for (const game of this.games.values()) {
      if (game.phase === 'night') {
        const p = game.players.get(sender);
        if (p && p.alive) return game;
      }
    }
    return null;
  }

  async notifyMod(game, text) {
    // Ringkasan untuk moderator via DM — pantau game dari chat pribadi, bukan grup.
    if (!game || game.isTest || !game.moderator) return;
    await this.dm(game.moderator.jid, `🎤 ${text}`);
  }

  // ============================================================ foto pemain
  safeFile(s) {
    return String(s).replace(/[^a-zA-Z0-9]/g, '_');
  }

  photoPath(game, jid) {
    return `/tmp/ww_${this.safeFile(game.chatId)}_${this.safeFile(jid)}.webp`;
  }

  deadPhotoPath(game, jid) {
    return `/tmp/ww_dead_${this.safeFile(game.chatId)}_${this.safeFile(jid)}.webp`;
  }

  async downloadPhoto(m) {
    return downloadMediaMessage(
      m, 'buffer', {},
      { logger: console, reuploadRequest: this.sock.updateMediaMessage }
    );
  }

  async compressPhoto(buffer, outPath) {
    // Kompres ke webp < 200KB (coba turunkan kualitas/lebar sampai cukup kecil)
    const tmpIn = `/tmp/ww_in_${Date.now()}_${Math.floor(Math.random() * 1e6)}.bin`;
    fs.writeFileSync(tmpIn, buffer);
    try {
      let q = 75, size = 512;
      for (let attempt = 0; attempt < 4; attempt++) {
        await execFileAsync(
          'ffmpeg',
          ['-y', '-i', tmpIn, '-vf', `scale=${size}:-1`, '-c:v', 'libwebp', '-q:v', String(q), outPath],
          { timeout: 30000 }
        );
        if (fs.statSync(outPath).size < 200 * 1024) return true;
        q -= 15;
        if (q < 20) { q = 20; size = 384; }
      }
      return fs.statSync(outPath).size < 200 * 1024;
    } catch (e) {
      console.error('[WW] kompres foto gagal:', e.message);
      return false;
    } finally {
      try { fs.unlinkSync(tmpIn); } catch (e) {}
    }
  }

  async makeDeadPhoto(srcPath, dstPath) {
    // Foto eliminasi: hitam-putih + X merah
    // (hue=s=0 dipakai, bukan format=gray, supaya X merah tidak ikut jadi abu-abu)
    try {
      await execFileAsync(
        'ffmpeg',
        ['-y', '-i', srcPath, '-vf',
          "hue=s=0,drawtext=text='X':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=220:fontcolor=red:borderw=6:bordercolor=white:x=(w-text_w)/2:y=(h-text_h)/2",
          '-c:v', 'libwebp', '-q:v', '80', dstPath],
        { timeout: 30000 }
      );
      return fs.existsSync(dstPath);
    } catch (e) {
      console.error('[WW] dead photo gagal:', e.message);
      return false;
    }
  }

  clearPhotos(game) {
    if (!game) return;
    for (const p of game.players.values()) {
      for (const f of [this.photoPath(game, p.jid), this.deadPhotoPath(game, p.jid)]) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
      }
    }
  }

  findLobbyByPlayer(sender) {
    for (const game of this.games.values()) {
      if (game.phase === 'lobby' && !game.isTest && game.players.has(sender)) return game;
    }
    return null;
  }

  async maybeComplete(game, p) {
    // Jika nickname + foto sudah lengkap -> konfirmasi di grup beserta fotonya
    if (p.nick && p.photo && !p.announced) {
      p.announced = true;
      const doneCount = [...game.players.values()].filter((x) => x.nick && x.photo).length;
      const caption = `✅ *${p.nick}* resmi ikut main! (${doneCount} pemain)`;
      try {
        await this.sock.sendMessage(game.chatId, {
          image: { url: p.photo },
          caption,
          mentions: [p.jid],
        });
      } catch (e) {
        console.error('[WW] kirim foto join gagal:', e.message);
        await this.send(game.chatId, caption, [p.jid]);
      }
    }
  }

  async sendElimination(game, victim, caption) {
    // Pengumuman eliminasi: foto hitam-putih + X merah (fallback teks jika gagal)
    const deadPath = this.deadPhotoPath(game, victim.jid);
    let ok = false;
    if (victim.photo && fs.existsSync(victim.photo)) {
      ok = await this.makeDeadPhoto(victim.photo, deadPath);
    }
    if (ok) {
      try {
        await this.sock.sendMessage(game.chatId, {
          image: { url: deadPath },
          caption,
          mentions: [victim.jid],
        });
        return;
      } catch (e) {
        console.error('[WW] kirim foto eliminasi gagal:', e.message);
      }
    }
    await this.send(game.chatId, caption, [victim.jid]);
  }

  // ============================================================ perintah grup
  async cmdBantu(chatId, m) {
    const inGroup = this.isGroup(chatId);
    await this.send(
      chatId,
      '🐺 *WEREWOLF — Panduan*\n\n' +
        (inGroup
          ? '*Di grup:*\n.ww baru [nickname] — buka lobby (kamu jadi 🎤 moderator)\n.ww join [nickname] — ikut main (lengkapi data via DM)\n.ww mulai — mulai game (moderator saja, min. 2 pemain, ideal 7+)\n.ww skip — lewati fase saat ini (moderator saja)\n.ww vote <nomor> — voting siang\n.ww status — status game\n.ww batal — batalkan game (moderator saja)\n\n*Di DM (chat pribadi bot):*\n.ww nick <nickname> — isi nickname\n.ww foto — kirim *FOTO* dengan caption ini (foto selfie)\n.ww mangsa <nomor> — serigala pilih korban\n.ww bunuh <nomor> — serial killer bunuh siapa pun\n.ww terawang <nomor> — dukun terawang (0 = lewati)\n.ww lindungi <nomor> — dokter lindungi (0 = lewati)\n\n*Peran:* 🐺 Serigala, 🔪 Serial Killer (1 orang, menang jika sisa sendiri), 🔮 Dukun, 💉 Dokter, 🧑 Warga\n\n'
          : '*Di DM:*\n.ww mangsa <nomor> — (serigala) pilih korban\n.ww bunuh <nomor> — (serial killer) bunuh siapa pun\n.ww terawang <nomor> — (dukun) terawang peran, 0 = lewati\n.ww lindungi <nomor> — (dokter) lindungi, 0 = lewati\n.ww tes [jumlah] — sesi tes solo lawan bot (tanpa grup)\n.ww stop — hentikan sesi tes\n.ww skip — lewati fase (sesi tes)\n\n') +
        'Alur: lobby → peran via DM → 🌙 malam → ☀️ pagi → 💬 diskusi → 🗳️ voting → ulangi.\n' +
        'Warga menang jika semua serigala tersingkir. Serigala menang jika jumlah mereka ≥ sisa warga.\n' +
        '🎤 Moderator memandu jalannya game (tidak ikut main).',
      null
    );
  }

  async cmdBaru(chatId, sender, name, args, m) {
    if (!this.isGroup(chatId)) {
      return this.send(chatId, 'Buat game di grup, bukan di chat pribadi. Ketik *.ww bantu* untuk panduan.');
    }
    const cur = this.getGame(chatId);
    if (cur && cur.phase !== 'ended') {
      return this.send(chatId, 'Di grup ini sudah ada game yang berjalan.');
    }
    if (cur) this.clearPhotos(cur); // bersihkan sisa foto game sebelumnya
    const nick = this.cleanNick(args.join(' ')) || this.cleanNick(name) || 'Moderator';
    this.games.set(chatId, {
      chatId, creator: sender, phase: 'lobby',
      moderator: { jid: sender, nick },
      players: new Map(), day: 0, timer: null, night: null, votes: new Map(),
    });
    // Beri tahu moderator via DM: dia pantau dari chat pribadi, bukan grup.
    await this.dm(
      sender,
      `🎤 *Kamu MODERATOR game Werewolf ini.*\n\n` +
        `Tugasmu memandu jalannya game. Pantau dari chat pribadi ini — tidak perlu mantengin grup.\n\n` +
        `*Perintah moderator* (ketik di grup):\n` +
        `• .ww mulai — mulai game\n` +
        `• .ww skip — lewati fase yang berjalan\n` +
        `• .ww batal — batalkan game\n\n` +
        `Pemain join dengan: *.ww join <nickname>*\n` +
        `Saat game dimulai, daftar lengkap peran + nickname dikirim ke sini. Rahasiakan! 🤫`
    );
    await this.send(
      chatId,
      `🐺 *LOBBY WEREWOLF dibuka!*\n\n🎤 Moderator: *${nick}* (cek DM dari bot! 📩)\n\nKetik *.ww join <nickname>* untuk ikut (min. ${this.MIN_PLAYERS} pemain).\nContoh: *.ww join Ucul*\n\nModerator mengetik *.ww mulai* kalau sudah siap.\n\n⚠️ Pastikan nomor bot ini tidak dibisukan supaya DM peran masuk!`
    );
  }

  async cmdJoin(chatId, sender, name, args, m) {
    if (!this.isGroup(chatId)) return this.send(chatId, 'Join dilakukan di grup game. Ketik *.ww bantu* untuk panduan.');
    const game = this.getGame(chatId);
    if (!game || game.phase !== 'lobby') {
      return this.send(chatId, 'Belum ada lobby. Buat dulu dengan *.ww baru*.');
    }
    if (game.moderator && sender === game.moderator.jid) {
      return this.send(chatId, 'Kamu moderator game ini — tidak bisa ikut main. 😄');
    }
    if (game.players.has(sender)) {
      const ex = game.players.get(sender);
      if (ex.nick && ex.photo) return this.send(chatId, 'Kamu sudah ikut dan datamu lengkap. ✅');
      return this.send(chatId, 'Kamu sudah join — lengkapi datamu via DM bot ya! 📩');
    }
    if (game.players.size >= this.MAX_PLAYERS) {
      return this.send(chatId, `Lobby penuh (maks. ${this.MAX_PLAYERS}).`);
    }
    // Nickname boleh langsung di .ww join, atau nanti via DM (.ww nick)
    let nick = null;
    const nickArg = this.cleanNick(args.join(' '));
    if (nickArg) {
      const low = nickArg.toLowerCase();
      const taken =
        [...game.players.values()].some((p) => p.nick && p.nick.toLowerCase() === low) ||
        (game.moderator && game.moderator.nick.toLowerCase() === low);
      if (taken) {
        return this.send(chatId, `Nickname *${nickArg}* sudah dipakai. Coba *.ww join* saja lalu pilih via DM, atau pakai nickname lain.`);
      }
      nick = nickArg;
    }
    const p = {
      jid: sender, name: nick || this.cleanNick(name) || 'Pemain',
      nick, photo: null, announced: false, role: 'warga', alive: true,
    };
    game.players.set(sender, p);

    // Minta lengkapi via DM
    const steps = [];
    if (!nick) steps.push('1️⃣ *Nickname* — balas:\n*.ww nick <nickname>*\nContoh: *.ww nick Ucul*');
    steps.push(`${nick ? '1️⃣' : '2️⃣'} *Foto selfie* — kirim *FOTO* dengan caption:\n*.ww foto*`);
    await this.dm(
      sender,
      `📝 *Lengkapi data Werewolf kamu!*\n\n${steps.join('\n\n')}\n\n` +
        `⚠️ Foto *tanpa caption* tidak terbaca oleh bot!\n\n` +
        `Setelah lengkap, keikutsertaanmu dikonfirmasi di grup. ✅`
    );
    await this.send(chatId, `⏳ ${this.mentionOf(sender)} mau ikut! Lengkapi nickname + foto via DM bot ya. 📩`, [sender]);
    // Kalau nickname sudah diisi saat join, tinggal tunggu foto
    await this.maybeComplete(game, p);
  }

  async cmdNick(chatId, sender, args, m) {
    if (this.isGroup(chatId)) {
      return this.send(chatId, 'Isi nickname via *DM* (chat pribadi dengan bot), bukan di grup.');
    }
    const game = this.findLobbyByPlayer(sender);
    if (!game) return this.send(chatId, 'Kamu belum join lobby mana pun. Join dulu di grup dengan *.ww join*.');
    const nick = this.cleanNick(args.join(' '));
    if (!nick) return this.send(chatId, 'Nickname tidak valid. Contoh: *.ww nick Ucul*');
    const low = nick.toLowerCase();
    const taken =
      [...game.players.values()].some((p) => p.jid !== sender && p.nick && p.nick.toLowerCase() === low) ||
      (game.moderator && game.moderator.nick.toLowerCase() === low);
    if (taken) return this.send(chatId, `Nickname *${nick}* sudah dipakai. Pilih yang lain.`);
    const p = game.players.get(sender);
    p.nick = nick;
    p.name = nick;
    await this.send(chatId, `Nickname disimpan: *${nick}* ✅` + (p.photo ? '' : '\nSelanjutnya kirim foto selfie dengan caption *.ww foto* 📸'));
    await this.maybeComplete(game, p);
  }

  async cmdFoto(chatId, sender, name, m) {
    if (this.isGroup(chatId)) {
      return this.send(chatId, 'Kirim foto selfie via *DM* (chat pribadi dengan bot) untuk privasi. Jangan lupa caption: *.ww foto*');
    }
    const game = this.findLobbyByPlayer(sender);
    if (!game) return this.send(chatId, 'Kamu belum join lobby mana pun. Join dulu di grup dengan *.ww join*.');
    if (!m.message.imageMessage) {
      return this.send(chatId, 'Kirim *FOTO* (bukan teks) dengan caption *.ww foto* 📸');
    }
    const p = game.players.get(sender);
    await this.send(chatId, '⏳ Memproses foto...');
    let buf;
    try {
      buf = await this.downloadPhoto(m);
    } catch (e) {
      console.error('[WW] download foto gagal:', e.message);
      return this.send(chatId, '❌ Gagal mengunduh foto. Coba kirim ulang dengan caption *.ww foto*');
    }
    const out = this.photoPath(game, sender);
    const ok = await this.compressPhoto(buf, out);
    if (!ok) return this.send(chatId, '❌ Gagal memproses foto. Coba foto lain.');
    p.photo = out;
    await this.send(chatId, 'Foto tersimpan! ✅' + (p.nick ? '' : '\nJangan lupa nickname: *.ww nick <nickname>*'));
    await this.maybeComplete(game, p);
  }

  async cmdBatal(chatId, sender, m) {
    const game = this.getGame(chatId);
    if (!game || game.phase === 'ended') return this.send(chatId, 'Tidak ada game yang berjalan.');
    if (!this.isModerator(game, sender, m)) {
      return this.send(chatId, 'Hanya moderator yang bisa membatalkan game.');
    }
    this.clearTimer(game);
    this.clearPhotos(game);
    game.phase = 'ended';
    await this.send(chatId, 'Game dibatalkan oleh moderator.');
  }

  async cmdSkip(chatId, sender, m) {
    const game = this.getGame(chatId);
    if (!game || game.phase === 'ended') return this.send(chatId, 'Tidak ada game yang berjalan.');
    const allowed = game.isTest ? sender === game.testUser : this.isModerator(game, sender, m);
    if (!allowed) return this.send(chatId, 'Hanya moderator yang bisa melewati fase.');
    if (game.phase === 'lobby') return this.send(chatId, 'Belum ada fase berjalan (masih lobby).');
    this.clearTimer(game);
    await this.send(chatId, '⏭️ Fase dilewati.');
    if (game.phase === 'night') return this.resolveNight(game);
    if (game.phase === 'discuss') return this.startVote(game);
    if (game.phase === 'vote') return this.resolveVote(game);
  }

  async cmdStatus(chatId, m) {
    const game = this.getGame(chatId);
    if (!game) return this.send(chatId, 'Belum ada game di sini.');
    const alive = this.alivePlayers(game).length;
    const mod = game.moderator ? `\n🎤 Moderator: *${game.moderator.nick}*` : '';
    await this.send(chatId, `🐺 Status: fase *${game.phase}*, hari ke-${game.day}${mod}\nPemain hidup: ${alive}/${game.players.size}`);
  }

  async cmdMulai(chatId, sender, m) {
    if (!this.isGroup(chatId)) return this.send(chatId, 'Mulai game dari grup.');
    const game = this.getGame(chatId);
    if (!game || game.phase !== 'lobby') return this.send(chatId, 'Belum ada lobby yang dibuka.');
    if (!this.isModerator(game, sender, m)) {
      return this.send(chatId, 'Hanya *moderator* yang bisa memulai game.');
    }
    // Semua pemain wajib lengkap (nickname + foto) sebelum mulai
    const incomplete = [...game.players.values()].filter((p) => !(p.nick && p.photo));
    if (incomplete.length) {
      const lines = incomplete.map((p) => {
        const need = [!p.nick && 'nickname', !p.photo && 'foto selfie'].filter(Boolean).join(' + ');
        return `• ${this.mentionOf(p.jid)} — kurang ${need}`;
      });
      return this.send(
        chatId,
        `⏳ *Belum bisa mulai!*\n\nYang belum lengkap:\n${lines.join('\n')}\n\nLengkapi via DM bot dulu ya! 📩`,
        incomplete.map((p) => p.jid)
      );
    }
    if (game.players.size < this.MIN_PLAYERS) {
      return this.send(chatId, `Pemain kurang — butuh min. ${this.MIN_PLAYERS}, baru ada ${game.players.size}.`);
    }

    const roles = this.makeRoles(game.players.size);
    const players = [...game.players.values()];
    players.forEach((p, i) => { p.role = roles[i]; });

    const wolves = players.filter((p) => p.role === 'serigala');
    const wolfNames = wolves.map((p) => p.name).join(', ');

    // Kirim peran via DM satu per satu (jeda anti-spam)
    const gagal = [];
    for (const p of players) {
      let text = `${this.ROLE_LABEL[p.role]}\n\n${this.ROLE_DESC[p.role]}`;
      if (p.role === 'serigala') text += `\n\n🐺 Kawan serigalamu: ${wolfNames}`;
      const ok = await this.dm(p.jid, text);
      if (!ok) gagal.push(p);
      else await this.sleep(this.DM_DELAY_MS);
    }
    if (gagal.length) {
      game.phase = 'ended';
      const names = gagal.map((p) => p.name).join(', ');
      return this.send(
        chatId,
        `❌ Game DIBATALKAN.\n\nPeran gagal dikirim ke: ${names}\n(mungkin nomor bot diblokir/dibisukan)\n\nMinta mereka buka blokir, lalu buat lobby baru dengan *.ww baru*.`
      );
    }

    game.day = 1;
    // Moderator tahu semua peran + nickname (via DM, rahasia)
    if (game.moderator) {
      const roleLines = players.map((p) => `• ${p.name} — ${this.ROLE_LABEL[p.role]}`).join('\n');
      await this.dm(
        game.moderator.jid,
        `🎤 *Game dimulai! Daftar peran (RAHASIA):*\n\n${roleLines}\n\nJangan bocorkan ke pemain! 🤫`
      );
    }
    const mentions = players.map((p) => p.jid);
    const testMode = players.length < this.RECOMMENDED_MIN;
    await this.send(
      chatId,
      `🎮 Game dimulai! ${players.length} pemain.` +
        (testMode ? `\n⚠️ *Mode TES* (pemain < ${this.RECOMMENDED_MIN}) — game tidak seimbang, hanya untuk coba-coba ya!` : '') +
        `\nPeran sudah dikirim via DM masing-masing. Jaga rahasiamu! 🤫\n\n` +
        players.map((p) => this.mentionOf(p.jid)).join(' '),
      mentions
    );
    await this.startNight(game);
  }

  // ============================================================ malam
  async startNight(game) {
    if (game.isTest) return this.startTestNight(game);
    game.phase = 'night';
    game.votes = new Map();
    const alive = this.alivePlayers(game);
    const nonWolves = alive.filter((p) => p.role !== 'serigala');
    game.night = {
      targets: nonWolves, // urutan bernomor untuk serigala
      allTargets: alive,  // urutan bernomor untuk dukun/dokter/sk
      wolfVotes: new Map(),
      seerDone: false,
      doctorDone: false,
      doctorTarget: null,
      skTarget: null,
      skDone: false,
    };

    const wolves = this.aliveWolves(game);
    const seers = alive.filter((p) => p.role === 'dukun');
    const doctors = alive.filter((p) => p.role === 'dokter');
    const killers = alive.filter((p) => p.role === 'sk');

    for (const w of wolves) {
      await this.dm(
        w.jid,
        `🌙 *MALAM ${game.day}*\nPilih warga untuk dimangsa.\nBalas: *.ww mangsa <nomor>*\n\n${this.numberedList(nonWolves)}`
      );
      await this.sleep(this.DM_DELAY_MS);
    }
    for (const k of killers) {
      await this.dm(
        k.jid,
        `🌙 *MALAM ${game.day}*\nPilih SIAPA PUN untuk dibunuh (termasuk serigala!).\nBalas: *.ww bunuh <nomor>*\n\n${this.numberedList(alive)}`
      );
      await this.sleep(this.DM_DELAY_MS);
    }
    for (const s of seers) {
      const list = alive.filter((p) => p.jid !== s.jid);
      game.night.seerTargets = list;
      await this.dm(
        s.jid,
        `🌙 *MALAM ${game.day}*\nPilih pemain untuk diterawang.\nBalas: *.ww terawang <nomor>* (atau *.ww terawang 0* untuk lewati)\n\n${this.numberedList(list)}`
      );
      await this.sleep(this.DM_DELAY_MS);
    }
    for (const d of doctors) {
      await this.dm(
        d.jid,
        `🌙 *MALAM ${game.day}*\nPilih pemain untuk dilindungi.\nBalas: *.ww lindungi <nomor>* (atau *.ww lindungi 0* untuk lewati)\n\n${this.numberedList(alive)}`
      );
      await this.sleep(this.DM_DELAY_MS);
    }

    await this.send(
      game.chatId,
      `🌙 *Malam ${game.day} tiba...* semua pemain cek DM dari bot! (${this.NIGHT_MS / 1000} detik)`
    );
    this.clearTimer(game);
    game.timer = setTimeout(() => {
      if (game.phase === 'night') this.resolveNight(game);
    }, this.NIGHT_MS);
  }

  async nightAction(sender, role, args, m) {
    // hanya di DM
    const chatId = m.key.remoteJid;
    if (this.isGroup(chatId)) {
      return this.send(chatId, 'Aksi malam dilakukan di *DM* (chat pribadi dengan bot), bukan di grup.');
    }
    const game = this.findNightGame(sender);
    if (!game) return this.send(chatId, 'Tidak ada aksi malam yang aktif untukmu.');
    const p = game.players.get(sender);
    if (!p || !p.alive || p.role !== role) {
      return this.send(chatId, 'Kamu tidak bisa melakukan aksi itu.');
    }
    const num = parseInt(args[0], 10);
    const night = game.night;

    if (role === 'serigala') {
      const target = night.targets[num - 1];
      if (!target) return this.send(chatId, `Nomor tidak valid! Pilih 1-${night.targets.length}.`);
      night.wolfVotes.set(sender, target.jid);
      await this.send(chatId, `Pilihanmu: memangsa *${target.name}*. Menunggu kawan serigala lain... 🌙`);
    } else if (role === 'sk') {
      const target = night.allTargets[num - 1];
      if (!target) return this.send(chatId, `Nomor tidak valid! Pilih 1-${night.allTargets.length}.`);
      if (target.jid === sender) return this.send(chatId, 'Kamu tidak bisa membunuh dirimu sendiri! 🔪');
      night.skTarget = target.jid;
      night.skDone = true;
      await this.send(chatId, `🔪 Targetmu malam ini: *${target.name}*.`);
    } else if (role === 'dukun') {
      if (num === 0) {
        night.seerDone = true;
        await this.send(chatId, '⏭️ Kamu melewatkan terawangan malam ini.');
      } else {
        const target = night.seerTargets[num - 1];
        if (!target) return this.send(chatId, `Nomor tidak valid! Pilih 1-${night.seerTargets.length} atau 0 untuk lewati.`);
        night.seerDone = true;
        await this.send(chatId, `🔮 Terawangan: *${target.name}* adalah *${this.ROLE_LABEL[target.role]}*!`);
      }
    } else if (role === 'dokter') {
      if (num === 0) {
        night.doctorDone = true;
        await this.send(chatId, '⏭️ Kamu melewatkan perlindungan malam ini.');
      } else {
        const target = night.allTargets[num - 1];
        if (!target) return this.send(chatId, `Nomor tidak valid! Pilih 1-${night.allTargets.length} atau 0 untuk lewati.`);
        night.doctorTarget = target.jid;
        night.doctorDone = true;
        await this.send(chatId, `💉 Kamu melindungi *${target.name}* malam ini.`);
      }
    }
    this.maybeFastResolve(game);
  }

  maybeFastResolve(game) {
    if (game.phase !== 'night' || !game.night) return;
    const wolves = this.aliveWolves(game);
    const seers = this.alivePlayers(game).filter((p) => p.role === 'dukun');
    const doctors = this.alivePlayers(game).filter((p) => p.role === 'dokter');
    const killers = this.alivePlayers(game).filter((p) => p.role === 'sk');
    const wolvesDone = wolves.length > 0 && wolves.every((w) => game.night.wolfVotes.has(w.jid));
    const seersDone = seers.length === 0 || game.night.seerDone;
    const doctorsDone = doctors.length === 0 || game.night.doctorDone;
    const killersDone = killers.length === 0 || game.night.skDone;
    if (wolvesDone && seersDone && doctorsDone && killersDone) {
      setTimeout(() => {
        if (game.phase === 'night') this.resolveNight(game);
      }, 5000);
    }
  }

  async resolveNight(game) {
    this.clearTimer(game);
    const night = game.night;
    // hanya suara serigala yang masih hidup & target valid yang dihitung
    const validVotes = new Map();
    for (const [v, t] of night.wolfVotes) {
      const voter = game.players.get(v);
      const target = game.players.get(t);
      if (voter && voter.alive && voter.role === 'serigala' && target && target.alive && target.role !== 'serigala') {
        validVotes.set(v, t);
      }
    }
    let targetJid = this.plurality(validVotes);
    let protectedJid = night.doctorTarget;
    const dp = protectedJid && game.players.get(protectedJid);
    if (!dp || !dp.alive) protectedJid = null;

    // Target serial killer (bisa siapa pun, termasuk serigala)
    let skTargetJid = night.skTarget;
    const skp = skTargetJid && game.players.get(skTargetJid);
    const skAlive = this.alivePlayers(game).some((p) => p.role === 'sk');
    if (!skAlive || !skp || !skp.alive) skTargetJid = null;

    const isProtected = (jid) => jid && jid === protectedJid;
    const deaths = []; // {player, cause: 'serigala'|'sk'}

    if (targetJid && !isProtected(targetJid)) {
      const korban = game.players.get(targetJid);
      if (korban && korban.alive) deaths.push({ player: korban, cause: 'serigala' });
    }
    if (skTargetJid && !isProtected(skTargetJid)) {
      const korban = game.players.get(skTargetJid);
      // jangan bunuh dua kali kalau sama dengan korban serigala
      if (korban && korban.alive && !deaths.some((d) => d.player.jid === korban.jid)) {
        deaths.push({ player: korban, cause: 'sk' });
      }
    }

    const blockedWolf = targetJid && isProtected(targetJid);
    const blockedSk = skTargetJid && isProtected(skTargetJid);

    if (deaths.length === 0) {
      if (blockedWolf || blockedSk) {
        await this.send(game.chatId, '☀️ *Pagi hari...*\n\n💉 Serangan malam ini berhasil DIGAGALKAN oleh dokter!');
        await this.notifyMod(game, 'Pagi: serangan digagalkan dokter. Tidak ada korban.');
      } else {
        await this.send(game.chatId, '☀️ *Pagi hari...*\n\nMalam yang tenang. Tidak ada korban.');
        await this.notifyMod(game, 'Pagi: malam tenang, tidak ada korban.');
      }
    } else {
      for (const d of deaths) {
        d.player.alive = false;
        const causeText = d.cause === 'sk' ? '🔪 dibunuh secara misterius' : 'ditemukan tak bernyawa';
        await this.sendElimination(
          game,
          d.player,
          `☀️ *Pagi hari...*\n\n😱 ${this.disp(game, d.player)} ${causeText}! Ia adalah *${this.ROLE_LABEL[d.player.role]}*.`
        );
        await this.notifyMod(game, `Pagi: ${d.player.name} mati (${d.cause}) — ia ${this.ROLE_LABEL[d.player.role]}.`);
      }
    }

    const winner = this.checkWinner(game);
    if (winner) return this.endGame(game, winner);
    await this.startDiscuss(game);
  }

  // ============================================================ mode tes solo
  async cmdTes(chatId, sender, name, args, m) {
    if (this.isGroup(chatId)) {
      return this.send(chatId, 'Mode tes hanya di *DM* (chat pribadi dengan bot).');
    }
    const cur = this.getGame(chatId);
    if (cur && cur.phase !== 'ended') {
      return this.send(chatId, 'Sesi tes sudah berjalan. Ketik *.ww stop* untuk berhenti.');
    }
    let n = parseInt(args[0], 10);
    if (!n || n < 2) n = 8;
    if (n > 12) n = 12;

    const game = {
      chatId, creator: sender, phase: 'lobby',
      players: new Map(), day: 0, timer: null, night: null,
      votes: new Map(), isTest: true, testUser: sender, testAccused: {},
    };
    game.players.set(sender, { jid: sender, name, role: 'warga', alive: true });
    const names = [...this.TEST_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 1; i < n; i++) {
      const jid = `wwtest_${Date.now()}_${i}@test`;
      game.players.set(jid, { jid, name: names[(i - 1) % names.length], role: 'warga', alive: true });
    }
    const roles = this.makeRoles(n);
    [...game.players.values()].forEach((p, i) => { p.role = roles[i]; });
    this.games.set(chatId, game);

    const me = game.players.get(sender);
    const others = [...game.players.values()].filter((p) => p.jid !== sender).map((p) => p.name).join(', ');
    await this.dm(
      sender,
      `🎮 *SESI TES dimulai!* (${n} pemain: kamu + ${n - 1} bot)\n\n${this.ROLE_LABEL[me.role]}\n\n${this.ROLE_DESC[me.role]}\n\nPemain lain: ${others}\n\nKetik *.ww stop* untuk berhenti kapan saja.`
    );
    game.day = 1;
    await this.startNight(game);
  }

  async cmdStop(chatId, sender) {
    const game = this.getGame(chatId);
    if (!game || !game.isTest || game.phase === 'ended') {
      return this.send(chatId, 'Tidak ada sesi tes yang berjalan.');
    }
    if (sender !== game.testUser) return;
    this.clearTimer(game);
    game.phase = 'ended';
    await this.send(chatId, '⏹️ Sesi tes dihentikan.');
  }

  async startTestNight(game) {
    game.phase = 'night';
    game.votes = new Map();
    const alive = this.alivePlayers(game);
    const nonWolves = alive.filter((p) => p.role !== 'serigala');
    game.night = {
      targets: nonWolves,
      allTargets: alive,
      seerTargets: [],
      wolfVotes: new Map(),
      seerDone: false,
      doctorDone: false,
      doctorTarget: null,
      skTarget: null,
      skDone: false,
    };
    const me = game.players.get(game.testUser);

    if (me.role === 'serigala') {
      await this.dm(me.jid, `🌙 *MALAM ${game.day}*\nPilih warga untuk dimangsa.\nBalas: *.ww mangsa <nomor>*\n\n${this.numberedList(nonWolves)}`);
    } else if (me.role === 'dukun') {
      const list = alive.filter((p) => p.jid !== me.jid);
      game.night.seerTargets = list;
      await this.dm(me.jid, `🌙 *MALAM ${game.day}*\nPilih pemain untuk diterawang.\nBalas: *.ww terawang <nomor>* (atau *.ww terawang 0* untuk lewati)\n\n${this.numberedList(list)}`);
    } else if (me.role === 'dokter') {
      await this.dm(me.jid, `🌙 *MALAM ${game.day}*\nPilih pemain untuk dilindungi.\nBalas: *.ww lindungi <nomor>* (atau *.ww lindungi 0* untuk lewati)\n\n${this.numberedList(alive)}`);
    } else if (me.role === 'sk') {
      await this.dm(me.jid, `🌙 *MALAM ${game.day}*\nPilih SIAPA PUN untuk dibunuh.\nBalas: *.ww bunuh <nomor>*\n\n${this.numberedList(alive)}`);
    } else {
      await this.dm(me.jid, `🌙 *MALAM ${game.day}*\nKamu warga biasa — tidur aja 😴\n\nPemain bot sedang beraksi...`);
    }

    await this.send(game.chatId, `🌙 *Malam ${game.day} tiba...* (${this.TEST_NIGHT_MS / 1000} detik)`);
    this.testAutoNight(game);

    this.clearTimer(game);
    game.timer = setTimeout(() => {
      if (game.phase === 'night') this.resolveNight(game);
    }, this.TEST_NIGHT_MS);
  }

  testAutoNight(game) {
    const night = game.night;
    const isUser = (p) => p.jid === game.testUser;
    const fakeWolves = this.aliveWolves(game).filter((p) => !isUser(p));
    const fakeSeers = this.alivePlayers(game).filter((p) => p.role === 'dukun' && !isUser(p));
    const fakeDoctors = this.alivePlayers(game).filter((p) => p.role === 'dokter' && !isUser(p));
    const fakeKillers = this.alivePlayers(game).filter((p) => p.role === 'sk' && !isUser(p));
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const delay = () => 4000 + Math.random() * 12000;

    for (const w of fakeWolves) {
      setTimeout(() => {
        if (game.phase !== 'night') return;
        const t = rnd(night.targets.filter((p) => p.alive));
        if (t) night.wolfVotes.set(w.jid, t.jid);
        this.maybeFastResolve(game);
      }, delay());
    }
    for (const s of fakeSeers) {
      setTimeout(() => {
        if (game.phase !== 'night') return;
        night.seerDone = true;
        this.maybeFastResolve(game);
      }, delay());
    }
    for (const d of fakeDoctors) {
      setTimeout(() => {
        if (game.phase !== 'night') return;
        const t = rnd(this.alivePlayers(game));
        if (t) night.doctorTarget = t.jid;
        night.doctorDone = true;
        this.maybeFastResolve(game);
      }, delay());
    }
    for (const k of fakeKillers) {
      setTimeout(() => {
        if (game.phase !== 'night') return;
        const t = rnd(this.alivePlayers(game).filter((p) => p.jid !== k.jid));
        if (t) night.skTarget = t.jid;
        night.skDone = true;
        this.maybeFastResolve(game);
      }, delay());
    }
  }

  async startTestDiscuss(game) {
    game.phase = 'discuss';
    const alive = this.alivePlayers(game);
    await this.send(
      game.chatId,
      `💬 *Diskusi dimulai!* (${this.TEST_DISCUSS_MS / 1000} detik)\n\nYang masih hidup:\n${this.numberedList(alive)}\n\nPara pemain bot berdiskusi...`
    );
    const fakes = alive.filter((p) => p.jid !== game.testUser);
    const templates = [
      (b) => `Aku curiga sama ${b}... tadi malam dia online terus 👀`,
      (b) => `${b} diem-diem bae dari tadi, mencurigakan!`,
      (b) => `Firasatku bilang ${b} serigalanya. Voting dia aja!`,
      (b) => `Jangan percaya ${b}, dia terlalu kalem...`,
      (b) => `Aku tadi mimpi ${b} jadi serigala 🐺`,
    ];
    const shuffled = [...fakes].sort(() => Math.random() - 0.5);
    const n = Math.min(3, shuffled.length);
    for (let i = 0; i < n; i++) {
      const speaker = shuffled[i];
      const candidates = alive.filter((p) => p.jid !== speaker.jid);
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      if (!speaker || !target) continue;
      game.testAccused[target.jid] = (game.testAccused[target.jid] || 0) + 1;
      const msg = templates[Math.floor(Math.random() * templates.length)](target.name);
      setTimeout(() => {
        if (game.phase === 'discuss') this.send(game.chatId, `💬 *${speaker.name}:* ${msg}`);
      }, 6000 + i * 11000 + Math.random() * 4000);
    }
    this.clearTimer(game);
    game.timer = setTimeout(() => {
      if (game.phase === 'discuss') this.startVote(game);
    }, this.TEST_DISCUSS_MS);
  }

  async startTestVote(game) {
    game.phase = 'vote';
    game.votes = new Map();
    game.voteTargets = this.alivePlayers(game);
    await this.send(
      game.chatId,
      `🗳️ *VOTING!* (${this.TEST_VOTE_MS / 1000} detik)\nBalas: *.ww vote <nomor>*\n\n${this.numberedList(game.voteTargets)}`
    );
    this.testAutoVote(game);
    this.clearTimer(game);
    game.timer = setTimeout(() => {
      if (game.phase === 'vote') this.resolveVote(game);
    }, this.TEST_VOTE_MS);
  }

  testAutoVote(game) {
    const fakes = this.alivePlayers(game).filter((p) => p.jid !== game.testUser);
    let accused = null;
    let best = 0;
    for (const [jid, c] of Object.entries(game.testAccused || {})) {
      const p = game.players.get(jid);
      if (p && p.alive && c > best) { best = c; accused = jid; }
    }
    for (const f of fakes) {
      setTimeout(() => {
        if (game.phase !== 'vote') return;
        const opts = game.voteTargets.filter((p) => p.alive && p.jid !== f.jid);
        if (!opts.length) return;
        const acc = accused && game.players.get(accused);
        let pick;
        if (acc && acc.alive && acc.jid !== f.jid && Math.random() < 0.45) {
          pick = acc;
        } else {
          pick = opts[Math.floor(Math.random() * opts.length)];
        }
        game.votes.set(f.jid, pick.jid);
      }, 5000 + Math.random() * 15000);
    }
  }

  // ============================================================ siang
  async startDiscuss(game) {
    if (game.isTest) return this.startTestDiscuss(game);
    game.phase = 'discuss';
    const alive = this.alivePlayers(game);
    const mentions = alive.map((p) => p.jid);
    await this.send(
      game.chatId,
      `💬 *Diskusi dimulai!* (${this.DISCUSS_MS / 60000} menit)\n\nYang masih hidup:\n${this.numberedList(alive)}\n\nCari tahu siapa serigalanya, lalu kita voting!`,
      mentions
    );
    this.clearTimer(game);
    game.timer = setTimeout(() => {
      if (game.phase === 'discuss') this.startVote(game);
    }, this.DISCUSS_MS);
  }

  async startVote(game) {
    if (game.isTest) return this.startTestVote(game);
    game.phase = 'vote';
    game.votes = new Map();
    game.voteTargets = this.alivePlayers(game);
    await this.send(
      game.chatId,
      `🗳️ *VOTING!* (${this.VOTE_MS / 1000} detik)\nBalas: *.ww vote <nomor>*\n\n${this.numberedList(game.voteTargets)}`
    );
    this.clearTimer(game);
    game.timer = setTimeout(() => {
      if (game.phase === 'vote') this.resolveVote(game);
    }, this.VOTE_MS);
  }

  async cmdVote(chatId, sender, name, args, m) {
    const game = this.getGame(chatId);
    if (!this.isGroup(chatId) && !(game && game.isTest)) {
      return this.send(chatId, 'Voting dilakukan di grup.');
    }
    if (!game || game.phase !== 'vote') return this.send(chatId, 'Tidak ada voting yang aktif.');
    const p = game.players.get(sender);
    if (!p || !p.alive) return this.send(chatId, 'Kamu tidak bisa voting.');
    const num = parseInt(args[0], 10);
    const target = game.voteTargets[num - 1];
    if (!target || target.jid === sender) {
      return this.send(chatId, `Nomor tidak valid! Pilih 1-${game.voteTargets.length} (tidak boleh diri sendiri).`);
    }
    game.votes.set(sender, target.jid);
    // tampilkan perolehan sementara
    const counts = {};
    for (const t of game.votes.values()) counts[t] = (counts[t] || 0) + 1;
    const tally = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([jid, c]) => `• ${game.players.get(jid).name}: ${c}`)
      .join('\n');
    await this.send(chatId, `✅ ${name} vote *${target.name}*.\n\n*Perolehan sementara:*\n${tally}`);
  }

  async resolveVote(game) {
    this.clearTimer(game);
    const valid = new Map();
    for (const [v, t] of game.votes) {
      const voter = game.players.get(v);
      const target = game.players.get(t);
      if (voter && voter.alive && target && target.alive && t !== v) valid.set(v, t);
    }
    const targetJid = this.plurality(valid);
    if (targetJid) {
      const t = game.players.get(targetJid);
      t.alive = false;
      let count = 0;
      for (const x of valid.values()) if (x === targetJid) count++;
      await this.sendElimination(
        game,
        t,
        `⚖️ Hasil voting: ${this.disp(game, t)} tersingkir dengan ${count} suara.\nIa adalah *${this.ROLE_LABEL[t.role]}*.`
      );
      await this.notifyMod(game, `Voting: ${t.name} tersingkir (${count} suara) — ia ${this.ROLE_LABEL[t.role]}.`);
    } else {
      await this.send(game.chatId, '⚖️ Voting seri / tidak ada suara — tidak ada yang tersingkir.');
      await this.notifyMod(game, 'Voting: seri, tidak ada yang tersingkir.');
    }
    const winner = this.checkWinner(game);
    if (winner) return this.endGame(game, winner);
    game.day += 1;
    await this.startNight(game);
  }

  async endGame(game, winner) {
    this.clearTimer(game);
    this.clearPhotos(game);
    game.phase = 'ended';
    const lines = [...game.players.values()].map(
      (p) => `${p.alive ? '✅' : '💀'} ${p.name} — ${this.ROLE_LABEL[p.role]}`
    );
    const head =
      winner === 'serigala'
        ? '🐺 *SERIGALA MENANG!* Mereka berhasil menguasai desa.'
        : winner === 'sk'
        ? '🔪 *SERIAL KILLER MENANG!* Dia satu-satunya yang tersisa hidup...'
        : '🧑 *WARGA MENANG!* Semua serigala dan serial killer telah tersingkir.';
    await this.send(game.chatId, `${head}\n\n*Daftar peran:*\n${lines.join('\n')}`);
    await this.notifyMod(
      game,
      winner === 'serigala'
        ? 'Game selesai: 🐺 SERIGALA menang.'
        : winner === 'sk'
        ? 'Game selesai: 🔪 SERIAL KILLER menang.'
        : 'Game selesai: 🧑 WARGA menang.'
    );
  }
}

module.exports = WerewolfFeature;
