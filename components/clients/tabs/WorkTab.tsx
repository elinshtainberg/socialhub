"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { MiniCalendar, tagLabel } from "@/components/clients/MiniCalendar";
import { Modal } from "@/components/ui/Modal";
import { AddTaskTrigger, TaskModal } from "@/components/tasks/TaskModal";
import { TaskList } from "@/components/tasks/TaskList";
import { createCalendarItem, deleteCalendarItem, fetchCalendarItemsForMonth } from "@/lib/queries/calendarItems";
import { fetchTasks } from "@/lib/queries/tasks";
import type { CalendarItem, CalendarItemType, Task } from "@/lib/supabase/types";
import { parseLocalDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { dayTagColor } from "@/components/month/MonthGrid";
import { loadRules } from "@/lib/recurring";

// Calendar-item types this client's calendar deals with: content deliverables
// plus meeting/shoot. Holiday/event stay global-only (added from /month).
const clientTagOptions: CalendarItemType[] = ["post", "reel", "story", "tiktok", "other", "meeting", "shoot"];

// Everything Task and CalendarItem related for one client, in one place —
// no more daily/monthly/tasks split.
export function WorkTab({ clientId }: { clientId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addDayTaskOpen, setAddDayTaskOpen] = useState(false);

  const load = useCallback(async () => {
    const [i, t] = await Promise.all([
      fetchCalendarItemsForMonth(year, month, clientId),
      fetchTasks({ clientId }),
    ]);
    setItems(i); setTasks(t); setLoading(false);
  }, [clientId, year, month]);

  useEffect(() => { load(); }, [load]);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const dayItems = items.filter((e) => e.date === selectedDate);
  const dayTasks = tasks.filter((t) => t.due_date === selectedDate);
  const monthTasksWithDate = tasks.filter((t) => t.due_date);

  const recurringDays = useMemo(() => {
    const rules = loadRules(clientId);
    const days = new Set<number>();
    rules.forEach((r) => r.days.forEach((d) => days.add(d)));
    return days;
  }, [clientId]);

  async function addTag(tag: CalendarItemType) {
    if (!selectedDate || dayItems.some((e) => e.type === tag)) return;
    await createCalendarItem({ client_id: clientId, date: selectedDate, type: tag, title: tagLabel[tag] });
    load();
  }
  async function removeItem(id: string) { await deleteCalendarItem(id); load(); }

  const monthLabel = new Date(year, month).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const selectedDateLabel = selectedDate
    ? parseLocalDate(selectedDate).toLocaleDateString("he-IL", { day: "numeric", month: "long" })
    : "";

  if (loading) return <p className="text-sm text-t-3">טוען...</p>;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:calm-card-hover rounded-lg text-t-3 hover:text-t-1 transition"><ChevronRight size={18} /></button>
          <h3 className="text-sm font-semibold text-t-1">{monthLabel}</h3>
          <button onClick={() => changeMonth(1)} className="p-2 hover:calm-card-hover rounded-lg text-t-3 hover:text-t-1 transition"><ChevronLeft size={18} /></button>
        </div>
        <MiniCalendar year={year} month={month} items={items} tasks={monthTasksWithDate} recurringDays={recurringDays} onDayClick={setSelectedDate} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">משימות</p>
        </div>
        <AddTaskTrigger onClick={() => setAddTaskOpen(true)} />
        <TaskModal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} defaultCategory="client" defaultClientId={clientId} onCreated={load} />
        <div className="mt-3">
          <TaskList tasks={tasks} onChanged={load} emptyText="אין משימות ללקוח הזה עדיין" />
        </div>
      </div>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)}>
        <h3 className="text-sm font-semibold text-t-1 mb-4">{selectedDateLabel}</h3>

        <p className="text-xs text-t-3 font-medium mb-2">תוכן / יומן</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {clientTagOptions.map((tag) => (
            <button key={tag} onClick={() => addTag(tag)} disabled={dayItems.some((e) => e.type === tag)}
              className="text-xs rounded-lg px-3 py-1.5 font-medium transition disabled:opacity-30 calm-pill hover:text-t-2">
              + {tagLabel[tag]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 mb-5">
          {dayItems.length === 0 ? <p className="text-xs text-t-3">אין תיוגים ליום הזה</p> :
            dayItems.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(255,252,248,0.4)" }}>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dayTagColor[e.type]}`}>{tagLabel[e.type]}</span>
                <button onClick={() => removeItem(e.id)} className="text-t-3 hover:text-[#F87171] transition"><X size={14} /></button>
              </div>
            ))
          }
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-t-3 font-medium">משימות ליום הזה</p>
          <button onClick={() => setAddDayTaskOpen(true)} className="text-xs text-accent hover:opacity-80 transition">+ הוספת משימה</button>
        </div>
        <TaskList tasks={dayTasks} onChanged={load} emptyText="אין משימות ליום הזה" />
        {selectedDate && (
          <TaskModal open={addDayTaskOpen} onClose={() => setAddDayTaskOpen(false)}
            defaultCategory="client" defaultClientId={clientId} defaultDueDate={selectedDate} onCreated={load} />
        )}
      </Modal>
    </div>
  );
}
