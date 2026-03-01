const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

console.log("🔄 Memulai proses login ulang...\n");

// Hapus session lama
const authPath = "./auth_info_baileys";
if (fs.existsSync(authPath)) {
  console.log("🗑️  Menghapus session lama...");
  fs.rmSync(authPath, { recursive: true, force: true });
  console.log("✅ Session lama dihapus\n");
}

async function loginWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    browser: ["BOTWA-WAHYUDRTMA", "Chrome", "3.0"],
    markOnlineOnConnect: true,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 SCAN QR CODE DI BAWAH INI:\n");
      qrcode.generate(qr, { small: true });
      console.log("\n⏳ Menunggu scan...\n");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Koneksi terputus. Reason:", reason);

      if (reason === DisconnectReason.loggedOut) {
        console.log("⚠️  Logged out. Silakan jalankan ulang script ini.");
        process.exit(0);
      } else {
        console.log("🔄 Mencoba reconnect...");
        setTimeout(() => loginWhatsApp(), 3000);
      }
    } else if (connection === "open") {
      console.log("✅ LOGIN BERHASIL!");
      console.log("🚀 Bot siap digunakan!");
      console.log(
        "\n💡 Sekarang Anda bisa menjalankan bot dengan: npm start\n",
      );
      process.exit(0);
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

loginWhatsApp().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
