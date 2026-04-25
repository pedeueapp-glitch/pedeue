import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isRaw = searchParams.get("raw") === "true";
    
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome único
    // Se for RAW, mantemos a extensão original para garantir 100% de integridade se necessário
    // Caso contrário, usamos .webp
    const originalExtension = file.name.split(".").pop() || "png";
    const fileName = `${crypto.randomUUID()}.${isRaw ? originalExtension : 'webp'}`;
    
    // Caminho absoluto para a pasta public/uploads/support
    const uploadDir = join(process.cwd(), "public", "uploads", "support");
    await mkdir(uploadDir, { recursive: true });

    let finalBuffer = buffer;

    if (!isRaw) {
      // Processamento de imagem com Sharp apenas se NÃO for RAW
      const sharp = (await import("sharp")).default;
      
      finalBuffer = await sharp(buffer)
        .resize(1920, 1920, { 
          fit: "inside", 
          withoutEnlargement: true 
        })
        .webp({ quality: 90, effort: 6 })
        .toBuffer();
    }

    const path = join(uploadDir, fileName);
    await writeFile(path, finalBuffer);

    // Retornar a URL pública via API de imagens
    const url = `/api/images?file=support/${fileName}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 });
  }
}
