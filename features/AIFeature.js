require('dotenv').config();
const axios = require('axios');

class AIFeature {
  constructor() {
    this.name = 'ai';
    this.description = '_Chat dengan AI (panggil: wahyu)_';
    this.ownerOnly = false;
    this.conversationHistory = new Map();
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

KEMAMPUAN:
- Menjawab pertanyaan umum (sejarah, sains, teknologi, dll)
- Membantu belajar dan menjelaskan konsep
- Memberikan saran dan solusi
- Diskusi berbagai topik
- Menjelaskan programming dan teknologi
- Memberikan motivasi dan inspirasi

FORMAT JAWABAN:
- Langsung ke inti
- Jelas dan terstruktur
- Gunakan poin-poin jika perlu
- Maksimal 3-4 paragraf untuk jawaban panjang

Pertanyaan: ${question}`;

      let answer = '';
      
      try {
        // Use Groq API with new key
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question }
            ],
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        answer = response.data.choices[0].message.content;
        
      } catch (error1) {
        console.log('[AI] Groq failed, trying API 2...');
        
        try {
          const response2 = await axios.get(
            `https://api.siputzx.my.id/api/ai/gpt4?content=${encodeURIComponent(systemPrompt)}`,
            { timeout: 10000 }
          );
          answer = response2.data.data || response2.data.result;
        } catch (error2) {
          console.log('[AI] API 2 failed, using fallback...');
          answer = this.getFallbackResponse(question);
        }
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
