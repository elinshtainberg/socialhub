"use client";
import { useEffect, useState, useCallback } from "react";
import type { CalendarItem } from "@/lib/supabase/types";
import type { GEvent } from "./calendarApi";
export {
  pushCalendarItemToGoogle,
  deleteGoogleEvent,
  pushTaskToGoogle,
  deleteGoogleTask,
} from "./syncHelpers";

export type GoogleCalendarItem = CalendarItem & { source: "google" };

function gEventToItem(e: GEvent): GoogleCalendarItem {
  const date = e.start.date ?? e.start.dateTime?.slice(0, 10) ?? "";
  const startTime = e.start.dateTime ? e.start.dateTime.slice(11, 16) : null;
  return {
    id: `google-${e.id}`,
    user_id: "",
    google_event_id: e.id,
    date,
    type: "event",
    title: e.summary ?? "(ללא כותרת)",
    notes: e.description ?? null,
    client_id: null,
    project_id: null,
    start_time: startTime,
    source: "google",
  };
}

export function useGoogleCalendarEvents(startDate: string, endDate: string) {
  const [events, setEvents] = useState<GoogleCalendarItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/google/events?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setConnected(data.connected ?? false);
      setEvents((data.events ?? []).map(gEventToItem));
    } catch {
      setConnected(false);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { events, connected, loading, refetch: fetch_ };
}

