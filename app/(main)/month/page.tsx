"use client";

import { Spinner } from "@/components/ui/Spinner";
import { useEffect, useMemo, useState, useCallback } from "react";
import { CalendarViewSwitcher } from "@/components/layout/CalendarViewSwitcher";
import { MonthGrid, dayTagLabel, dayTagButtonClass, dayTagStyle } from "@/components/month/MonthGrid";
import { AddCalendarItemForm } from "@/components/month/AddCalendarItemForm";
import { DayCalendarItemsList } from "@/components/month/DayCalendarItemsList";
import { TaskList } from "@/components/tasks/TaskList";
import { AddTaskTrigger, TaskModal } from "@/components/tasks/TaskModal";
import { fetchTasks } from "@/lib/queries/tasks";
import { fetchClients } from "@/lib/queries/clients";
import { fetchCalendarItemsForMonth } from "@/lib/queries/calendarItems";
import type { CalendarItem, CalendarItemType, Client, Task } from "@/lib/supabase/types";
import { parseLocalDate, todayISO } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Target, Camera, Users } from "lucide-react";

// Tasks and calendar items are strictly separate concepts — this is a
// top-level choice, not a flat list mixing both.
type AddMode = "task" | "calendar";
const calendarTypeOptions: CalendarItemType[] = ["event", "meeting", "shoot", "holiday", "post", "reel", "story", "tiktok", "other"];

