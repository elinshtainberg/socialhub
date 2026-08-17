import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/auth";
import type { Client } from "@/lib/supabase/types";
import { cachedFetch, cacheInvalidate } from "@/lib/queryCache";
import {
  USE_MOCK_DATA,
  mockClients,
  mockTasks,
  mockContentItems,
  mockCalendarItems,
  mockNotes,
} from "@/lib/mockData";

export async function fetchClients() {
  if (USE_MOCK_DATA) return [...mockClients];
  return cachedFetch("clients", async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Client[];
  });
}

export async function fetchNextShootsForClients(): Promise<Record<string, string>> {
  if (USE_MOCK_DATA) return {};
  return cachedFetch("clients:next-shoots", async () => {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("calendar_items")
      .select("client_id, date")
      .eq("type", "shoot")
      .gte("date", today)
      .order("date", { ascending: true });
    if (!data) return {};
    // Keep only the earliest shoot per client
    const result: Record<string, string> = {};
    for (const row of data) {
      if (row.client_id && !result[row.client_id]) {
        const label = new Date(row.date).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
        result[row.client_id] = `יום צילום · ${label}`;
      }
    }
    return result;
  });
}

export async function fetchClient(id: string) {
  if (USE_MOCK_DATA) {
    const found = mockClients.find((c) => c.id === id);
    if (!found) throw new Error("client not found");
    return found;
  }

  return cachedFetch(`clients:${id}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Client;
  });
}

export async function createClientRecord(input: {
  name: string;
  business_name?: string | null;
  client_type?: Client["client_type"];
  monthly_retainer?: number | null;
  project_date?: string | null;
  content_summary?: string | null;
  color?: string;
  billing_name?: string | null;
  company_id?: string | null;
  drive_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
}) {
  if (USE_MOCK_DATA) {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      user_id: "mock-user",
      name: input.name,
      business_name: input.business_name ?? null,
      client_type: input.client_type ?? "ongoing",
      monthly_retainer: input.monthly_retainer ?? null,
      project_date: input.project_date ?? null,
      content_summary: input.content_summary ?? null,
      color: input.color ?? "purple",
      created_at: new Date().toISOString(),
      billing_name: input.billing_name ?? null,
      company_id: input.company_id ?? null,
      drive_url: input.drive_url ?? null,
      instagram_url: input.instagram_url ?? null,
      tiktok_url: input.tiktok_url ?? null,
      facebook_url: input.facebook_url ?? null,
      next_action: null,
    };
    mockClients.unshift(newClient);
    return newClient;
  }

  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      name: input.name,
      business_name: input.business_name ?? null,
      client_type: input.client_type ?? "ongoing",
      monthly_retainer: input.monthly_retainer ?? null,
      project_date: input.project_date ?? null,
      content_summary: input.content_summary ?? null,
      color: input.color ?? "purple",
      billing_name: input.billing_name ?? null,
      company_id: input.company_id ?? null,
      drive_url: input.drive_url ?? null,
      instagram_url: input.instagram_url ?? null,
      tiktok_url: input.tiktok_url ?? null,
      facebook_url: input.facebook_url ?? null,
      linkedin_url: input.linkedin_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  if (USE_MOCK_DATA) {
    const c = mockClients.find((c) => c.id === id);
    if (c) Object.assign(c, updates);
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("clients").update(updates).eq("id", id);
  if (error) throw error;
  cacheInvalidate("clients");
}

// Deletes the client and cascades cleanup of everything related to it.
// Mirrors the `on delete cascade` foreign keys defined in supabase/schema.sql.
export async function deleteClient(id: string) {
  if (USE_MOCK_DATA) {
    const idx = mockClients.findIndex((c) => c.id === id);
    if (idx !== -1) mockClients.splice(idx, 1);

    for (let i = mockTasks.length - 1; i >= 0; i--) {
      if (mockTasks[i].client_id === id) mockTasks.splice(i, 1);
    }
    for (let i = mockContentItems.length - 1; i >= 0; i--) {
      if (mockContentItems[i].client_id === id) mockContentItems.splice(i, 1);
    }
    for (let i = mockCalendarItems.length - 1; i >= 0; i--) {
      if (mockCalendarItems[i].client_id === id) mockCalendarItems.splice(i, 1);
    }
    for (let i = mockNotes.length - 1; i >= 0; i--) {
      if (mockNotes[i].client_id === id) mockNotes.splice(i, 1);
    }
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidate("clients");
}
