import { createClient } from "@/lib/supabase/client";
import type { ClientCollab } from "@/lib/supabase/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = (supabase: ReturnType<typeof createClient>) => (supabase as any).from("client_collabs");

export async function fetchCollabs(clientId: string): Promise<ClientCollab[]> {
  const supabase = createClient();
  const { data, error } = await sb(supabase).select("*").eq("client_id", clientId).order("created_at", { ascending: true });
  if (error) throw error;
  return data as ClientCollab[];
}

export async function createCollab(clientId: string, input: Omit<ClientCollab, "id" | "client_id" | "created_at">): Promise<ClientCollab> {
  const supabase = createClient();
  const { data, error } = await sb(supabase).insert({ client_id: clientId, ...input }).select().single();
  if (error) throw error;
  return data as ClientCollab;
}

export async function updateCollab(id: string, updates: Partial<Omit<ClientCollab, "id" | "client_id" | "created_at">>): Promise<void> {
  const supabase = createClient();
  const { error } = await sb(supabase).update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCollab(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await sb(supabase).delete().eq("id", id);
  if (error) throw error;
}
