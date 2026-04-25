import { NextResponse } from "next/server";

import { recordWebhook } from "@/app/api/superadmin/webhooks/route";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  await recordWebhook("efi", "notification", body);
  return NextResponse.json({ ok: true });
}


export async function GET() {
  return NextResponse.json({ ok: true });
}
