"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { updateCalendarItem } from "@/lib/queries/calendarItems";
import type { CalendarItem, Client } from "@/lib/supabase/types";

const timeTypes = new Set(["meeting", "shoot", "event"]);
const clientTypes = new Set(["meeting", "shoot", "post", "reel", "story", "tiktok", "other"]);

export function EditCalendarItemModal({
  item,
  clients,
  onClose,
  onSaved,
}: {
  item: CalendarItem;
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [startTime, setStartTime] = useState(item.start_time ?? "");
  const [clientId, setClientId] = useState(item.client_id ?? "");
  const [saving, setSaving] = useState(false);

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-t-1 focus:outline-none transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateCalendarItem(item.id, {
        title: title.trim(),
        notes: notes || null,
        start_time: startTime || null,
        client_id: clientId || null,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <h2 className="text-lg font-semibold text-t-1 mb-4">עריכת פריט יומן</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="כותרת"
          className={inputCls}
          required
        />
        {timeTypes.has(item.type) && (
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputCls}
          />
        )}
        {clientTypes.has(item.type) && (
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputCls}
          >
            <option value="">לקוח קשור (אופציונלי)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות (אופציונלי)"
          className={`${inputCls} resize-none h-16`}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !title.trim()} className="flex-1">
            {saving ? "שומר..." : "שמירה"}
          </Button>
          <button type="button" onClick={onClose} className="text-sm text-t-3 px-4 hover:text-t-1 transition">
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  );
}
