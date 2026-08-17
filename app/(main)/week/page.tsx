"use client";

import { Spinner } from "@/components/ui/Spinner";
import { useEffect, useState, useMemo } from "react";
import { CalendarViewSwitcher } from "@/components/layout/CalendarViewSwitcher";
import { PageHeader } from "@/components/layout/PageHeader";
import { WeekGrid } from "@/components/week/WeekGrid";
import { DayDetailModal } from "@/components/week/DayDetailModal";
import { fetchTasks } from "@/lib/queries/tasks";
import { fetchClients } from "@/lib/queries/clients";
import { fetchCalendarItemsForRange } from "@/lib/queries/calendarItems";
import type { CalendarItem, Client, Task } from "@/lib/supabase/types";
import { localDateStr, parseLocalDate } from "@/lib/utils";
import { getDueToday, type RecurringItem } from "@/lib/recurring";
import { useGoogleCalendarEvents } from "@/lib/google/useGoogleSync";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getWeekStart(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekStartStr = localDateStr(weekDates[0]);
  const weekEndStr = localDateStr(weekDates[6]);

  async function load() {
    try {
      const [t, c, items] = await Promise.all([
        fetchTasks({ excludeDone: false }),
        fetchClients(),
        fetchCalendarItemsForRange(weekStartStr, weekEndStr),
      ]);
      setTasks(t); setClients(c); setCalendarItems(items);
    } catch (e) {
      console.error("week load error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartStr]);

  function changeWeek(delta: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  }

  function relatedLabel(task: Task) {
    if (task.category === "client") return clients.find((c) => c.id === task.client_id)?.name;
    return undefined;
  }

  const rangeLabel = `${weekDates[0].toLocaleDateString("he-IL", { day: "numeric", month: "short" })} - ${weekDates[6].toLocaleDateString("he-IL", { day: "numeric", month: "short" })}`;

  const weekOpenCount = tasks.filter(
    (t) => t.status !== "done" && t.due_date && weekDates.some((d) => localDateStr(d) === t.due_date)
  ).length;

  const selectedDayTasks = useMemo(
    () => (selectedDate ? tasks.filter((t) => t.due_date === selectedDate) : []),
    [tasks, selectedDate]
  );

  const selectedDayItems = useMemo(
    () => (selectedDate ? calendarItems.filter((c) => c.date === selectedDate) : []),
    [calendarItems, selectedDate]
  );

  const weekRecurring: RecurringItem[][] = weekDates.map((d) =>
    getDueToday(clients.map((c) => ({ id: c.id, name: c.name })), d.getDay())
  );

  const { events: googleEvents } = useGoogleCalendarEvents(weekStartStr, weekEndStr);
  const allCalendarItems = [...calendarItems, ...googleEvents];

  const selectedDayLabel = selectedDate
    ? parseLocalDate(selectedDate).toLocaleDateString("he-IL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <div>
      <CalendarViewSwitcher />
      <PageHeader
        title="שבוע"
        subtitle={<>{rangeLabel} · <span style={{ color: "#F97316" }}>{weekOpenCount} משימות פתוחות השבוע</span></>}
        action={
          <div className="flex gap-1">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:calm-card rounded-lg text-t-3 hover:text-t-1 transition">
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setWeekStart(getWeekStart(new Date()))}
              className="px-3 py-2 text-xs text-accent hover:calm-card rounded-lg transition"
            >
              השבוע הנוכחי
            </button>
            <button onClick={() => changeWeek(1)} className="p-2 hover:calm-card rounded-lg text-t-3 hover:text-t-1 transition">
              <ChevronLeft size={18} />
            </button>
          </div>
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <WeekGrid
          weekDates={weekDates}
          tasks={tasks}
          calendarItems={allCalendarItems}
          weekRecurring={weekRecurring}
          selectedDate={selectedDate}
          clients={clients}
          getRelatedLabel={relatedLabel}
          onDayClick={setSelectedDate}
        />
      )}

      <DayDetailModal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        dateStr={selectedDate}
        dateLabel={selectedDayLabel}
        tasks={selectedDayTasks}
        calendarItems={selectedDayItems}
        clients={clients}
        getRelatedLabel={relatedLabel}
        onChanged={load}
      />
    </div>
  );
}
