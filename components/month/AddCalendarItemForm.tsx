"use client";

import { useState } from "react";
import { createCalendarItem } from "@/lib/queries/calendarItems";
import type { CalendarItemType, Client } from "@/lib/supabase/types";
import { dayTagLabel, dayTagButtonClass } from "@/components/month/MonthGrid";

// All non-task types available in the global month/week calendar.
// Content deliverables (post/reel/story/tiktok/other) always belong to a
// client — client selection is required for those, optional for meeting/shoot.
const allTypeOptions: CalendarItemType[] = ["holiday", "event", "meeting", "shoot", "post", "reel", "story", "tiktok", "other"];

const contentTypes: CalendarItemType[] = ["post", "reel", "story", "tiktok", "other"];
const showClientSelect = (type: CalendarItemType) =>
  type === "meeting" || type === "shoot" || contentTypes.includes(type);
const clientRequired = (type: CalendarItemType) => contentTypes.includes(type);

export function AddCalendarItemForm({
  type,
  date,
  clients,
  onCreated,
}: {
  type: CalendarItemType;
  date: string;
  clients: Client[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [saving, setSaving] = useState(false);

  const showTime = type !== "holiday";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (clientRequired(type) && !clientId) return;
    setSaving(true);
    try {
      await createCalendarItem({
        date,
        type,
        title: title.trim(),
        notes: notes || null,
        client_id: showClientSelect(type) && clientId ? clientId : null,
        start_time: startTime || null,
      });
      setTitle("");
      setNotes("");
      setClientId("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="כותרת"
        className="w-full rounded-lg px-3 py-2 text-sm"
      />
      {showTime && (
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm"
        />
      )}

      {showClientSelect(type) && (
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full rounded-lg  px-3 py-2 text-xs"
        >
          <option value="">{clientRequired(type) ? "לקוח (חובה)" : "לקוח קשור (אופציונלי)"}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="הערות (אופציונלי)"
        className="w-full rounded-lg  px-3 py-2 text-xs resize-none h-14"
      />

      <button
        type="submit"
        disabled={saving || !title.trim() || (clientRequired(type) && !clientId)}
        className="w-full bg-accent text-white rounded-lg py-2 text-xs font-medium disabled:opacity-40"
      >
        {saving ? "שומר..." : "הוספה"}
      </button>
    </form>
  );
}
