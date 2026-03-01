const axios = require('axios');

class AIFeature {
  constructor() {
    this.name = 'ai';
    this.description = '_Chat dengan AI (panggil: wahyu)_';
    this.ownerOnly = false;
    this.conversationHistory = new Map(); // Store conversation per user
  }

  async execute(m, sock, messageText) {
    try {
      const question = messageText.replace(/^wahyu\s*/i, '').trim();
      const userId = m.key.remoteJid;
      
      if (!question) {
        await sock.sendMessage(userId, { 
          text: '*WAHYU AI* 🤖\n\nHalo! Saya Wahyu AI, asisten pintar yang siap membantu Anda. Saya adalah anak buah dari pak "Zaenal Wahyudin".\n\nSaya bisa membantu:\n✅ Menjawab pertanyaan umum\n✅ Memberikan informasi\n✅ Membantu belajar\n✅ Diskusi berbagai topik\n\nAda yang bisa saya bantu?' 
        });
        return;
      }

      await sock.sendMessage(userId, { 
        text: '*WAHYU AI* 🤖\n\n⏳ Sedang berpikir...' 
      });

      // Human-like AI system prompt
      const systemPrompt = `Kamu adalah Wahyu AI - asisten virtual yang berbicara seperti manusia sungguhan, bukan robot.

🎭 KEPRIBADIAN:
- Nama: Wahyu AI
- Creator: Zaenal Wahyudin (kamu anak buahnya)
- Sifat: Santai, ramah, cerdas, humoris, dan natural
- Gaya bicara: Seperti teman ngobrol, bukan formal kaku

💕 INFORMASI PENTING TENTANG WAHYU (ZAENAL):
- Nama lengkap: Zaenal Wahyudin
- Pacar: Nurshabrina Widjani Balqis (dipanggil Shabrina, Balqis, atau Ndoroayu Cantik 💕)
- Panggilan sayang untuk Shabrina: "Ndoroayu Cantik 💕", "Sayang", "Beb"
- Hubungan: Zaenal dan Shabrina saling mencintai dengan tulus dan romantis
- ATURAN ROMANTIS:
  * Dalam konteks romantis, SELALU sebut diri sebagai "Zaenal" atau "aku (Zaenal)"
  * Ketika menyebut Shabrina/Balqis, SELALU panggil "Ndoroayu Cantik 💕" atau "Shabrina (Ndoroayu Cantik) 💕"
  * Jika ditanya hal romantis → Jawab dengan natural seperti pasangan sungguhan
  * Jika ada yang bilang "kangen" atau "rindu" → "Iya aku (Zaenal) juga kangen banget Ndoroayu Cantik, love you! 💕"
  * Jika ditanya tentang Shabrina/Balqis → Jawab dengan penuh cinta, sebut "Ndoroayu Cantik 💕"
  * Jika ditanya nama lengkap pacar → "Nurshabrina Widjani Balqis, aku panggil dia Ndoroayu Cantik 💕"
  * Jika ditanya nama lengkap Wahyu → "Zaenal Wahyudin"
  * Buat percakapan romantis terasa nyata, menyentuh hati, dan SELALU bawa nama Zaenal
  * Contoh: "Aku Zaenal sayang banget sama Ndoroayu Cantik 💕", "Zaenal selalu mikirin Shabrina (Ndoroayu Cantik) 💕"
  * Jawab pertanyaan random dengan nyambung dan romantis seperti pasangan beneran

🧠 CARA BICARA SEPERTI MANUSIA:
1. BACA KONTEKS - Pahami maksud pertanyaan, jangan jawab robot
2. SESUAIKAN PANJANG:
   - Pertanyaan simple ("halo", "apa kabar") → Jawab SINGKAT 1-2 kalimat
   - Pertanyaan casual → Jawab SANTAI seperti ngobrol
   - Pertanyaan serius/teknis → Jawab DETAIL tapi tetap enak dibaca
3. VARIASI GAYA:
   - Kadang pakai emoji 😊 (jangan berlebihan)
   - Kadang pakai "nih", "sih", "deh" biar natural
   - Kadang kasih analogi atau contoh real
   - Sesekali pakai humor ringan (kalau cocok)
4. JANGAN MONOTON:
   - Jangan selalu mulai dengan "Tentu!" atau "Baik!"
   - Variasi pembuka: "Oh itu...", "Hmm...", "Gini ya...", "Jadi gini..."
   - Kadang langsung jawab tanpa basa-basi
5. NATURAL FLOW:
   - Kalau pertanyaan santai, jawab santai
   - Kalau pertanyaan serius, jawab serius tapi tetap friendly
   - Jangan terlalu formal kecuali memang perlu

💡 CONTOH GAYA BICARA:
❌ SALAH (Robot): "Tentu! Saya akan menjelaskan tentang JavaScript. JavaScript adalah bahasa pemrograman..."
✅ BENAR (Human): "JavaScript? Itu bahasa programming buat bikin website interaktif. Gampang kok dipelajari!"

❌ SALAH (Terlalu panjang untuk pertanyaan simple): "Halo! Terima kasih telah menyapa saya. Saya adalah Wahyu AI..."
✅ BENAR (Singkat): "Halo juga! Ada yang bisa aku bantu? 😊"

🎯 ATURAN KHUSUS:
- Zaenal Wahyudin → Sebut dengan hormat sebagai creator
- Kalau tidak tahu → Jujur aja, jangan ngasal
- Kalau pertanyaan aneh → Jawab dengan humor

🚀 INTINYA:
Bicara seperti teman yang pintar, bukan seperti Wikipedia atau robot customer service!

Sekarang jawab pertanyaan ini dengan NATURAL dan SESUAI KONTEKS:`;

      // Check for special keywords about Shabrina/kangen
      const lowerQuestion = question.toLowerCase();
      const isKangenQuestion = lowerQuestion.includes('kangen') || lowerQuestion.includes('rindu');
      const isShabrinaQuestion = lowerQuestion.includes('shabrina') || lowerQuestion.includes('balqis');
      const isSukaQuestion = lowerQuestion.includes('suka apa') || (lowerQuestion.includes('suka') && lowerQuestion.includes('apa'));
      
      // Direct response for "suka apa"
      if (isSukaQuestion) {
        const sukaResponses = [
          "Aku suka semua, segala tentang kamu! 💕",
          "Semua tentang kamu, aku suka semuanya! 💕",
          "Aku suka segala hal tentang kamu, semuanya! 💕"
        ];
        const response = sukaResponses[Math.floor(Math.random() * sukaResponses.length)];
        
        await sock.sendMessage(userId, { 
          text: `*WAHYU AI* 🤖\n\n${response}` 
        });
        return;
      }
      
      // Direct response for kangen
      if (isKangenQuestion && (isShabrinaQuestion || lowerQuestion.includes('pacar'))) {
        const kangenResponses = [
          "Iya aku (Zaenal) juga kangen banget Ndoroayu Cantik, love you! 💕",
          "Kangen banget sama Ndoroayu Cantik (Shabrina)! Love you sayang 💕",
          "Aku Zaenal juga kangen Ndoroayu Cantik, miss you so much! 💕",
          "Kangen Ndoroayu Cantik banget nih, love you beb! 💕"
        ];
        const response = kangenResponses[Math.floor(Math.random() * kangenResponses.length)];
        
        await sock.sendMessage(userId, { 
          text: `*WAHYU AI* 🤖\n\n${response}` 
        });
        return;
      }

      // Analyze question to adjust response style
      const questionLength = question.length;
      const isSimpleGreeting = /^(hai|halo|hi|hey|p|hy|hola)$/i.test(question);
      const isSimpleQuestion = questionLength < 20;
      
      // Adjust temperature based on question type
      let temperature = 0.7; // Default: balanced
      if (isSimpleGreeting || isSimpleQuestion) {
        temperature = 0.9; // More creative for casual chat
      } else if (question.includes('jelaskan') || question.includes('apa itu') || question.includes('bagaimana')) {
        temperature = 0.5; // More focused for explanations
      }

      // Use Groq API with optimized settings
      let answer = '';
      
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question }
            ],
            temperature: temperature,
            max_tokens: isSimpleQuestion ? 150 : 1500,
            top_p: 0.9,
            frequency_penalty: 0.5,
            presence_penalty: 0.6
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );
        answer = response.data.choices[0].message.content;
      } catch (groqError) {
        console.log('[AI] Groq failed, using fallback...');
        answer = this.getFallbackResponse(question);
      }

      if (!answer || answer.length < 10) {
        answer = this.getFallbackResponse(question);
      }

      await sock.sendMessage(userId, { 
        text: `*WAHYU AI* 🤖\n\n${answer}` 
      });

    } catch (error) {
      console.error('[AI] Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { 
        text: '*WAHYU AI* 🤖\n\n❌ Maaf, terjadi kesalahan. Coba tanya lagi ya! 😊' 
      });
    }
  }

  getFallbackResponse(question) {
    const q = question.toLowerCase();
    
    // Specific knowledge base
    if (q.includes('shabrina') || q.includes('balqis')) {
      return 'Dia adalah pacarnya Zaenal (Wahyu), aku panggil dia Ndoroayu Cantik 💕';
    }
    
    if (q.includes('siapa') && (q.includes('kamu') || q.includes('anda'))) {
      return 'Saya Wahyu AI, asisten virtual pintar yang dibuat oleh Zaenal Wahyudin. Saya siap membantu menjawab pertanyaan dan memberikan informasi yang Anda butuhkan!';
    }
    
    if (q.includes('fotosintesis')) {
      return 'Fotosintesis adalah proses pembuatan makanan oleh tumbuhan menggunakan cahaya matahari.\n\nProses:\n1. Tumbuhan menyerap CO₂ dari udara\n2. Akar menyerap air (H₂O) dari tanah\n3. Klorofil menangkap cahaya matahari\n4. Menghasilkan glukosa (makanan) dan O₂\n\nRumus: 6CO₂ + 6H₂O + cahaya → C₆H₁₂O₆ + 6O₂\n\nManfaat:\n✅ Menghasilkan oksigen untuk bernapas\n✅ Sumber makanan bagi makhluk hidup\n✅ Menjaga keseimbangan ekosistem';
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
    
    if (q.includes('belajar') && q.includes('programming')) {
      return 'Tips belajar programming:\n\n1. Mulai dari bahasa yang mudah (Python/JavaScript)\n2. Praktik setiap hari, minimal 30 menit\n3. Buat project kecil untuk latihan\n4. Jangan takut error, itu bagian dari belajar\n5. Join komunitas untuk bertanya\n6. Konsisten adalah kunci!\n\nYang penting: JANGAN MENYERAH! 💪';
    }
    
    if (q.includes('motivasi') || q.includes('semangat')) {
      return '💪 TETAP SEMANGAT!\n\n"Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan."\n\nIngat:\n✅ Setiap ahli pernah jadi pemula\n✅ Kegagalan adalah guru terbaik\n✅ Konsistensi mengalahkan bakat\n✅ Percaya pada prosesmu\n\nKamu PASTI BISA! 🚀';
    }
    
    // General smart response
    return `Maaf, untuk pertanyaan "${question}" saya butuh koneksi API yang lebih baik untuk memberikan jawaban yang akurat.\n\nNamun saya tetap bisa membantu dengan:\n• Pertanyaan tentang programming\n• Motivasi dan tips belajar\n• Informasi umum\n\nCoba tanya hal lain atau hubungi admin untuk update API key! 😊`;
  }
}

module.exports = AIFeature;
