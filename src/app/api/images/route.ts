import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");

    if (!file) {
      return new NextResponse("Arquivo não especificado", { status: 400 });
    }

    // Permite nomes de arquivos com subpastas, ex: "support/imagem.webp" ou "products/imagem.webp"
    const safeFile = file.replace(/\.\./g, ''); // Evita directory traversal
    const filePath = path.join(process.cwd(), "public", "uploads", safeFile);

    if (!fs.existsSync(filePath)) {
      console.error("Arquivo não encontrado no sistema:", filePath);
      return new NextResponse("Imagem não encontrada", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    const ext = path.extname(safeFile).toLowerCase();
    let contentType = "image/webp";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".gif") contentType = "image/gif";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Erro ao servir imagem:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
