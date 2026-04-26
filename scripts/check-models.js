const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: The SDK might not have a direct listModels, we usually use the REST API or check docs.
    // But let's try a different approach: check the package version and use a very generic model name.
    console.log('Verificando chave e modelos...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Oi");
    console.log('Sucesso com gemini-1.5-flash:', result.response.text());
  } catch (e) {
    console.error('Erro:', e.message);
  }
}

listModels();
