const BASE = "https://www.googleapis.com/calendar/v3";

export interface GEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function listEvents(token: string, startDate: string, endDate: string): Promise<GEvent[]> {
  const params = new URLSearchParams({
    timeMin: `${startDate}T00:00:00Z`,
    timeMax: `${endDate}T23:59:59Z`,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(`${BASE}/calendars/primary/events?${params}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to list Google events");
  const data = await res.json();
  return (data.items ?? []).filter((e: GEvent) => e.status !== "cancelled");
}

export async function createEvent(token: string, event: {
  summary: string;
  description?: string;
  start: string; // YYYY-MM-DD or ISO datetime
  end?: string;
  allDay?: boolean;
}): Promise<GEvent> {
  const body = event.allDay
    ? { summary: event.summary, description: event.description, start: { date: event.start }, end: { date: event.end ?? event.start } }
    : { summary: event.summary, description: event.description, start: { dateTime: event.start }, end: { dateTime: event.end ?? event.start } };

  const res = await fetch(`${BASE}/calendars/primary/events`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create Google event");
  return res.json();
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  await fetch(`${BASE}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateEvent(token: string, eventId: string, patch: Partial<GEvent>): Promise<GEvent> {
  const res = await fetch(`${BASE}/calendars/primary/events/${eventId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update Google event");
  return res.json();
}
