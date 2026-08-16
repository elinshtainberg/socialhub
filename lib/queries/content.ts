import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/auth";
import type { ContentItem, ContentStatus, Note, SocialPlatform } from "@/lib/supabase/types";
import { cachedFetch, cacheInvalidate } from "@/lib/queryCache";
import {
  USE_MOCK_DATA,
  mockContentItems,
  mockNotes,
} from "@/lib/mockData";

// ---------- Content items ----------
export async function fetchAllContentItems() {
  if (USE_MOCK_DATA) return [...mockContentItems];

  return cachedFetch("content:all", async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ContentItem[];
  });
}

export async function fetchContentItems(clientId: string) {
  if (USE_MOCK_DATA) return mockContentItems.filter((c) => c.client_id === clientId);

  return cachedFetch(`content:${clientId}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ContentItem[];
  });
}

export async function createContentItem(input: {
  client_id: string;
  title: string;
  type: ContentItem["type"];
  platform: SocialPlatform;
}) {
  if (USE_MOCK_DATA) {
    const newItem: ContentItem = {
      id: `content-${Date.now()}`,
      user_id: "mock-user",
      ...input,
      status: "idea",
      created_at: new Date().toISOString(),
    };
    mockContentItems.unshift(newItem);
    return newItem;
  }

  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("content_items")
    .insert({ user_id: userId, ...input, status: "idea" })
    .select()
    .single();
  if (error) throw error;
  cacheInvalidate("content:");
  return data as ContentItem;
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  if (USE_MOCK_DATA) {
    const item = mockContentItems.find((c) => c.id === id);
    if (item) item.status = status;
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("content_items").update({ status }).eq("id", id);
  if (error) throw error;
  cacheInvalidate("content:");
}

export async function deleteContentItem(id: string) {
  if (USE_MOCK_DATA) {
    const idx = mockContentItems.findIndex((c) => c.id === id);
    if (idx !== -1) mockContentItems.splice(idx, 1);
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidate("content:");
}


// ---------- Notes ----------
export async function fetchNote(clientId: string) {
  if (USE_MOCK_DATA) return mockNotes.find((n) => n.client_id === clientId) ?? null;

  return cachedFetch(`notes:${clientId}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) throw error;
    return data as Note | null;
  });
}

export async function upsertNote(clientId: string, content: string, existingId?: string) {
  cacheInvalidate(`notes:${clientId}`);
  if (USE_MOCK_DATA) {
    const existing = mockNotes.find((n) => n.id === existingId || n.client_id === clientId);
    if (existing) {
      existing.content = content;
      existing.updated_at = new Date().toISOString();
    } else {
      mockNotes.push({
        id: `note-${Date.now()}`,
        user_id: "mock-user",
        client_id: clientId,
        content,
        updated_at: new Date().toISOString(),
      });
    }
    return;
  }

  const supabase = createClient();
  const userId = await getCurrentUserId();
  if (existingId) {
    const { error } = await supabase
      .from("notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("notes")
      .insert({ user_id: userId, client_id: clientId, content });
    if (error) throw error;
  }
}
