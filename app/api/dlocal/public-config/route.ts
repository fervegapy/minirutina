// Public-safe subset of the dLocal config. Used by the checkout client
// to know which dlocal.js to load (sandbox vs prod), which SmartFields
// public key to init with, and which checkout mode (embedded vs redirect)
// to render. NEVER returns the api_key / secret_key.
import { NextResponse } from "next/server";
import { getPublicDlocalConfig } from "@/lib/dlocal-config";

export async function GET() {
  try {
    const cfg = await getPublicDlocalConfig();
    return NextResponse.json(cfg, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { ambiente: "sandbox", checkout_mode: "redirect", smartfields_key: "" },
      { status: 200 },
    );
  }
}