export default function MonthPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayISO());
  const [addMode, setAddMode] = useState<AddMode>("task");
  const [calendarType, setCalendarType] = useState<CalendarItemType>("event");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    try {
      const [t, c, items] = await Promise.all([
        fetchTasks({ excludeDone: false }),
        fetchClients(),
        fetchCalendarItemsForMonth(year, month),
      ]);
      setTasks(t); setClients(c); setCalendarItems(items);
    } catch (e) {
      console.error("month load error", e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y); setSelectedDate(null);
  }

  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDate(todayISO()); }

  const monthLabel = new Date(year, month).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  function relatedLabel(task: Task) {
    if (task.category === "client") return clients.find((c) => c.id === task.client_id)?.name;
    return "אישי";
  }

  const allTasks = tasks;

  const selectedDayTasks = useMemo(
    () => (selectedDate ? allTasks.filter((t) => t.due_date === selectedDate) : []),
    [allTasks, selectedDate]
  );
  const selectedDayItems = useMemo(
    () => (selectedDate ? calendarItems.filter((c) => c.date === selectedDate) : []),
    [calendarItems, selectedDate]
  );
  const selectedDayLabel = selectedDate
    ? parseLocalDate(selectedDate).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })
    : null;

  function handleDayClick(dateStr: string) { setSelectedDate(dateStr); setAddMode("task"); }

  // ── Monthly stats ────────────────────────────────────────────
  const monthTasks   = tasks.filter((t) => t.due_date?.startsWith(monthPrefix));
  const completedCnt = monthTasks.filter((t) => t.status === "done").length;
  const totalTaskCnt = monthTasks.length;
  const pctComplete  = totalTaskCnt > 0 ? Math.round((completedCnt / totalTaskCnt) * 100) : 0;
  const shootDayCnt  = calendarItems.filter((c) => c.type === "shoot").length;
  const meetingCnt   = calendarItems.filter((c) => c.type === "meeting").length;

  return (
    <div>
      <CalendarViewSwitcher />
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-t-3 uppercase tracking-widest mb-1 font-medium">לוח חודשי</p>
          <h1 className="text-3xl font-bold text-t-1 tracking-tight">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl hover:calm-card text-t-3 hover:text-t-1 transition-all">
            <ChevronRight size={20} />
          </button>
          <button onClick={goToday} className="px-4 py-2 text-sm font-medium text-accent bg-black/[0.07] hover:bg-black/[0.11] rounded-xl transition-all">
            היום
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-xl hover:calm-card text-t-3 hover:text-t-1 transition-all">
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── Compact stats — visible without scrolling, right by the calendar ── */}
          <div className="flex items-center gap-6 flex-wrap mb-5 px-1">
            <CompactStat icon={<Target size={14} />} value={`${pctComplete}%`} label="הושלמו החודש" color="#5F8FAD" />
            <CompactStat icon={<Camera size={14} />} value={String(shootDayCnt)} label="ימי צילום" color="#C67D4E" />
            <CompactStat icon={<Users size={14} />} value={String(meetingCnt)} label="פגישות" color="#3E4640" />
          </div>

          {/* ── Main grid + day panel ──────────────────────────── */}
          <div className="flex flex-col md:grid md:grid-cols-[1fr_320px] gap-5 items-start mb-6">
            {/* Calendar */}
            <MonthGrid
              year={year} month={month} tasks={allTasks} calendarItems={calendarItems}
              selectedDate={selectedDate} onDayClick={handleDayClick}
            />

            {/* Day panel — desktop only */}
            <div className="hidden md:block rounded-2xl overflow-hidden sticky top-8"
              style={{ background: "rgba(255,252,248,0.34)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
              {/* Panel header */}
              <div className="px-4 pt-4 pb-3">
                <h2 className="text-sm font-medium text-t-1">{selectedDayLabel ?? "בחרי יום בלוח"}</h2>
                {selectedDate && (
                  <p className="text-xs text-t-3 mt-0.5">
                    {selectedDayTasks.length} משימות · {selectedDayItems.length} פריטי יומן
                  </p>
                )}
              </div>

              {selectedDate ? (
                <div className="max-h-[70vh] overflow-y-auto px-4 pb-4 space-y-4">
                  <div className="soft-divider" />

                  {/* Task vs calendar item — a top-level choice, not a flat list */}
                  <div>
                    <div className="flex gap-1.5 mb-2.5">
                      <button onClick={() => setAddMode("task")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        style={addMode === "task"
                          ? { background: "rgba(249,115,22,0.12)", color: "#EA6C00", border: "1px solid rgba(249,115,22,0.25)" }
                          : { background: "rgba(181,154,127,0.10)", color: "#9C8B7A", border: "1px solid transparent" }}>
                        משימה
                      </button>
                      <button onClick={() => setAddMode("calendar")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        style={addMode === "calendar"
                          ? { background: "rgba(37,99,235,0.10)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.25)" }
                          : { background: "rgba(181,154,127,0.10)", color: "#9C8B7A", border: "1px solid transparent" }}>
                        פריט יומן
                      </button>
                    </div>
                    {addMode === "calendar" && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {calendarTypeOptions.map((t) => (
                          <button key={t} onClick={() => setCalendarType(t)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                            style={calendarType === t
                              ? { background: dayTagStyle[t]?.bg ?? "rgba(156,144,120,0.20)", color: dayTagStyle[t]?.color ?? "#3D2F24", outline: `1.5px solid ${dayTagStyle[t]?.color ?? "#3D2F24"}`, outlineOffset: "-1px" }
                              : { background: dayTagStyle[t]?.bg ?? "rgba(156,144,120,0.08)", color: dayTagStyle[t]?.color ?? "#6B5B4C", opacity: 0.65 }}>
                            {dayTagLabel[t]}
                          </button>
                        ))}
                      </div>
                    )}
                    {addMode === "task" ? (
                      <>
                        <AddTaskTrigger onClick={() => setTaskModalOpen(true)} />
                        <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)}
                          clients={clients} defaultDueDate={selectedDate} onCreated={load} />
                      </>
                    ) : (
                      <AddCalendarItemForm key={`${selectedDate}-${calendarType}`} type={calendarType} date={selectedDate} clients={clients} onCreated={load} />
                    )}
                  </div>

                  {/* Existing calendar items */}
                  {selectedDayItems.length > 0 && (
                    <div>
                      <div className="soft-divider mb-4" />
                      <p className="text-[11px] text-t-3 uppercase tracking-wider mb-2.5 font-medium">פריטי יומן</p>
                      <DayCalendarItemsList items={selectedDayItems} clients={clients} onChanged={load} />
                    </div>
                  )}

                  {/* Tasks */}
                  <div>
                    <div className="soft-divider mb-4" />
                    <p className="text-[11px] text-t-3 uppercase tracking-wider mb-2.5 font-medium">
                      משימות {selectedDayTasks.length > 0 ? `· ${selectedDayTasks.length}` : ""}
                    </p>
                    <TaskList
                      tasks={selectedDayTasks} clients={clients}
                      getRelatedLabel={relatedLabel} onChanged={load}
                      emptyText="אין משימות ליום הזה" highlight
                    />
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-10 text-center">
                  <p className="text-t-3 text-sm">לחצי על יום בלוח כדי לראות ולהוסיף פריטים</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile bottom sheet */}
          {selectedDate && (
            <div className="md:hidden fixed inset-0 z-50" onClick={() => setSelectedDate(null)}>
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }} />
              <div className="absolute bottom-0 inset-x-0 rounded-t-3xl overflow-hidden max-h-[75vh] flex flex-col"
                style={{ background: "rgba(255,252,248,0.98)", backdropFilter: "blur(20px)" }}
                onClick={e => e.stopPropagation()}>
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-t-1">{selectedDayLabel}</h2>
                  <button onClick={() => setSelectedDate(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-t-3 hover:text-t-1 calm-card transition">✕</button>
                </div>
                <div className="overflow-y-auto px-5 pb-8 space-y-4 flex-1">
                  <div className="soft-divider" />
                  <div>
                    <div className="flex gap-1.5 mb-2.5">
                      <button onClick={() => setAddMode("task")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        style={addMode === "task"
                          ? { background: "rgba(249,115,22,0.12)", color: "#EA6C00", border: "1px solid rgba(249,115,22,0.25)" }
                          : { background: "rgba(181,154,127,0.10)", color: "#9C8B7A", border: "1px solid transparent" }}>
                        משימה
                      </button>
                      <button onClick={() => setAddMode("calendar")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        style={addMode === "calendar"
                          ? { background: "rgba(37,99,235,0.10)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.25)" }
                          : { background: "rgba(181,154,127,0.10)", color: "#9C8B7A", border: "1px solid transparent" }}>
                        פריט יומן
                      </button>
                    </div>
                    {addMode === "calendar" && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {calendarTypeOptions.map((t) => (
                          <button key={t} onClick={() => setCalendarType(t)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${calendarType === t ? dayTagButtonClass[t] : "calm-pill text-t-3"}`}>
                            {dayTagLabel[t]}
                          </button>
                        ))}
                      </div>
                    )}
                    {addMode === "task" ? (
                      <>
                        <AddTaskTrigger onClick={() => setTaskModalOpen(true)} />
                        <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)}
                          clients={clients} defaultDueDate={selectedDate} onCreated={load} />
                      </>
                    ) : (
                      <AddCalendarItemForm key={`${selectedDate}-${calendarType}-mobile`} type={calendarType} date={selectedDate} clients={clients} onCreated={load} />
                    )}
                  </div>
                  {selectedDayItems.length > 0 && (
                    <div>
                      <div className="soft-divider mb-4" />
                      <p className="text-[11px] text-t-3 uppercase tracking-wider mb-2.5 font-medium">פריטי יומן</p>
                      <DayCalendarItemsList items={selectedDayItems} clients={clients} onChanged={load} />
                    </div>
                  )}
                  <div>
                    <div className="soft-divider mb-4" />
                    <p className="text-[11px] text-t-3 uppercase tracking-wider mb-2.5 font-medium">
                      משימות {selectedDayTasks.length > 0 ? `· ${selectedDayTasks.length}` : ""}
                    </p>
                    <TaskList tasks={selectedDayTasks} clients={clients}
                      getRelatedLabel={relatedLabel} onChanged={load} emptyText="אין משימות ליום הזה" highlight />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CompactStat({ icon, value, label, color }: {
  icon: React.ReactNode; value: string; label: string; color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color }} className="opacity-90">{icon}</span>
      <span className="text-base font-medium text-t-1">{value}</span>
      <span className="text-xs text-t-3">{label}</span>
    </div>
  );
}
