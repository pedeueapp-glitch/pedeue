const fs = require('fs');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testImport() {
  try {
    const html = fs.readFileSync('scratch/test-import.html', 'utf8');
    const $ = cheerio.load(html);

    // Limpeza igual à da API
    $('script, style, footer, nav, iframe, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 10000);

    console.log('--- Texto Extraído (Amostra) ---');
    console.log(bodyText.substring(0, 500) + '...');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um especialista em extração de dados de cardápios de delivery.
      Analise o texto abaixo extraído de um site de delivery e converta-o em um formato JSON estruturado.
      
      Regras:
      1. Agrupe os produtos em categorias.
      2. Para cada produto, extraia: nome, descrição (se houver), preço e opcionais.
      
      Texto:
      ${bodyText}
      
      Retorne APENAS o JSON puro.
    `;

    const result = await model.generateContent(prompt);
    console.log('\n--- Resultado do Importador Mágico ---');
    console.log(result.response.text());

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testImport();
