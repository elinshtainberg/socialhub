"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { dayTagLabel, dayTagStyle } from "@/components/month/MonthGrid";
import { deleteCalendarItem } from "@/lib/queries/calendarItems";
import { EditCalendarItemModal } from "@/components/month/EditCalendarItemModal";
import type { CalendarItem, Client } from "@/lib/supabase/types";
import { X, Pencil } from "lucide-react";

export function DayCalendarItemsList({
  items,
  clients,
  onChanged,
}: {
  items: CalendarItem[];
  clients: Client[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<CalendarItem | null>(null);

  if (items.length === 0) return null;

  async function handleDelete(id: string) {
    await deleteCalendarItem(id);
    onChanged();
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2"
            style={{ borderLeft: `3px solid ${dayTagStyle[item.type]?.color ?? "#9CA3AF"}`, paddingLeft: "10px" }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: dayTagStyle[item.type]?.bg ?? "rgba(156,144,120,0.12)", color: dayTagStyle[item.type]?.color ?? "#3D2F24" }}>
                  {dayTagLabel[item.type]}
                </span>
                {item.start_time && <span className="text-[11px] text-t-3">{item.start_time}</span>}
                {item.client_id && (
                  <span className="text-[11px] text-t-3">
                    {clients.find((c) => c.id === item.client_id)?.name}
                  </span>
                )}
              </div>
              <p className="text-sm truncate">{item.title}</p>
              {item.notes && <p className="text-xs text-t-3 mt-0.5">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditing(item)} className="text-t-3 hover:text-t-1 p-0.5" title="עריכה">
                <Pencil size={13} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-t-3 hover:text-t-1 p-0.5" title="מחיקה">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <EditCalendarItemModal
          item={editing}
          clients={clients}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </>
  );
}
