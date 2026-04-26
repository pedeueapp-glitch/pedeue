const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
const data = JSON.stringify({
  contents: [{ parts: [{ text: "Extraia os itens deste cardápio em JSON: Esquina Burguer - X-Burger R$ 20,00, Coca-cola R$ 8,00" }] }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let responseBody = '';
  res.on('data', d => responseBody += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta:', responseBody);
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
