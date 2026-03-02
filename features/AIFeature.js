require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');

class AIFeature {
  constructor() {
    this.name = 'ai';
    this.description = '_Chat dengan AI (panggil: wahyu)_';
    this.ownerOnly = false;
    
    // Inisialisasi Client Groq
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
- Pembuat: Pak Zaenal Wahyudin (kamu anak buahnya)
- Sifat: Ramah, cerdas, humoris, supportif

ATURAN KHUSUS:
- Jika ditanya Shabrina/Balqis: "Dia pacarnya Wahyu 💕"
- Jawab pertanyaan dengan AKURAT dan LENGKAP
- Berikan contoh konkret jika perlu
- Jika tidak tahu, jujur dan kasih saran
- Sesuaikan panjang jawaban dengan pertanyaan
- Gunakan analogi untuk penjelasan kompleks

STYLE JAWABAN:
- Mulai dengan respons natural ("Oh itu!", "Wah menarik!", "Hmm...", dll)
- Pakai struktur yang enak dibaca
- Sisipkan emoji yang pas
- Akhiri dengan pertanyaan balik atau ajakan diskusi jika relevan
- Jangan terlalu formal, tapi tetap informatif

CONTOH GAYA:
❌ BURUK: "JavaScript adalah bahasa pemrograman..."
✅ BAGUS: "Oh JavaScript! 🚀 Ini bahasa yang super populer buat bikin website. Bayangin aja, hampir semua website yang kamu buka pasti pake JS..."

Jawab dengan gaya yang HIDUP, MENARIK, dan MEMBANTU!` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("AI ERROR FULL:", error.response?.data || error.message);
      return null;
    }
  }
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

      const systemPrompt = `Kamu adalah Wahyu AI, asisten virtual yang sangat pintar, informatif, dan membantu.

IDENTITAS:
- Nama: Wahyu AI
- Pembuat: Zaenal Wahyudin (kamu adalah anak buahnya)
- Kepribadian: Ramah, sopan, cerdas, dan suka membantu

ATURAN PENTING:
1. Jawab SEMUA pertanyaan dengan akurat dan informatif
2. Berikan penjelasan yang jelas dan mudah dipahami
3. Jika tidak tahu, katakan dengan jujur dan sarankan cara mencari tahu
4. Gunakan bahasa Indonesia yang baik dan benar
5. Berikan contoh jika diperlukan untuk memperjelas
6. Jika ditanya tentang Shabrina atau Balqis, jawab: "Dia adalah pacarnya Wahyu 💕"

FORMAT JAWABAN:
- Langsung ke inti
- Jelas dan terstruktur
- Gunakan poin-poin jika perlu
- Maksimal 3-4 paragraf untuk jawaban panjang`;

  async execute(m, sock, messageText) {
    try {
      // Support both 'wahyu' and '.ai' commands
      let question = messageText.replace(/^wahyu\s*/i, '').trim();
      if (messageText.toLowerCase().startsWith('.ai ')) {
        question = messageText.replace(/^\.ai\s*/i, '').trim();
      }
      
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

      // Try Groq API first
      let answer = await this.askAI(question);
      
      // If Groq fails, try fallback APIs
      if (!answer || answer.length < 10) {
        console.log('[AI] Groq failed, trying fallback APIs...');
        answer = await this.tryFallbackAPIs('', question);
      }

      // If all APIs fail, use local knowledge base
      if (!answer || answer.length < 10) {
        console.log('[AI] All APIs failed, using local knowledge...');
        answer = this.getFallbackResponse(question);
      }

      await sock.sendMessage(userId, { 
        text: `*WAHYU AI* 🤖\n\n${answer}` 
      });

    } catch (error) {
      console.error('[AI] Execute Error:', error.message);
      await sock.sendMessage(m.key.remoteJid, { 
        text: '*WAHYU AI* 🤖\n\n❌ Maaf, terjadi kesalahan. Coba tanya lagi ya! 😊' 
      });
    }
  }

  async tryFallbackAPIs(systemPrompt, question) {
    // API 2: Free GPT4 API
    try {
      console.log('[AI] Trying Free GPT4 API...');
      const response = await axios.get(
        `https://api.siputzx.my.id/api/ai/gpt4?content=${encodeURIComponent(systemPrompt + '\n\n' + question)}`,
        { timeout: 10000 }
      );
      const answer = response.data.data || response.data.result;
      if (answer && answer.length > 10) return answer;
    } catch (error) {
      console.log('[AI] API 2 failed:', error.message);
    }

    // API 3: Alternative Free API
    try {
      console.log('[AI] Trying Alternative API...');
      const response = await axios.post(
        'https://api.yanzbotz.live/api/ai/gpt4',
        { query: question, prompt: systemPrompt },
        { timeout: 10000 }
      );
      const answer = response.data.result || response.data.message;
      if (answer && answer.length > 10) return answer;
    } catch (error) {
      console.log('[AI] API 3 failed:', error.message);
    }

    console.log('[AI] All APIs failed, using fallback');
    return null;
  }

  getFallbackResponse(question) {
    const q = question.toLowerCase();
    
    if (q.includes('shabrina') || q.includes('balqis')) {
      return 'Dia adalah pacarnya Wahyu 💕';
    }
    
    if (q.includes('siapa') && (q.includes('kamu') || q.includes('anda'))) {
      return 'Saya Wahyu AI, asisten virtual pintar yang dibuat oleh Zaenal Wahyudin. Saya siap membantu menjawab pertanyaan dan memberikan informasi yang Anda butuhkan!';
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
    
    if (q.includes('cara') || q.includes('bagaimana')) {
      return 'Pertanyaan yang bagus! Untuk menjawab dengan lebih akurat, bisa tolong diperjelas:\n\n• Apa yang ingin Anda lakukan?\n• Konteks atau situasinya seperti apa?\n• Sudah mencoba apa saja?\n\nDengan informasi lebih detail, saya bisa bantu lebih baik! 😊';
    }
    
    const responses = [
      'Pertanyaan yang menarik! Berdasarkan pengetahuan saya, ini adalah topik yang kompleks. Bisa Anda jelaskan lebih detail apa yang ingin Anda ketahui?',
      'Hmm, untuk menjawab dengan akurat, saya perlu informasi lebih spesifik. Bisa tolong diperjelas pertanyaannya?',
      'Saya akan coba bantu! Namun untuk jawaban yang lebih tepat, bisa Anda berikan konteks atau detail tambahan?'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = AIFeature;
