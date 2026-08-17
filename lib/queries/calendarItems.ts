// =============================================================================
// Unified calendar items query layer.
// Single source of truth for ALL calendar views:
//   - /month page (no clientId filter)
//   - /week day panels (filter by date range)
//   - client monthly tab (filter by clientId)
// =============================================================================

import { createClient } from "@/lib/supabase/client";
import type { CalendarItem, CalendarItemType } from "@/lib/supabase/types";
import { cachedFetch, cacheInvalidate } from "@/lib/queryCache";
import { USE_MOCK_DATA, mockCalendarItems } from "@/lib/mockData";

/** Fetch items for a given month. Optionally filter by client. */
export async function fetchCalendarItemsForMonth(
  year: number,
  month: number,
  clientId?: string | null
) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  if (USE_MOCK_DATA) {
    return mockCalendarItems.filter((i) => {
      if (!i.date.startsWith(prefix)) return false;
      if (clientId) return i.client_id === clientId;
      return true;
    });
  }

  const cacheKey = `calendar:month:${prefix}:${clientId ?? "all"}`;
  return cachedFetch(cacheKey, async () => {
    const supabase = createClient();
    const start = `${prefix}-01`;
    const endDate = new Date(year, month + 1, 0).getDate();
    const end = `${prefix}-${String(endDate).padStart(2, "0")}`;
    let query = supabase.from("calendar_items").select("*").gte("date", start).lte("date", end);
    if (clientId) query = query.eq("client_id", clientId);
    const { data, error } = await query;
    if (error) throw error;
    return data as CalendarItem[];
  });
}

/** Fetch items for a specific date (used by week day panel). */
export async function fetchCalendarItemsForDate(date: string) {
  if (USE_MOCK_DATA) {
    return mockCalendarItems.filter((i) => i.date === date);
  }

  return cachedFetch(`calendar:date:${date}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("calendar_items").select("*").eq("date", date);
    if (error) throw error;
    return data as CalendarItem[];
  });
}

/** Fetch items for a date range (used by week view). */
export async function fetchCalendarItemsForRange(startDate: string, endDate: string) {
  if (USE_MOCK_DATA) {
    return mockCalendarItems.filter((i) => i.date >= startDate && i.date <= endDate);
  }

  return cachedFetch(`calendar:range:${startDate}:${endDate}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("calendar_items")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);
    if (error) throw error;
    return data as CalendarItem[];
  });
}

/** Create a calendar item. Items with client_id or project_id appear in those context tabs AND in global views. */
export async function createCalendarItem(input: {
  date: string;
  type: CalendarItemType;
  title: string;
  notes?: string | null;
  client_id?: string | null;
  project_id?: string | null;
  start_time?: string | null;
}) {
  if (USE_MOCK_DATA) {
    const newItem: CalendarItem = {
      id: `calitem-${Date.now()}`,
      user_id: "mock-user",
      date: input.date,
      type: input.type,
      title: input.title,
      notes: input.notes ?? null,
      client_id: input.client_id ?? null,
      project_id: input.project_id ?? null,
      start_time: input.start_time ?? null,
    };
    mockCalendarItems.push(newItem);
    return newItem;
  }

  const supabase = createClient();
  const userId = "default-user";
  const { data, error } = await supabase
    .from("calendar_items")
    .insert({
      user_id: userId,
      date: input.date,
      type: input.type,
      title: input.title,
      notes: input.notes ?? null,
      client_id: input.client_id ?? null,
      project_id: input.project_id ?? null,
      start_time: input.start_time ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  cacheInvalidate("calendar:");
  return data as CalendarItem;
}

/** Fetch all calendar items linked to a project, sorted by date. */
export async function fetchCalendarItemsByProject(projectId: string): Promise<CalendarItem[]> {
  if (USE_MOCK_DATA) {
    return mockCalendarItems
      .filter((i) => i.project_id === projectId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return cachedFetch(`calendar:project:${projectId}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("calendar_items")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: true });
    if (error) throw error;
    return data as CalendarItem[];
  });
}

export async function updateCalendarItem(id: string, input: {
  title?: string;
  notes?: string | null;
  start_time?: string | null;
  client_id?: string | null;
  date?: string;
}) {
  if (USE_MOCK_DATA) {
    const item = mockCalendarItems.find((i) => i.id === id);
    if (item) Object.assign(item, input);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("calendar_items").update(input).eq("id", id);
  if (error) throw error;
  cacheInvalidate("calendar:");
}

export async function deleteCalendarItem(id: string) {
  if (USE_MOCK_DATA) {
    const idx = mockCalendarItems.findIndex((i) => i.id === id);
    if (idx !== -1) mockCalendarItems.splice(idx, 1);
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("calendar_items").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidate("calendar:");
}
