import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, storeType } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    // Using gemini-flash-latest which worked before
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Você é um redator publicitário especializado em delivery e varejo.
      Escreva uma descrição curta, atraente e vendedora para o produto: "${name}".
      O tipo de estabelecimento é um(a) ${storeType === 'RESTAURANT' ? 'Restaurante/Delivery de Comida' : 'Loja/Prestador de Serviços'}.
      
      Regras:
      1. Use no máximo 150 caracteres.
      2. Foque na qualidade, sabor (se for comida) e desejo de compra.
      3. Não use emojis em excesso.
      4. Retorne APENAS o texto da descrição, sem aspas ou explicações.
    `;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
        console.error("Erro Gemini API:", data.error);
        return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    if (!data.candidates || !data.candidates[0]) {
        return NextResponse.json({ error: "A IA não conseguiu gerar uma resposta no momento." }, { status: 500 });
    }

    const description = data.candidates[0].content.parts[0].text.trim();

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("Erro na rota de descrição:", error);
    return NextResponse.json({ error: "Falha ao gerar descrição: " + error.message }, { status: 500 });
  }
}
