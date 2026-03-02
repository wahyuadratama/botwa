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
      console.error("AI ERROR:", error.message);
      return null;
    }
  }

  async execute(m, sock, messageText) {
    try {
      let question = messageText.replace(/^wahyu\s*/i, '').trim();
      if (messageText.toLowerCase().startsWith('.ai ')) {
        question = messageText.replace(/^\.ai\s*/i, '').trim();
      }
      
      const userId = m.key.remoteJid;
      
      if (!question) {
        await sock.sendMessage(userId, { text: '🤖 *WAHYU AI*\n\nHalo! Ada yang bisa saya bantu?\n\nContoh:\nwahyu siapa presiden indonesia\n.ai apa itu javascript' });
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
    
    if (q.includes('motivasi') || q.includes('semangat')) {
      return '💪 TETAP SEMANGAT!\n\n"Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan."\n\nIngat:\n✅ Setiap ahli pernah jadi pemula\n✅ Kegagalan adalah guru terbaik\n✅ Konsistensi mengalahkan bakat\n✅ Percaya pada prosesmu\n\nKamu PASTI BISA! 🚀';
    }
    
    return 'Pertanyaan yang menarik! Bisa tolong diperjelas lebih detail apa yang ingin Anda ketahui? 😊';
  }
}

module.exports = AIFeature;
