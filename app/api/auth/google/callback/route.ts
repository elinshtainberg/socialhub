import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/google/oauth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://socialhub-pearl.vercel.app";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/settings?google=error`);
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${APP_URL}/login`);

    const tokens = await exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from("user_integrations").upsert({
      user_id: user.id,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
    }, { onConflict: "user_id,provider" });

    return NextResponse.redirect(`${APP_URL}/settings?google=connected`);
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.redirect(`${APP_URL}/settings?google=error`);
  }
}
