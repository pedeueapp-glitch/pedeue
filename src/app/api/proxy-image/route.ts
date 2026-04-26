import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) return new Response("URL is required", { status: 400 });

  try {
    // Adiciona o protocolo se estiver faltando (ajuda em alguns casos de links de CDN)
    const finalUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
    
    const response = await fetch(finalUrl, {
      next: { revalidate: 3600 } // Cache por 1 hora
    });

    if (!response.ok) throw new Error("Failed to fetch image from source");

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error: any) {
    console.error("Proxy Error:", error.message);
    return new Response(`Error fetching image: ${error.message}`, { status: 500 });
  }
}
