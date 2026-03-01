module.exports = {
  ownerNumbers: [
    "6283895937947",
    "85223980822",
    "085223980822",
    "6285223980822",
    "+6285223980822",
    "118043099291698",
    "5223980822",
    "34608896852125"
  ], // Array untuk multiple owners
  ownerPrefix: '!',
  userPrefix: '.',
  
  // Whitelist grup - Bot hanya jalan di grup ini
  // Kosongkan array [] untuk jalan di semua grup
  allowedGroups: [
    "120363301704602445@g.us",
    "120363348979901182@g.us",
    "120363024842336565@g.us",
    "120363030582115088@g.us",
    // Tambahkan ID grup baru di bawah ini (jangan lupa koma)
    // "ID_GRUP_BARU@g.us",
  ],
  
  // Mode whitelist: true = hanya grup di allowedGroups, false = semua grup
  useWhitelist: true
};