"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Star } from "lucide-react";
import Link from "next/link";
import { CalendarViewSwitcher } from "@/components/layout/CalendarViewSwitcher";
import { AddTaskTrigger, TaskModal } from "@/components/tasks/TaskModal";
import { TodayTaskCard } from "@/components/tasks/TodayTaskCard";
import { fetchTasks, reorderTasks } from "@/lib/queries/tasks";
import { fetchClients } from "@/lib/queries/clients";
import { fetchCalendarItemsForRange } from "@/lib/queries/calendarItems";
import type { CalendarItem, Client, Task } from "@/lib/supabase/types";
import { getDueToday, markDone, unmarkDone, isDone, getMonthlyTasksDueToday, type RecurringItem, type MonthlyTaskItem } from "@/lib/recurring";
import { todayISO, localDateStr } from "@/lib/utils";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

const evLabel: Record<string, string> = {
  meeting: "פגישה", shoot: "יום צילום", holiday: "חג", event: "אירוע",
};

function workloadLabel(n: number): { text: string; color: string } {
  if (n <= 2) return { text: "יום שקט", color: "#16A34A" };
  if (n <= 5) return { text: "עומס בינוני", color: "#D97706" };
  return { text: "יום עמוס", color: "#DC2626" };
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orderedOpenIds, setOrderedOpenIds] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`focus-task-${todayISO()}`);
  });
  const [undoTask, setUndoTask] = useState<Task | null>(null);
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem(`completed-today-${todayISO()}`);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  });

  function markCompletedToday(id: string) {
    setCompletedTodayIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(`completed-today-${todayISO()}`, JSON.stringify([...next]));
      return next;
    });
  }
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [recurringDone, setRecurringDone] = useState<Record<string, boolean>>({});
  const [monthlyItems, setMonthlyItems] = useState<MonthlyTaskItem[]>([]);
  const [monthlyDone, setMonthlyDone] = useState<Record<string, boolean>>({});
  const [todayContent, setTodayContent] = useState<CalendarItem[]>([]);
  const [contentDone, setContentDone] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(`content-done-${todayISO()}`) ?? "{}"); } catch { return {}; }
  });

  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [dragOverId2, setDragOverId2] = useState<string | null>(null);
  const dragId      = useRef<string | null>(null);
  const dragOverId  = useRef<string | null>(null);
  const handleDown  = useRef(false);

  const today = todayISO();
  const in7days = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return localDateStr(d); })();

  const load = useCallback(async () => {
    try {
      const [t, c, e] = await Promise.all([
        fetchTasks({ excludeDone: false }),
        fetchClients(),
        fetchCalendarItemsForRange(today, in7days),
      ]);
      setTasks(t); setClients(c);
      setEvents(e.filter(i => ["meeting","shoot","holiday","event"].includes(i.type)));
      setTodayContent(e.filter(i => ["post","reel","story","tiktok","other"].includes(i.type) && i.date === today && i.client_id));

      setOrderedOpenIds(prev => {
        const today = todayISO();
        const openIds = t.filter(x => x.status !== "done" && x.due_date && x.due_date <= today).sort((a,b) => a.sort_order - b.sort_order).map(x => x.id);
        const stored  = typeof window !== "undefined" ? (JSON.parse(localStorage.getItem(`today-order-${todayISO()}`) ?? "null") as string[] | null) : null;
        const base    = stored ?? (prev.length > 0 ? prev : openIds);
        const merged  = base.filter((id: string) => openIds.includes(id));
        openIds.forEach((id: string) => { if (!merged.includes(id)) merged.push(id); });
        return merged;
      });

      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayOfMonth = now.getDate();
      const due = getDueToday(c.map(cl => ({ id: cl.id, name: cl.name })), dayOfWeek);
      setRecurringItems(due);
      const doneMap: Record<string, boolean> = {};
      due.forEach(item => { doneMap[item.id] = isDone(item.id, todayISO()); });
      setRecurringDone(doneMap);

      const monthlyDue = getMonthlyTasksDueToday(c.map(cl => ({ id: cl.id, name: cl.name })), dayOfMonth);
      setMonthlyItems(monthlyDue);
      const monthlyDoneMap: Record<string, boolean> = {};
      monthlyDue.forEach(item => { monthlyDoneMap[item.id] = isDone(item.id, todayISO()); });
      setMonthlyDone(monthlyDoneMap);
    } catch (e) {
      console.error("today load error", e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  function toggleFocus(id: string) {
    setFocusId(prev => {
      const next = prev === id ? null : id;
      const key  = `focus-task-${todayISO()}`;
      if (next) sessionStorage.setItem(key, next); else sessionStorage.removeItem(key);
      return next;
    });
  }

  const openTasks = orderedOpenIds.map(id => tasks.find(t => t.id === id)).filter((t): t is Task => !!t);
  const doneTasks = tasks.filter(t => t.status === "done" && (t.due_date === today || completedTodayIds.has(t.id)));
  const totalDayTasks = openTasks.length + doneTasks.length;
  const listTasks = openTasks.filter(t => t.id !== focusId);
  const focusTask = focusId ? tasks.find(t => t.id === focusId && t.status !== "done") : null;


  const upcomingUrgent = tasks.filter(t =>
    t.status !== "done" && t.priority === "urgent" && t.due_date && t.due_date > today && t.due_date <= in7days
  ).sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  const todayEvents = events.filter(e => e.date === today);
  const upcomingEvents = events.filter(e => e.date > today && e.date <= in7days);
  const hasUpcoming = upcomingUrgent.length > 0 || upcomingEvents.length > 0;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);

  const dayNum    = now.getDate();
  const weekday   = now.toLocaleDateString("he-IL", { weekday: "long" });
  const monthYear = now.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const timeStr   = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
  const hour      = now.getHours();
  const greeting  = hour < 5 ? "לילה טוב" : hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";

  function onDragStart(e: React.DragEvent, id: string) {
    if (!handleDown.current) { e.preventDefault(); return; }
    dragId.current = id; setDraggingId(id);
  }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault(); dragOverId.current = id; setDragOverId2(id);
  }
  function onDrop() {
    const from = dragId.current; const to = dragOverId.current;
    setDraggingId(null); setDragOverId2(null);
    if (!from || !to || from === to) { dragId.current = null; dragOverId.current = null; return; }
    setOrderedOpenIds(prev => {
      const next = [...prev];
      const fi = next.indexOf(from); const ti = next.indexOf(to);
      if (fi === -1 || ti === -1) return prev;
      next.splice(fi, 1); next.splice(ti, 0, from);
      reorderTasks(next);
      if (typeof window !== "undefined") localStorage.setItem(`today-order-${todayISO()}`, JSON.stringify(next));
      return next;
    });
    dragId.current = null; dragOverId.current = null;
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <CalendarViewSwitcher />

      {/* ── Editorial header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-10">
        {/* Date — dominant typographic element */}
        <div>
          <div className="flex items-baseline gap-4">
            <span className="text-[88px] font-thin leading-none tracking-tighter text-t-1 tabular-nums">{dayNum}</span>
            <div className="pb-2">
              <p className="text-xl font-light text-t-1 leading-tight">{weekday}</p>
              <p className="text-sm font-light text-t-4 mt-0.5">{monthYear}</p>
            </div>
          </div>
        </div>

        {/* Clock + context */}
        <div className="flex items-end gap-4 pb-1">
          <div className="text-left">
            <p className="text-[10px] font-medium text-t-4 uppercase tracking-[0.12em] mb-1">{greeting}</p>
            <p className="text-[42px] font-thin leading-none tracking-tight text-t-1 tabular-nums">{timeStr}</p>
            <p className="text-xs mt-1.5 font-light" style={{ color: workloadLabel(totalDayTasks).color }}>{workloadLabel(totalDayTasks).text}</p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="mb-1 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "#111110", color: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.22)" }}>
            <Plus size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Radar chips — contextual awareness, not tasks ─── */}
      {hasUpcoming && (() => {
        const evLabels: Record<string, string> = { meeting: "פגישה", shoot: "📷", holiday: "🎉", event: "אירוע" };
        const allChips = [
          ...upcomingEvents.map(ev => ({
            key: ev.id,
            label: `${evLabels[ev.type] ?? ev.type} ${ev.title ?? ""}`.trim(),
            days: Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000),
            urgent: false,
          })),
          ...upcomingUrgent.map(t => ({
            key: t.id,
            label: `⚠ ${t.title}`,
            days: Math.ceil((new Date(t.due_date!).getTime() - new Date(today).getTime()) / 86400000),
            urgent: true,
          })),
        ].sort((a, b) => a.days - b.days);
        const visible = allChips.slice(0, 3);
        const extra = allChips.length - visible.length;
        return (
          <div className="flex flex-wrap gap-1.5 mb-6 -mt-6">
            {visible.map(c => (
              <span key={c.key} className="text-[11px] font-light px-2.5 py-1 rounded-full"
                style={c.urgent
                  ? { background: "rgba(220,38,38,0.07)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.18)" }
                  : { background: "rgba(37,99,235,0.08)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.18)" }}>
                {c.label} · עוד {c.days} ימים
              </span>
            ))}
            {extra > 0 && (
              <span className="text-[11px] font-light px-2.5 py-1 rounded-full"
                style={{ background: "rgba(156,144,120,0.10)", color: "#9C8B7A", border: "1px solid rgba(156,144,120,0.20)" }}>
                +{extra} נוספים
              </span>
            )}
          </div>
        );
      })()}

      <TaskModal open={addOpen} onClose={() => setAddOpen(false)} clients={clients}
        defaultDueDate={today} onCreated={load} />

      {undoTask && (
        <Toast message={`"${undoTask.title}" הושלמה`} undoLabel="ביטול"
          onUndo={async () => {
            const { updateTaskStatus } = await import("@/lib/queries/tasks");
            await updateTaskStatus(undoTask.id, "open");
            setUndoTask(null); load();
          }}
          onDismiss={() => setUndoTask(null)} />
      )}

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Focus task — elevated, distinct */}
          {focusTask && (
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: "#FEFDFB",
                borderRight: "3px solid rgba(194,74,26,0.55)",
                boxShadow: "0 2px 12px rgba(194,74,26,0.10), 0 1px 3px rgba(0,0,0,0.06)",
              }}>
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
                <Star size={9} fill="#C24A1A" className="text-[#C24A1A]" />
                <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#C24A1A]">מיקוד</span>
              </div>
              <TodayTaskCard task={focusTask} clients={clients}
                isFocus={true} onToggleFocus={() => toggleFocus(focusTask.id)} onChanged={load}
                onCompleted={t => { setUndoTask(t); markCompletedToday(t.id); setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "done" } : x)); }}
                onReopened={t => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "open" } : x))} />
            </div>
          )}

          {/* Recurring content */}
          {recurringItems.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#FEFDFB", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-3 border-b border-[rgba(28,18,8,0.05)]">
                <span className="text-[11px] font-medium text-t-4 uppercase tracking-[0.10em]">תוכן קבוע להיום</span>
              </div>
              {[...recurringItems].sort((a, b) => Number(!!recurringDone[a.id]) - Number(!!recurringDone[b.id])).map((item, i, arr) => {
                const done = recurringDone[item.id];
                return (
                  <div key={item.id}>
                    <div className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] ${done ? "opacity-40" : ""}`}>
                      <button onClick={() => {
                        const next = !done;
                        if (next) markDone(item.id, todayISO()); else unmarkDone(item.id, todayISO());
                        setRecurringDone(prev => ({ ...prev, [item.id]: next }));
                      }}
                        className={`w-[18px] h-[18px] rounded-full border shrink-0 flex items-center justify-center transition-all
                          ${done ? "bg-[#111110] border-[#111110]" : "border-black/20 hover:border-black/40"}`}>
                        {done && <span className="text-white text-[8px] leading-none">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/clients/${item.clientId}`} onClick={e => e.stopPropagation()}
                            className="text-[13px] font-medium text-t-1 hover:underline">{item.clientName}</Link>
                          <span className="text-[13px] font-light text-t-2">{item.label}</span>
                        </div>
                        <p className="text-[11px] text-t-4 mt-0.5">
                          {item.platform !== "all" ? `${item.platform} · ` : ""}{item.contentType}
                        </p>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="mx-4 border-b border-[rgba(28,18,8,0.05)]" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Monthly tasks due today */}
          {monthlyItems.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#FEFDFB", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-3 border-b border-[rgba(28,18,8,0.05)]">
                <span className="text-[11px] font-medium text-t-4 uppercase tracking-[0.10em]">משימות חודשיות להיום</span>
              </div>
              {[...monthlyItems].sort((a, b) => Number(!!monthlyDone[a.id]) - Number(!!monthlyDone[b.id])).map((item, i, arr) => {
                const done = monthlyDone[item.id];
                return (
                  <div key={item.id}>
                    <div className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] ${done ? "opacity-40" : ""}`}>
                      <button onClick={() => {
                        const next = !done;
                        if (next) markDone(item.id, todayISO()); else unmarkDone(item.id, todayISO());
                        setMonthlyDone(prev => ({ ...prev, [item.id]: next }));
                      }}
                        className={`w-[18px] h-[18px] rounded-full border shrink-0 flex items-center justify-center transition-all
                          ${done ? "bg-[#111110] border-[#111110]" : "border-black/20 hover:border-black/40"}`}>
                        {done && <span className="text-white text-[8px] leading-none">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/clients/${item.clientId}`} onClick={e => e.stopPropagation()}
                            className="text-[13px] font-medium text-t-1 hover:underline">{item.clientName}</Link>
                          <span className="text-[13px] font-light text-t-2">{item.label}</span>
                        </div>
                        <p className="text-[11px] text-t-4 mt-0.5">חוזר ביום {item.monthDay} לחודש</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="mx-4 border-b border-[rgba(28,18,8,0.05)]" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Scheduled content for today (from client calendars) */}
          {todayContent.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#FEFDFB", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-3 border-b border-[rgba(28,18,8,0.05)]">
                <span className="text-[11px] font-medium text-t-4 uppercase tracking-[0.10em]">תוכן ללקוחות היום</span>
              </div>
              {todayContent.map((item, i, arr) => {
                const done = contentDone[item.id];
                const clientName = clients.find(c => c.id === item.client_id)?.name ?? "";
                const typeLabel: Record<string, string> = { post: "פוסט", reel: "ריל", story: "סטורי", tiktok: "טיקטוק", other: "אחר" };
                return (
                  <div key={item.id}>
                    <div className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] ${done ? "opacity-40" : ""}`}>
                      <button onClick={() => {
                        const next = !done;
                        setContentDone(prev => {
                          const updated = { ...prev, [item.id]: next };
                          try { localStorage.setItem(`content-done-${today}`, JSON.stringify(updated)); } catch {}
                          return updated;
                        });
                      }}
                        className={`w-[18px] h-[18px] rounded-full border shrink-0 flex items-center justify-center transition-all
                          ${done ? "bg-[#111110] border-[#111110]" : "border-black/20 hover:border-black/40"}`}>
                        {done && <span className="text-white text-[8px] leading-none">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/clients/${item.client_id}`} onClick={e => e.stopPropagation()}
                            className="text-[13px] font-medium text-t-1 hover:underline">{clientName}</Link>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>
                            {typeLabel[item.type] ?? item.type}
                          </span>
                          {item.title && <span className="text-[13px] font-light text-t-3">{item.title}</span>}
                        </div>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="mx-4 border-b border-[rgba(28,18,8,0.05)]" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Main task list — ONE unified ceramic container ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#FEFDFB", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)" }}>

            {/* List header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(28,18,8,0.05)]">
              <span className="text-[11px] font-medium uppercase tracking-[0.10em]" style={{ color: "#F97316" }}>משימות פתוחות</span>
              {listTasks.length > 0 && <span className="text-[11px] text-t-4">{listTasks.length}</span>}
            </div>

            {/* Empty state */}
            {listTasks.length === 0 && !focusTask && (
              <div className="text-center py-14">
                <p className="text-3xl mb-3 opacity-30">🌿</p>
                <p className="text-sm font-light text-t-3">יום פנוי לגמרי</p>
              </div>
            )}
            {listTasks.length === 0 && focusTask && (
              <div className="px-4 py-4">
                <p className="text-[13px] font-light text-t-4 text-center">רק משימת המיקוד</p>
              </div>
            )}

            {/* Task rows */}
            {listTasks.map((task, i, arr) => (
              <div key={task.id}>
                <div
                  draggable
                  onMouseDown={e => { handleDown.current = !!(e.target as Element).closest("[data-drag-handle]"); }}
                  onDragStart={e => onDragStart(e, task.id)}
                  onDragOver={e => onDragOver(e, task.id)}
                  onDrop={onDrop}
                  onDragEnd={() => { handleDown.current = false; setDraggingId(null); setDragOverId2(null); }}
                  style={{
                    opacity: draggingId === task.id ? 0.35 : 1,
                    background: dragOverId2 === task.id && draggingId !== task.id ? "rgba(0,0,0,0.03)" : undefined,
                    transition: "opacity 0.15s, background 0.1s",
                  }}
                >
                  <TodayTaskCard task={task} clients={clients}
                    isFocus={false} onToggleFocus={() => toggleFocus(task.id)} onChanged={load}
                    onCompleted={t => { setUndoTask(t); markCompletedToday(t.id); setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "done" } : x)); }}
                    onReopened={t => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "open" } : x))} />
                </div>
                {i < arr.length - 1 && <div className="mx-4 border-b border-[rgba(28,18,8,0.05)]" />}
              </div>
            ))}

            {/* Inline add row */}
            <div className="border-t border-[rgba(28,18,8,0.05)]">
              <AddTaskTrigger onClick={() => setAddOpen(true)} label="הוספת משימה" />
            </div>
          </div>

          {/* Done tasks — quiet, below fold */}
          {doneTasks.length > 0 && (
            <div className="rounded-2xl overflow-hidden opacity-50"
              style={{ background: "#FEFDFB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-3 border-b border-[rgba(28,18,8,0.05)]">
                <span className="text-[11px] font-medium text-t-4 uppercase tracking-[0.10em]">הושלמו · {doneTasks.length}</span>
              </div>
              {doneTasks.map((task, i, arr) => (
                <div key={task.id}>
                  <TodayTaskCard task={task} clients={clients}
                    isFocus={false} onToggleFocus={() => {}} onChanged={load} />
                  {i < arr.length - 1 && <div className="mx-4 border-b border-[rgba(28,18,8,0.05)]" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events sidebar — quiet glass panel */}
        {todayEvents.length > 0 && (
          <div className="w-[148px] shrink-0 sticky top-10">
            <p className="text-[10px] font-medium text-t-4 uppercase tracking-[0.10em] mb-3">היום</p>
            <div className="flex flex-col gap-1.5">
              {todayEvents.map(ev => {
                const clientName = clients.find(c => c.id === ev.client_id)?.name;
                return (
                  <div key={ev.id} className="rounded-xl px-3 py-2.5"
                    style={{
                      background: "rgba(28,18,8,0.04)",
                      borderRight: "2px solid rgba(28,18,8,0.15)",
                    }}>
                    <span className="text-[10px] font-medium text-t-4 block mb-0.5 uppercase tracking-wide">
                      {evLabel[ev.type] ?? ev.type}
                    </span>
                    <p className="text-[12px] font-light text-t-1 leading-snug">{ev.title}</p>
                    {clientName && <p className="text-[11px] text-t-4 mt-0.5">{clientName}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
