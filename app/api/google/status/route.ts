import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false });

  const { data } = await supabase
    .from("user_integrations")
    .select("token_expires_at")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  return NextResponse.json({ connected: !!data });
}
