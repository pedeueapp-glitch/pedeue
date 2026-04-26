const cheerio = require('cheerio');

async function testFinal() {
  const url = 'https://whatsmenu.com.br/esquinaburguer';
  const apiKey = process.env.GEMINI_API_KEY;

  console.log('1. Acessando WhatsMenu (Esquina Burguer)...');
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, footer, nav, iframe, noscript").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().substring(0, 10000);

    console.log('2. Enviando para o Gemini analisar...');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    console.log('--- Texto enviado ao Gemini (amostra) ---');
    console.log(bodyText.substring(0, 500));

    const prompt = `Analise este texto extraído de um site de cardápio e extraia as CATEGORIAS e PRODUTOS (com preços).
    Texto:
    ${bodyText}
    
    Retorne no formato JSON:
    { "categories": [ { "name": "...", "products": [ { "name": "...", "price": 0.00, "description": "..." } ] } ] }
    Retorne apenas o JSON.`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiRes.json();
    if (data.error) {
      console.error('Erro da API Gemini:', JSON.stringify(data.error, null, 2));
      return;
    }
    if (!data.candidates || !data.candidates[0]) {
      console.error('Resposta inesperada da API:', JSON.stringify(data, null, 2));
      return;
    }
    const text = data.candidates[0].content.parts[0].text;
    console.log('\n--- CARDÁPIO EXTRAÍDO COM SUCESSO ---');
    console.log(text.replace(/```json|```/g, "").trim());

  } catch (e) {
    console.error('Erro no teste:', e.message);
  }
}

testFinal();
