import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { url, text } = await req.json();
    
    let bodyText = text || "";

    if (url && !text) {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Não foi possível acessar a URL" }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        $("script, style, footer, nav, iframe, noscript").remove();
        bodyText = $("body").text().replace(/\s+/g, " ").trim();
    }

    if (!bodyText) {
        return NextResponse.json({ error: "Nenhum conteúdo encontrado para processar" }, { status: 400 });
    }

    // Limit text size
    bodyText = bodyText.substring(0, 15000);

    const apiKey = process.env.GEMINI_API_KEY;
    // Using gemini-flash-latest as discovered in list-models
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Você é um especialista em extração de dados de cardápios de delivery.
      Analise o texto abaixo extraído de um site ou colado pelo usuário e converta-o em um formato JSON estruturado.
      
      Regras:
      1. Agrupe os produtos em categorias.
      2. Para cada produto, extraia: nome, descrição (se houver), preço e opcionais.
      3. Opcionais devem ser agrupados em grupos (ex: "Escolha sua carne", "Adicionais").
      4. Identifique se o opcional é obrigatório e as quantidades mín/máx.
      5. Preços devem ser números decimais.
      
      Formato esperado:
      {
        "categories": [
          {
            "name": "Nome da Categoria",
            "products": [
              {
                "name": "Nome do Produto",
                "description": "Descrição",
                "price": 25.50,
                "optionGroups": [
                  {
                    "name": "Nome do Grupo",
                    "minOptions": 0,
                    "maxOptions": 1,
                    "isRequired": false,
                    "options": [
                      { "name": "Opção 1", "price": 0 },
                      { "name": "Opção 2", "price": 5.00 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      Texto do cardápio:
      ---
      ${bodyText}
      ---
      
      Retorne APENAS o JSON puro, sem blocos de código ou explicações.
    `;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      throw new Error(geminiData.error?.message || "Erro na API do Gemini");
    }

    if (!geminiData.candidates || !geminiData.candidates[0]) {
        throw new Error("A IA não conseguiu processar este conteúdo. Tente copiar e colar o texto manualmente.");
    }

    const textResult = geminiData.candidates[0].content.parts[0].text;
    const cleanJson = textResult.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ error: "Falha ao processar cardápio: " + error.message }, { status: 500 });
  }
}
