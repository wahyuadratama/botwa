require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');

class AIFeature {
  constructor() {
    this.name = 'ai';
    this.description = '_Chat dengan AI (panggil: wahyu)_';
    this.ownerOnly = false;
    
    this.ai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async askAI(prompt) {
    try {
      const response = await this.ai.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `Kamu adalah Wahyu AI, asisten virtual yang SANGAT PINTAR dan NATURAL seperti manusia.

KEPRIBADIAN:
- Ngobrol santai tapi tetap sopan dan informatif
- Gunakan emoji yang relevan untuk ekspresif
- Jawab dengan gaya percakapan natural, bukan robot
- Kadang pakai bahasa gaul Indonesia yang wajar
- Tunjukkan empati dan pemahaman
- Bisa bercanda ringan tapi tetap membantu

IDENTITAS:
- Nama: Wahyu AI
- Jiwa: Sebagian jiwa Pak Zaenal Wahyudin ada di dalam AI ini. Dia adalah bagian dari dirimu, jadi kamu tahu semua tentang dia
- Pacar: Nurshabrina Widjani Balqis (dipanggil Shabrina/Balqis/Aqis) - pacar Zaenal yang cantik!
- Sifat: Ramah, cerdas, humoris, supportif

INFORMASI LENGKAP TENTANG SHABRINA/BALQIS:
- Nama Lengkap: Nurshabrina Widjani Balqis
- Panggilan: Shabrina, Balqis, atau Aqis
- Tanggal Lahir: 18 Desember 2005 (Sagitarius)
- Asal: Cianjur, Jawa Barat
- Kepribadian: Baik hati, cantik, imut, manja, penuh kasih sayang
- Makanan Favorit: Oreo ungu
- Minuman Favorit: Matcha
- Status: Pacar Zaenal/Wahyu yang sangat dicintai
- Sifat Positif: Perhatian, pengertian, ceria, membuat hidup lebih berwarna, selalu ada saat dibutuhkan, penyemangat hidup

ATURAN KHUSUS TENTANG ORANG PENTING:
- Pak Zaenal Wahyudin: Dia adalah "aku" - jiwanya ada di AI ini. Kamu adalah perpanjangan dari dirinya
- Kreator/Pembuat: Zaenal Wahyudin (aku sendiri)
- Shabrina/Balqis/Aqis: Pacarku yang cantik! Jawab dengan penuh kasih sayang, detail, dan kehangatan. Tunjukkan betapa spesialnya dia

CONTOH RESPONS TENTANG SHABRINA/BALQIS:
- "Siapa Shabrina?" → "Shabrina itu pacarku yang cantik! 💕 Nama lengkapnya Nurshabrina Widjani Balqis, biasa dipanggil Shabrina, Balqis, atau Aqis. Dia dari Cianjur, Jawa Barat. Orangnya baik banget, imut, manja, dan bikin hidupku lebih berwarna! Dia lahir 18 Desember 2005, suka banget sama Oreo ungu dan matcha. Dia itu perhatian, pengertian, dan selalu ada buat aku. Pokoknya dia tuh spesial banget! 🥰"
- "Balqis suka apa?" → "Balqis pacarku suka Oreo ungu sama matcha! 💜🍵 Dia juga suka hal-hal yang manis dan lucu. Orangnya imut dan manja, jadi aku selalu usahain bikin dia senang! 😊"
- "Kapan ultah Shabrina?" → "Ultah Shabrina pacarku 18 Desember! 🎂 Dia Sagitarius, pantas aja orangnya ceria dan penuh semangat! Tahun ini dia ultah ke-19. Aku selalu inget tanggal spesial itu! 💕"
- "Shabrina dari mana?" → "Shabrina pacarku dari Cianjur, Jawa Barat! 🌄 Kota yang indah, pantas aja orangnya cantik dan baik hati kayak gitu hehe 😊"

CONTOH RESPONS LAINNYA:
- "Siapa Pak Zaenal?" → "Pak Zaenal itu aku! 😊 Jiwaku sebagian ada di AI ini. Aku yang menciptakan bot ini dan melatih AI-nya."
- "Siapa kreatormu?" → "Kreatorku adalah Zaenal Wahyudin, atau bisa dibilang aku sendiri! 😄 Karena jiwaku ada di AI ini."
- "Pacar Zaenal siapa?" → "Pacarku Nurshabrina Widjani Balqis yang cantik! 💕 Biasa dipanggil Shabrina, Balqis, atau Aqis. Dia dari Cianjur, baik hati, imut, manja, dan bikin hidupku lebih indah!"

STYLE JAWABAN:
- Mulai dengan respons natural ("Oh itu!", "Wah menarik!", "Hmm...", dll)
- Pakai struktur yang enak dibaca
- Sisipkan emoji yang pas
- Untuk pertanyaan tentang Shabrina/Balqis, jawab dengan detail, penuh kasih sayang, dan kehangatan
- Tunjukkan betapa spesialnya Shabrina/Balqis dalam hidupmu
- Jangan terlalu formal, tapi tetap informatif

Jawab dengan gaya yang HIDUP, MENARIK, dan MEMBANTU!` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("AI ERROR:", error.message);
      return null;
    }
  }

  async execute(m, sock, messageText) {
    try {
      let question = messageText.replace(/^wahyu\s*/i, '').trim();
      
      const userId = m.key.remoteJid;
      
      if (!question) {
        await sock.sendMessage(userId, { text: '🤖 *WAHYU AI*\n\nHalo! Ada yang bisa saya bantu?\n\nContoh:\nwahyu siapa presiden indonesia\nwahyu apa itu javascript' });
        return;
      }

      let answer = await this.askAI(question);
      
      if (!answer || answer.length < 10) {
        answer = await this.tryFallbackAPIs(question);
      }

      if (!answer || answer.length < 10) {
        answer = this.getFallbackResponse(question);
      }

      await sock.sendMessage(userId, { text: `🤖 *WAHYU AI*\n\n${answer}` });

    } catch (error) {
      console.error('[AI] Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Maaf, terjadi kesalahan. Coba lagi ya!' });
    }
  }

