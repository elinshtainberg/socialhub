import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "google");

  return NextResponse.json({ ok: true });
}
