import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo nao fornecido" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Definir caminhos
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    
    // Garantir que a pasta existe
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    // PROCESSAMENTO COM SHARP:
    // 1. Redimensionar para max 800x800 (preservando aspecto)
    // 2. Converter para WebP com qualidade 80
    // 3. Remover metadados inúteis (EXIF)
    await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    const relativePath = `/uploads/products/${filename}`;

    return NextResponse.json({ url: relativePath });
  } catch (error: any) {
    console.error("ERRO UPLOAD:", error);
    return NextResponse.json({ error: "Falha ao processar imagem" }, { status: 500 });
  }
}
