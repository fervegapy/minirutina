// Sets the mr_region cookie from the manual selector in Header/Footer.
import { NextRequest, NextResponse } from "next/server";
import { REGION_COOKIE, REGION_COOKIE_MAX_AGE, isRegion } from "@/lib/region";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const region = body?.region;
  if (!isRegion(region)) {
    return NextResponse.json({ ok: false, error: "Región inválida." }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REGION_COOKIE, region, { maxAge: REGION_COOKIE_MAX_AGE, path: "/" });
  return res;
}
