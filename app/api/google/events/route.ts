import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/getToken";
import { listEvents, createEvent, deleteEvent } from "@/lib/google/calendarApi";

// GET /api/google/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const start = req.nextUrl.searchParams.get("startDate");
  const end = req.nextUrl.searchParams.get("endDate");
  if (!start || !end) return NextResponse.json({ error: "Missing dates" }, { status: 400 });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ connected: false, events: [] });

  const events = await listEvents(token, start, end);
  return NextResponse.json({ connected: true, events });
}

// POST /api/google/events — create event in Google Calendar and store google_event_id
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ ok: false, reason: "not_connected" });

  const body = await req.json();
  const { calendarItemId, title, date, startTime, notes } = body;

  const startStr = startTime ? `${date}T${startTime}:00` : date;
  const gEvent = await createEvent(token, {
    summary: title,
    description: notes ?? undefined,
    start: startStr,
    end: startStr,
    allDay: !startTime,
  });

  // Store google_event_id on our calendar item
  if (calendarItemId) {
    await supabase
      .from("calendar_items")
      .update({ google_event_id: gEvent.id })
      .eq("id", calendarItemId);
  }

  return NextResponse.json({ ok: true, googleEventId: gEvent.id });
}

// DELETE /api/google/events?googleEventId=xxx
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const googleEventId = req.nextUrl.searchParams.get("googleEventId");
  if (!googleEventId) return NextResponse.json({ ok: true });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ ok: false, reason: "not_connected" });

  await deleteEvent(token, googleEventId);
  return NextResponse.json({ ok: true });
}
