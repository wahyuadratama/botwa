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
 */
class WerewolfFeature {
  constructor() {
    this.name = 'ww';
    this.description = 'Game Werewolf otomatis';
    this.ownerOnly = false;

    this.games = new Map(); // groupJid -> game
    this.sock = null;

    this.MIN_PLAYERS = 7;
    this.MAX_PLAYERS = 30;
    this.NIGHT_MS = 120000;
    this.DISCUSS_MS = 300000;
    this.VOTE_MS = 90000;
    this.DM_DELAY_MS = 700;

    this.ROLE_LABEL = {
      serigala: '🐺 Serigala',
      dukun: '🔮 Dukun',
      dokter: '💉 Dokter',
      warga: '🧑 Warga',
    };
    this.ROLE_DESC = {
      serigala:
        'Kamu SERIGALA. Setiap malam, pilih satu warga untuk dimangsa dengan:\n.ww mangsa <nomor>\nSuara terbanyak di antara para serigala yang jadi korban. Jangan sampai ketahuan!',
      dukun:
        'Kamu DUKUN. Setiap malam kamu boleh menerawang SATU pemain:\n.ww terawang <nomor>\natau lewati dengan:\n.ww terawang 0',
      dokter:
        'Kamu DOKTER. Setiap malam kamu boleh melindungi SATU pemain (termasuk dirimu):\n.ww lindungi <nomor>\natau lewati dengan:\n.ww lindungi 0',
      warga:
        'Kamu WARGA biasa. Malam hari kamu tidur. Siang hari, diskusikan dan votinglah untuk menyingkirkan serigala yang bersembunyi di antara kalian!',
    };
  }

