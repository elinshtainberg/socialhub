import { createClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "./oauth";

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!data?.refresh_token) return null;

  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : new Date(0);
  const needsRefresh = expiresAt <= new Date(Date.now() + 60_000); // refresh 1 min early

  if (!needsRefresh && data.access_token) return data.access_token;

  // Refresh
  const refreshed = await refreshAccessToken(data.refresh_token);
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("user_integrations")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiry })
    .eq("user_id", userId)
    .eq("provider", "google");

  return refreshed.access_token;
}
