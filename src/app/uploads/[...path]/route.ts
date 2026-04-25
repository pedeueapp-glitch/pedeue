import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    const safePath = pathParts.join(path.sep).replace(/\.\./g, '');
    const filePath = path.join(process.cwd(), "public", "uploads", safePath);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Arquivo não encontrado", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    let contentType = "image/webp";
    if (extension === ".png") contentType = "image/png";
    if (extension === ".jpg" || extension === ".jpeg") contentType = "image/jpeg";
    if (extension === ".svg") contentType = "image/svg+xml";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Erro ao servir imagem de upload:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
