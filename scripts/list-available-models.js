const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET'
};

const req = https.request(options, res => {
  let responseBody = '';
  res.on('data', d => responseBody += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
        const data = JSON.parse(responseBody);
        console.log('Modelos disponíveis:');
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log(responseBody);
        }
    } catch(e) {
        console.log(responseBody);
    }
  });
});

req.on('error', error => console.error(error));
req.end();
