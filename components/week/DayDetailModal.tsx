import { Modal } from "@/components/ui/Modal";
import { TaskList } from "@/components/tasks/TaskList";
import { AddTaskTrigger, TaskModal } from "@/components/tasks/TaskModal";
import { deleteCalendarItem } from "@/lib/queries/calendarItems";
import { EditCalendarItemModal } from "@/components/month/EditCalendarItemModal";
import { AddCalendarItemForm } from "@/components/month/AddCalendarItemForm";
import type { CalendarItem, CalendarItemType, Client, Task } from "@/lib/supabase/types";
import { dayTagLabel, dayTagColor } from "@/components/month/MonthGrid";
import { X, Pencil } from "lucide-react";
import { useState } from "react";

export function DayDetailModal({ open, onClose, dateStr, dateLabel, tasks, calendarItems = [], clients, getRelatedLabel, onChanged }: {
  open: boolean; onClose: () => void; dateStr: string | null; dateLabel: string;
  tasks: Task[]; calendarItems?: CalendarItem[]; clients: Client[];
  getRelatedLabel?: (t: Task) => string | undefined; onChanged: () => void;
}) {
  const openCount = tasks.filter((t) => t.status !== "done").length;
  const [addOpen, setAddOpen] = useState(false);
  const [addCalOpen, setAddCalOpen] = useState(false);
  const [calType, setCalType] = useState<CalendarItemType>("meeting");
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);

  async function handleDeleteItem(id: string) { await deleteCalendarItem(id); onChanged(); }

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-t-1">{dateLabel}</h2>
        <p className="text-xs text-t-3 mt-1">
          {tasks.length === 0 && calendarItems.length === 0 ? "אין פריטים ליום הזה" : `${tasks.length} משימות · ${openCount} פתוחות · ${calendarItems.length} פריטי יומן`}
        </p>
      </div>

      {calendarItems.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-t-3 font-medium">פריטי יומן</p>
          {calendarItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dayTagColor[item.type]}`}>{dayTagLabel[item.type]}</span>
                {item.start_time && <span className="text-xs text-t-3">{item.start_time}</span>}
                <span className="text-sm text-t-1">{item.title}</span>
                {item.notes && <span className="text-xs text-t-3">{item.notes}</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingItem(item)} className="text-t-3 hover:text-t-1 transition p-0.5"><Pencil size={13} /></button>
                <button onClick={() => handleDeleteItem(item.id)} className="text-t-3 hover:text-[#F87171] transition p-0.5"><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dateStr && (
        <div className="mb-4 space-y-2">
          <AddTaskTrigger onClick={() => setAddOpen(true)} />
          <TaskModal open={addOpen} onClose={() => setAddOpen(false)} clients={clients}
            defaultDueDate={dateStr} hideDueDate onCreated={onChanged} />
          {!addCalOpen ? (
            <button onClick={() => setAddCalOpen(true)}
              className="w-full text-right text-sm font-light text-t-3 hover:text-t-1 transition px-1 py-1">
              + פריט יומן חדש
            </button>
          ) : (
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(181,154,127,0.06)", border: "1px solid rgba(181,154,127,0.14)" }}>
              <div className="flex gap-1 flex-wrap">
                {(["meeting","shoot","event","holiday"] as CalendarItemType[]).map(t => (
                  <button key={t} type="button" onClick={() => setCalType(t)}
                    className="text-[11px] px-2 py-0.5 rounded-full transition"
                    style={calType === t
                      ? { background: "rgba(37,99,235,0.12)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.25)" }
                      : { background: "rgba(181,154,127,0.08)", color: "#9C8B7A", border: "1px solid transparent" }}>
                    {dayTagLabel[t]}
                  </button>
                ))}
                <button onClick={() => setAddCalOpen(false)} className="mr-auto text-[11px] text-t-4 hover:text-t-2 transition">ביטול</button>
              </div>
              <AddCalendarItemForm type={calType} date={dateStr} clients={clients}
                onCreated={() => { setAddCalOpen(false); onChanged(); }} />
            </div>
          )}
        </div>
      )}

      <div className="max-h-[45vh] overflow-y-auto">
        <TaskList tasks={tasks} clients={clients} getRelatedLabel={getRelatedLabel} onChanged={onChanged} emptyText="אין משימות ליום הזה 🌿" highlight />
      </div>
    </Modal>
    {editingItem && (
      <EditCalendarItemModal
        item={editingItem}
        clients={clients}
        onClose={() => setEditingItem(null)}
        onSaved={() => { setEditingItem(null); onChanged(); }}
      />
    )}
    </>
  );
}
