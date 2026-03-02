require('dotenv').config({
  path: __dirname + '/.env'
});
const OpenAI = require('openai');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const config = require('./config/config');
const Helper = require('./utils/helper');
const OwnerUtils = require('./utils/OwnerUtils');

// Store contacts and messages
const store = { contacts: {}, messages: {}, deletedMessages: [] };

// Load store
if (fs.existsSync('./baileys_store.json')) {
  try {
    const data = JSON.parse(fs.readFileSync('./baileys_store.json', 'utf-8'));
    store.contacts = data.contacts || {};
    store.messages = data.messages || {};
    store.deletedMessages = data.deletedMessages || [];
    console.log('[STORE] Loaded', Object.keys(store.contacts).length, 'contacts');
    console.log('[STORE] Loaded', Object.keys(store.messages).length, 'chats with messages');
  } catch (e) {
    console.log('Failed to load store');
  }
}

// Save store every 10 seconds
setInterval(() => {
  fs.writeFileSync('./baileys_store.json', JSON.stringify(store, null, 2));
}, 10_000);

// Load features
const features = Helper.loadFeatures();
console.log(`📦 Loaded ${features.size} features`);

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['BOTWA-WAHYUDRTMA', 'Chrome', '3.0'],
    markOnlineOnConnect: true
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('📱 Scan QR code!');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('🚀 BOTWA WAHYUDRTMA ready!');
      console.log(`👑 Owners: ${config.ownerNumbers.join(', ')}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Track bot start time and processed messages
  const botStartTime = Date.now();
  const processedMessages = new Set();
  let isReady = false;

  // Mark bot as ready after 10 seconds
  setTimeout(() => {
    isReady = true;
    console.log('✅ Bot ready to receive commands!');
  }, 10000);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      const m = messages[0];
      if (!m.message) return;
      
      const msgId = m.key.id;
      const isFromMe = m.key.fromMe;
      const messageTime = m.messageTimestamp * 1000;
      
      // Skip old messages during startup (before bot is ready)
      if (!isReady && type === 'append') {
        return;
      }
      
      console.log('[MSG] Received:', msgId, '| FromMe:', isFromMe, '| Type:', type);
      
      // Skip if already processed
      if (processedMessages.has(msgId)) {
        console.log('[MSG] Already processed, skipping');
        return;
      }
      
      // Mark as processed
      processedMessages.add(msgId);
      
      // Clean old processed messages (keep last 1000)
      if (processedMessages.size > 1000) {
        const arr = Array.from(processedMessages);
        processedMessages.clear();
        arr.slice(-500).forEach(id => processedMessages.add(id));
      }
      
      // Store message for anti-delete
      const chatId = m.key.remoteJid;
      if (!store.messages[chatId]) store.messages[chatId] = {};
      
      const msgText = m.message.conversation || 
                      m.message.extendedTextMessage?.text || 
                      m.message.imageMessage?.caption ||
                      m.message.videoMessage?.caption || '';
      
      console.log('[MSG] Text:', msgText);
      console.log('[MSG] Message keys:', Object.keys(m.message));
      
      // Handle deleted message (protocolMessage)
      if (m.message.protocolMessage?.type === 0) {
        console.log('[ANTIDELETE] Delete detected!');
        const deletedMsgId = m.message.protocolMessage.key.id;
        const chatId = m.key.remoteJid;
        
        console.log('[ANTIDELETE] Looking for:', deletedMsgId, 'in chat:', chatId);
        
        if (store.messages[chatId]?.[deletedMsgId]) {
          const deletedMsg = store.messages[chatId][deletedMsgId];
          const senderName = deletedMsg.pushName || 'Unknown';
          
          console.log('[ANTIDELETE] Found! Sender:', senderName, '| Content:', deletedMsg.content);
          
          store.messages[chatId][deletedMsgId].deleted = true;
          store.messages[chatId][deletedMsgId].deletedAt = Date.now();
          
          store.deletedMessages.unshift({
            chatId: chatId,
            senderName: senderName,
            text: deletedMsg.content || '[Media]',
            time: new Date(deletedMsg.timestamp * 1000).toLocaleString('id-ID'),
            deletedTime: new Date().toLocaleString('id-ID')
          });
          
          if (store.deletedMessages.length > 100) {
            store.deletedMessages.pop();
          }
          
          fs.writeFileSync('./baileys_store.json', JSON.stringify(store, null, 2));
          
          console.log('[ANTIDELETE] Message saved to history (silent mode)');
        } else {
          console.log('[ANTIDELETE] Message not found in store');
        }
        
        return; // Stop processing this message
      }
      
      // Get message content
      let msgContent = msgText;
      if (m.message.imageMessage) msgContent = '[Gambar]';
      else if (m.message.videoMessage) msgContent = '[Video]';
      else if (m.message.stickerMessage) msgContent = '[Sticker]';
      else if (m.message.audioMessage) msgContent = '[Audio]';
      else if (m.message.documentMessage) msgContent = '[Dokumen]';
      
      store.messages[chatId][msgId] = {
        message: m.message,
        sender: m.key.participant || m.key.remoteJid,
        pushName: m.pushName,
        timestamp: m.messageTimestamp,
        content: msgContent,
        deleted: false
      };
      
      const body = msgText.trim();
      const rawSender = m.key.participant || m.key.remoteJid;
      
      console.log('[CMD] Body:', JSON.stringify(body), '| Length:', body.length, '| FirstChar:', body.charCodeAt(0), '| FromMe:', isFromMe, '| Sender:', rawSender);
      
      // Save contacts
      if (!isFromMe && rawSender && m.pushName) {
        if (!store.contacts[rawSender] || store.contacts[rawSender].name !== m.pushName) {
          store.contacts[rawSender] = { id: rawSender, name: m.pushName };
        }
      }
      
      // Check if owner
      const isOwner = isFromMe || config.ownerNumbers.some(ownerNum => {
        const cleanSender = rawSender.replace(/@[^@]*$/g, '');
        const cleanOwner = ownerNum.replace(/[+]/g, '');
        
        return cleanSender === ownerNum || 
               cleanSender === cleanOwner ||
               cleanSender.endsWith(ownerNum) ||
               cleanSender.endsWith(cleanOwner) ||
               ownerNum.endsWith(cleanSender) ||
               cleanOwner.endsWith(cleanSender);
      });
      
      console.log('[CMD] IsOwner:', isOwner, '| OwnerPrefix:', config.ownerPrefix, '| UserPrefix:', config.userPrefix);
      
      // Skip empty messages
      if (!body) {
        console.log('[CMD] Empty body, skipping');
        return;
      }
      
      // Check whitelist for groups (except for owner's !groupinfo command)
      const isGroupInfoCommand = body.toLowerCase() === '!groupinfo';
      if (chatId.endsWith('@g.us') && config.useWhitelist && !isGroupInfoCommand) {
        if (!config.allowedGroups.includes(chatId)) {
          console.log('[CMD] Group not in whitelist, skipping');
          return;
        }
      }
      
      // Handle AI chat with 'wahyu' keyword or .ai command
      if (body.toLowerCase().startsWith('wahyu') || body.toLowerCase().startsWith('.ai ')) {
        console.log('[CMD] AI command detected');
        const aiFeature = features.get('ai');
        if (aiFeature) {
          await aiFeature.execute(m, sock, body);
        }
        return;
      }
      
      // Handle commands
      if (body.startsWith(config.ownerPrefix) && isOwner) {
        console.log('[CMD] Owner command detected');
        const command = body.slice(1).split(' ')[0].toLowerCase();
        console.log('[CMD] Command:', command);
        const feature = features.get(command);
        console.log('[CMD] Feature found:', !!feature);
        if (feature && feature.ownerOnly) {
          await feature.execute(m, sock);
        }
      } else if (body.startsWith(config.userPrefix)) {
        console.log('[CMD] User command detected');
        const command = body.slice(1).split(' ')[0].toLowerCase();
        console.log('[CMD] Command:', command);
        const feature = features.get(command);
        console.log('[CMD] Feature found:', !!feature);
        if (feature && !feature.ownerOnly) {
          await feature.execute(m, sock);
        }
      } else {
        console.log('[CMD] No prefix detected. Body starts with:', body.substring(0, 3));
      }
      
    } catch (error) {
      console.error('Message Handler Error:', error.message);
    }
  });

  // Handle deleted messages
  sock.ev.on('messages.update', async (updates) => {
    try {
      // Skip status updates
      if (updates.length > 0 && updates[0].key?.remoteJid === 'status@broadcast') {
        return;
      }
      
      console.log('[ANTIDELETE] Update received:', updates.length);
      
      for (const update of updates) {
        console.log('[ANTIDELETE] Update type:', JSON.stringify(update.update));
        
        // Check if message was deleted
        if (update.update.message?.protocolMessage?.type === 0) {
          const chatId = update.key.remoteJid;
          const deletedMsgId = update.update.message.protocolMessage.key.id;
          
          console.log('[ANTIDELETE] Message deleted! Chat:', chatId, '| ID:', deletedMsgId);
          
          if (store.messages[chatId]?.[deletedMsgId]) {
            const deletedMsg = store.messages[chatId][deletedMsgId];
            const senderName = deletedMsg.pushName || 'Unknown';
            
            console.log('[ANTIDELETE] Found in store! Sender:', senderName, '| Content:', deletedMsg.content);
            
            store.messages[chatId][deletedMsgId].deleted = true;
            store.messages[chatId][deletedMsgId].deletedAt = Date.now();
            
            store.deletedMessages.unshift({
              chatId: chatId,
              senderName: senderName,
              text: deletedMsg.content || '[Media]',
              time: new Date(deletedMsg.timestamp * 1000).toLocaleString('id-ID'),
              deletedTime: new Date().toLocaleString('id-ID')
            });
            
            if (store.deletedMessages.length > 100) {
              store.deletedMessages.pop();
            }
            
            fs.writeFileSync('./baileys_store.json', JSON.stringify(store, null, 2));
            
            console.log('[ANTIDELETE] Message saved to history (silent mode)');
          } else {
            console.log('[ANTIDELETE] Message not found in store');
          }
        }
      }
    } catch (error) {
      console.error('[ANTIDELETE] Error:', error.message);
      console.error('[ANTIDELETE] Stack:', error.stack);
    }
  });
}

connectToWhatsApp();

// Clean old messages every hour
setInterval(() => {
  for (const chatId in store.messages) {
    const messages = store.messages[chatId];
    const now = Date.now();
    for (const msgId in messages) {
      const msg = messages[msgId];
      if (msg.timestamp && (now - msg.timestamp * 1000) > 24 * 60 * 60 * 1000) {
        delete messages[msgId];
      }
    }
  }
  console.log('[CLEANUP] Old messages cleaned');
}, 60 * 60 * 1000);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