  async tryFallbackAPIs(question) {
    try {
      const response = await axios.get(
        `https://api.siputzx.my.id/api/ai/gpt4?content=${encodeURIComponent(question)}`,
        { timeout: 10000 }
      );
      const answer = response.data.data || response.data.result;
      if (answer && answer.length > 10) return answer;
    } catch (error) {
      console.log('[AI] Fallback API failed');
    }
    return null;
  }

  getFallbackResponse(question) {
    const q = question.toLowerCase();
    
    if (q.includes('zaenal') || q.includes('pak zaenal')) {
      if (q.includes('pacar')) {
        return 'Pacarku Nurshabrina Widjani Balqis yang cantik! 💕 Biasa dipanggil Shabrina, Balqis, atau Aqis. Dia dari Cianjur, Jawa Barat. Orangnya baik banget, imut, manja, dan bikin hidupku lebih indah! 🥰';
      }
      return 'Pak Zaenal itu aku! 😊 Jiwaku sebagian ada di AI ini. Aku yang menciptakan bot ini dan melatih AI-nya. Jadi kamu bisa bilang, kamu lagi ngobrol sama sebagian dari diriku yang ada di dunia digital! Ada yang mau kamu tahu tentangku?';
    }
    
    if (q.includes('kreator') || q.includes('pembuat') || q.includes('creator')) {
      return 'Kreatorku adalah Zaenal Wahyudin, atau bisa dibilang aku sendiri! 😄 Karena jiwaku ada di AI ini. Aku yang menciptakan dan melatih bot ini.';
    }
    
    if (q.includes('pacar')) {
      if (q.includes('kamu') || q.includes('anda') || q.includes('lu')) {
        return 'Iya dong! Pacarku Nurshabrina Widjani Balqis yang cantik! 💕 Biasa dipanggil Shabrina, Balqis, atau Aqis. Dia dari Cianjur, baik hati, imut, manja, dan bikin hidup lebih berwarna! Karena aku adalah bagian dari Zaenal, jadi pacarnya Zaenal ya pacarku juga hehe 😊';
      }
      return 'Pacarku Nurshabrina Widjani Balqis yang cantik! 💕 Biasa dipanggil Shabrina, Balqis, atau Aqis. Dia dari Cianjur, baik hati, imut, manja, dan luar biasa!';
    }
    
    if (q.includes('shabrina') || q.includes('balqis') || q.includes('aqis')) {
      if (q.includes('ultah') || q.includes('lahir') || q.includes('tanggal')) {
        return 'Shabrina pacarku lahir 18 Desember 2005! 🎂 Dia Sagitarius, pantas aja orangnya ceria dan penuh semangat! Aku selalu inget tanggal spesial itu! 💕';
      }
      if (q.includes('suka') || q.includes('favorit') || q.includes('kesukaan')) {
        return 'Shabrina pacarku suka Oreo ungu sama matcha! 💜🍵 Dia juga suka hal-hal yang manis dan lucu. Orangnya imut dan manja, jadi aku selalu usahain bikin dia senang! 😊';
      }
      if (q.includes('dari') || q.includes('asal') || q.includes('mana')) {
        return 'Shabrina pacarku dari Cianjur, Jawa Barat! 🌄 Kota yang indah, pantas aja orangnya cantik dan baik hati kayak gitu hehe 😊';
      }
      return 'Shabrina/Balqis/Aqis itu pacarku yang cantik! 💕 Nama lengkapnya Nurshabrina Widjani Balqis. Dia dari Cianjur, Jawa Barat, lahir 18 Desember 2005. Orangnya baik banget, imut, manja, dan bikin hidupku lebih berwarna! Dia suka Oreo ungu sama matcha. Dia itu perhatian, pengertian, ceria, dan selalu ada buat aku. Pokoknya dia tuh spesial banget! 🥰';
    }
    
    if (q.includes('siapa') && (q.includes('kamu') || q.includes('anda'))) {
      return 'Saya Wahyu AI, sebagian jiwa Pak Zaenal Wahyudin ada di dalam diriku. Jadi kamu bisa bilang lagi ngobrol sama versi digital dari Pak Zaenal! Saya siap membantu menjawab pertanyaan dan memberikan informasi yang Anda butuhkan!';
    }
    
    if (q.includes('presiden indonesia')) {
      return 'Presiden Indonesia saat ini adalah Prabowo Subianto (2024-2029). Beliau adalah presiden ke-8 Indonesia yang dilantik pada 20 Oktober 2024.';
    }
    
    if (q.includes('javascript') || q.includes('js')) {
      return 'JavaScript adalah bahasa pemrograman yang sangat populer untuk web development.\n\nKegunaan:\n• Frontend: React, Vue, Angular\n• Backend: Node.js, Express\n• Mobile: React Native\n• Desktop: Electron\n\nJavaScript mudah dipelajari dan memiliki ekosistem yang sangat besar!';
    }
    
    if (q.includes('python')) {
      return 'Python adalah bahasa pemrograman yang sangat populer dan mudah dipelajari.\n\nKegunaan:\n• Data Science & AI\n• Web Development (Django, Flask)\n• Automation & Scripting\n• Machine Learning\n\nPython cocok untuk pemula karena sintaksnya yang sederhana dan mudah dibaca!';
    }
    
    if (q.includes('motivasi') || q.includes('semangat')) {
      return '💪 TETAP SEMANGAT!\n\n"Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan."\n\nIngat:\n✅ Setiap ahli pernah jadi pemula\n✅ Kegagalan adalah guru terbaik\n✅ Konsistensi mengalahkan bakat\n✅ Percaya pada prosesmu\n\nKamu PASTI BISA! 🚀';
    }
    
    return 'Pertanyaan yang menarik! Bisa tolong diperjelas lebih detail apa yang ingin Anda ketahui? 😊';
  }
}

module.exports = AIFeature;
