import { createClient } from "@/lib/supabase/client";

export async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  // getSession reads from local storage — faster and works reliably in client components
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}