  // ============================================================ util
  getText(m) {
    return (
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
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
    const wolves = Math.max(2, Math.floor(n / 5));
    const roles = Array(wolves).fill('serigala');
    roles.push('dukun');
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
    const wolves = this.aliveWolves(game).length;
    const others = this.alivePlayers(game).length - wolves;
    if (wolves === 0) return 'warga';
    if (wolves >= others) return 'serigala';
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
        case 'baru': return this.cmdBaru(chatId, sender, m);
        case 'join': return this.cmdJoin(chatId, sender, name, m);
        case 'mulai': return this.cmdMulai(chatId, m);
        case 'batal': return this.cmdBatal(chatId, sender, m);
        case 'status': return this.cmdStatus(chatId, m);
        case 'vote': return this.cmdVote(chatId, sender, name, args, m);
        case 'mangsa': return this.nightAction(sender, 'serigala', args, m);
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

  // ============================================================ perintah grup
  async cmdBantu(chatId, m) {
    const inGroup = this.isGroup(chatId);
    await this.send(
      chatId,
      '🐺 *WEREWOLF — Panduan*\n\n' +
        (inGroup
          ? '*Di grup:*\n.ww baru — buka lobby\n.ww join — ikut main\n.ww mulai — mulai (min. 7 pemain)\n.ww vote <nomor> — voting siang\n.ww status — status game\n.ww batal — batalkan (pembuat lobby)\n\n*Di DM (chat pribadi bot):*\n.ww mangsa <nomor> — serigala pilih korban\n.ww terawang <nomor> — dukun terawang (0 = lewati)\n.ww lindungi <nomor> — dokter lindungi (0 = lewati)\n\n'
          : '*Di DM:*\n.ww mangsa <nomor> — (serigala) pilih korban\n.ww terawang <nomor> — (dukun) terawang peran, 0 = lewati\n.ww lindungi <nomor> — (dokter) lindungi, 0 = lewati\n\n') +
        'Alur: lobby → peran via DM → 🌙 malam → ☀️ pagi → 💬 diskusi → 🗳️ voting → ulangi.\n' +
        'Warga menang jika semua serigala tersingkir. Serigala menang jika jumlah mereka ≥ sisa warga.',
      null
    );
  }

  async cmdBaru(chatId, sender, m) {
    if (!this.isGroup(chatId)) {
      return this.send(chatId, 'Buat game di grup, bukan di chat pribadi. Ketik *.ww bantu* untuk panduan.');
    }
    const cur = this.getGame(chatId);
    if (cur && cur.phase !== 'ended') {
      return this.send(chatId, 'Di grup ini sudah ada game yang berjalan.');
    }
    this.games.set(chatId, {
      chatId, creator: sender, phase: 'lobby',
      players: new Map(), day: 0, timer: null, night: null, votes: new Map(),
    });
    await this.send(
      chatId,
      `🐺 *LOBBY WEREWOLF dibuka!*\n\nKetik *.ww join* untuk ikut (min. ${this.MIN_PLAYERS} pemain).\nPembuat lobby mengetik *.ww mulai* kalau sudah siap.\n\n⚠️ Pastikan nomor bot ini tidak dibisukan supaya DM peran masuk!`
    );
  }

  async cmdJoin(chatId, sender, name, m) {
    if (!this.isGroup(chatId)) return this.send(chatId, 'Join dilakukan di grup game. Ketik *.ww bantu* untuk panduan.');
    const game = this.getGame(chatId);
    if (!game || game.phase !== 'lobby') {
      return this.send(chatId, 'Belum ada lobby. Buat dulu dengan *.ww baru*.');
    }
    if (game.players.has(sender)) return this.send(chatId, 'Kamu sudah ikut.');
    if (game.players.size >= this.MAX_PLAYERS) {
      return this.send(chatId, `Lobby penuh (maks. ${this.MAX_PLAYERS}).`);
    }
    game.players.set(sender, { jid: sender, name, role: 'warga', alive: true });
    await this.send(chatId, `✅ ${name} ikut main! (${game.players.size} pemain)`);
  }

  async cmdBatal(chatId, sender, m) {
    const game = this.getGame(chatId);
    if (!game || game.phase === 'ended') return this.send(chatId, 'Tidak ada game yang berjalan.');
    const isOwner = m.key.fromMe; // owner juga bisa via isFromMe; sederhana: creator saja
    if (sender !== game.creator && !isOwner) {
      return this.send(chatId, 'Hanya pembuat lobby yang bisa membatalkan.');
    }
    this.clearTimer(game);
    game.phase = 'ended';
    await this.send(chatId, 'Game dibatalkan.');
  }

  async cmdStatus(chatId, m) {
    const game = this.getGame(chatId);
    if (!game) return this.send(chatId, 'Belum ada game di sini.');
    const alive = this.alivePlayers(game).length;
    await this.send(chatId, `🐺 Status: fase *${game.phase}*, hari ke-${game.day}\nPemain hidup: ${alive}/${game.players.size}`);
  }

  async cmdMulai(chatId, m) {
    if (!this.isGroup(chatId)) return this.send(chatId, 'Mulai game dari grup.');
    const game = this.getGame(chatId);
    if (!game || game.phase !== 'lobby') return this.send(chatId, 'Belum ada lobby yang dibuka.');
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
    const mentions = players.map((p) => p.jid);
    await this.send(
      chatId,
      `🎮 Game dimulai! ${players.size} pemain.\nPeran sudah dikirim via DM masing-masing. Jaga rahasiamu! 🤫\n\n` +
        players.map((p) => this.mentionOf(p.jid)).join(' '),
      mentions
    );
    await this.startNight(game);
  }

  // ============================================================ malam
  async startNight(game) {
    game.phase = 'night';
    game.votes = new Map();
    const alive = this.alivePlayers(game);
    const nonWolves = alive.filter((p) => p.role !== 'serigala');
    game.night = {
      targets: nonWolves, // urutan bernomor untuk serigala
      allTargets: alive,  // urutan bernomor untuk dukun/dokter
      wolfVotes: new Map(),
      seerDone: false,
      doctorDone: false,
      doctorTarget: null,
    };

    const wolves = this.aliveWolves(game);
    const seers = alive.filter((p) => p.role === 'dukun');
    const doctors = alive.filter((p) => p.role === 'dokter');

    for (const w of wolves) {
      await this.dm(
        w.jid,
        `🌙 *MALAM ${game.day}*\nPilih warga untuk dimangsa.\nBalas: *.ww mangsa <nomor>*\n\n${this.numberedList(nonWolves)}`
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
    const wolvesDone = wolves.length > 0 && wolves.every((w) => game.night.wolfVotes.has(w.jid));
    const seersDone = seers.length === 0 || game.night.seerDone;
    const doctorsDone = doctors.length === 0 || game.night.doctorDone;
    if (wolvesDone && seersDone && doctorsDone) {
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

    const korban = targetJid && game.players.get(targetJid);
    if (korban && korban.jid === protectedJid) {
      await this.send(game.chatId, '☀️ *Pagi hari...*\n\n💉 Serangan serigala malam ini berhasil DIGAGALKAN oleh dokter!');
    } else if (korban) {
      korban.alive = false;
      await this.send(
        game.chatId,
        `☀️ *Pagi hari...*\n\n😱 ${this.mentionOf(korban.jid)} ditemukan tak bernyawa! Ia adalah *${this.ROLE_LABEL[korban.role]}*.`,
        [korban.jid]
      );
    } else {
      await this.send(game.chatId, '☀️ *Pagi hari...*\n\nMalam yang tenang. Tidak ada korban.');
    }

    const winner = this.checkWinner(game);
    if (winner) return this.endGame(game, winner);
    await this.startDiscuss(game);
  }

  // ============================================================ siang
  async startDiscuss(game) {
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
    if (!this.isGroup(chatId)) return this.send(chatId, 'Voting dilakukan di grup.');
    const game = this.getGame(chatId);
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
      await this.send(
        game.chatId,
        `⚖️ Hasil voting: ${this.mentionOf(t.jid)} tersingkir dengan ${count} suara.\nIa adalah *${this.ROLE_LABEL[t.role]}*.`,
        [t.jid]
      );
    } else {
      await this.send(game.chatId, '⚖️ Voting seri / tidak ada suara — tidak ada yang tersingkir.');
    }
    const winner = this.checkWinner(game);
    if (winner) return this.endGame(game, winner);
    game.day += 1;
    await this.startNight(game);
  }

  async endGame(game, winner) {
    this.clearTimer(game);
    game.phase = 'ended';
    const lines = [...game.players.values()].map(
      (p) => `${p.alive ? '✅' : '💀'} ${p.name} — ${this.ROLE_LABEL[p.role]}`
    );
    const head =
      winner === 'serigala'
        ? '🐺 *SERIGALA MENANG!* Mereka berhasil menguasai desa.'
        : '🧑 *WARGA MENANG!* Semua serigala telah tersingkir.';
    await this.send(game.chatId, `${head}\n\n*Daftar peran:*\n${lines.join('\n')}`);
  }
}

module.exports = WerewolfFeature;
