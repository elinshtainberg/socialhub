"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, CalendarClock } from "lucide-react";
import { loadRules, saveRules, type RecurringRule, loadMonthlyTasks, saveMonthlyTasks, type MonthlyTask } from "@/lib/recurring";
import type { SocialPlatform, ContentType } from "@/lib/supabase/types";

const DAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const WEEKDAYS = [0, 1, 2, 3, 4]; // ראשון-חמישי

const platforms: { value: SocialPlatform | "all"; label: string }[] = [
  { value: "all",       label: "כל הפלטפורמות" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "facebook",  label: "Facebook" },
];

const contentTypes: { value: ContentType; label: string }[] = [
  { value: "story", label: "סטורי" },
  { value: "post",  label: "פוסט" },
  { value: "reel",  label: "ריל" },
];

const btnCls = (active: boolean) =>
  `px-2.5 py-1 rounded-lg text-xs font-medium transition ${active ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`;

export function RecurringTab({ clientId }: { clientId: string }) {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | "all">("instagram");
  const [contentType, setContentType] = useState<ContentType>("story");
  const [days, setDays] = useState<number[]>(WEEKDAYS);

  // Monthly tasks
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [addingMonthly, setAddingMonthly] = useState(false);
  const [editingMonthlyId, setEditingMonthlyId] = useState<string | null>(null);
  const [monthlyLabel, setMonthlyLabel] = useState("");
  const [monthDay, setMonthDay] = useState(1);

  useEffect(() => {
    setRules(loadRules(clientId));
    setMonthlyTasks(loadMonthlyTasks(clientId));
  }, [clientId]);

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  function startEdit(rule: RecurringRule) {
    setEditingId(rule.id);
    setLabel(rule.label);
    setPlatform(rule.platform);
    setContentType(rule.contentType);
    setDays(rule.days);
    setAdding(false);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setLabel(""); setPlatform("instagram"); setContentType("story"); setDays(WEEKDAYS);
  }

  function addRule() {
    if (!label.trim() || days.length === 0) return;
    const next = [...rules, { id: `rec-${Date.now()}`, label: label.trim(), platform, contentType, days }];
    setRules(next);
    saveRules(clientId, next);
    cancelForm();
  }

  function saveEdit() {
    if (!label.trim() || days.length === 0 || !editingId) return;
    const next = rules.map(r => r.id === editingId ? { ...r, label: label.trim(), platform, contentType, days } : r);
    setRules(next);
    saveRules(clientId, next);
    cancelForm();
  }

  function deleteRule(id: string) {
    const next = rules.filter(r => r.id !== id);
    setRules(next);
    saveRules(clientId, next);
  }

  const dayName = (d: number) => ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"][d];

  function cancelMonthlyForm() {
    setAddingMonthly(false); setEditingMonthlyId(null);
    setMonthlyLabel(""); setMonthDay(1);
  }

  function addMonthlyTask() {
    if (!monthlyLabel.trim()) return;
    const next = [...monthlyTasks, { id: `monthly-${Date.now()}`, label: monthlyLabel.trim(), monthDay }];
    setMonthlyTasks(next); saveMonthlyTasks(clientId, next); cancelMonthlyForm();
  }

  function saveMonthlyEdit() {
    if (!monthlyLabel.trim() || !editingMonthlyId) return;
    const next = monthlyTasks.map(t => t.id === editingMonthlyId ? { ...t, label: monthlyLabel.trim(), monthDay } : t);
    setMonthlyTasks(next); saveMonthlyTasks(clientId, next); cancelMonthlyForm();
  }

  function startEditMonthly(task: MonthlyTask) {
    setEditingMonthlyId(task.id); setMonthlyLabel(task.label); setMonthDay(task.monthDay);
    setAddingMonthly(false);
  }

  function deleteMonthlyTask(id: string) {
    const next = monthlyTasks.filter(t => t.id !== id);
    setMonthlyTasks(next); saveMonthlyTasks(clientId, next);
  }

  const ordinalHe = (n: number) => {
    if (n === 1) return "ה-1 לחודש";
    if (n === 2) return "ה-2 לחודש";
    return `ה-${n} לחודש`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-t-1">תוכן קבוע שבועי</p>
          <p className="text-xs text-t-4 mt-0.5">כללים שמופיעים אוטומטית בעמוד "היום שלי" בימים המתאימים</p>
        </div>
        {!adding && !editingId && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition font-medium">
            <Plus size={14} /> כלל חדש
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(adding || editingId) && (
        <div className="calm-card rounded-2xl p-4 space-y-3">
          <input value={label} onChange={e => setLabel(e.target.value)} autoFocus
            placeholder='תיאור, לדוגמה: "סטורי יומי"'
            className="w-full rounded-xl px-3 py-2 text-sm text-t-1 focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 calm-card" />

          <div>
            <p className="text-[11px] text-t-4 mb-1.5">פלטפורמה</p>
            <div className="flex gap-1.5 flex-wrap">
              {platforms.map(p => (
                <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
                  className={btnCls(platform === p.value)}>{p.label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-t-4 mb-1.5">סוג תוכן</p>
            <div className="flex gap-1.5">
              {contentTypes.map(t => (
                <button key={t.value} type="button" onClick={() => setContentType(t.value)}
                  className={btnCls(contentType === t.value)}>{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-t-4 mb-1.5">ימים בשבוע</p>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((d, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${days.includes(i) ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`}>
                  {d}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setDays(days.length === WEEKDAYS.length ? [] : [...WEEKDAYS])}
              className="mt-1.5 text-[11px] text-t-4 hover:text-accent transition">
              {days.length === WEEKDAYS.length ? "ביטול כל הימים" : "ראשון–חמישי"}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={editingId ? saveEdit : addRule} disabled={!label.trim() || days.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition">
              {editingId ? "שמירה" : "הוספה"}
            </button>
            <button onClick={cancelForm} className="text-xs text-t-3 hover:text-t-1 px-3 transition">ביטול</button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !adding ? (
        <p className="text-sm text-t-3 text-center py-8">אין כללים קבועים עדיין · הוסיפי את הראשון</p>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className="group calm-card rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-t-1">{rule.label}</p>
                <p className="text-[11px] text-t-4 mt-0.5">
                  {platforms.find(p => p.value === rule.platform)?.label} · {contentTypes.find(t => t.value === rule.contentType)?.label} · {rule.days.map(d => dayName(d)).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => startEdit(rule)} className="p-1.5 text-t-4 hover:text-accent transition">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-t-4 hover:text-[#F87171] transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Monthly tasks section ── */}
      <div className="pt-4 border-t" style={{ borderColor: "rgba(181,154,127,0.12)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-t-1 flex items-center gap-1.5">
              <CalendarClock size={14} className="text-t-3" /> משימות חודשיות
            </p>
            <p className="text-xs text-t-4 mt-0.5">מופיעות אוטומטית בעמוד "היום שלי" ביום המתאים בחודש</p>
          </div>
          {!addingMonthly && !editingMonthlyId && (
            <button onClick={() => setAddingMonthly(true)}
              className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition font-medium">
              <Plus size={14} /> משימה חדשה
            </button>
          )}
        </div>

        {/* Monthly add/edit form */}
        {(addingMonthly || editingMonthlyId) && (
          <div className="calm-card rounded-2xl p-4 space-y-3 mb-3">
            <input value={monthlyLabel} onChange={e => setMonthlyLabel(e.target.value)} autoFocus
              placeholder='תיאור, לדוגמה: "שליחת דוח חודשי"'
              className="w-full rounded-xl px-3 py-2 text-sm text-t-1 focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 calm-card" />
            <div>
              <p className="text-[11px] text-t-4 mb-1.5">יום בחודש</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button key={d} type="button" onClick={() => setMonthDay(d)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${monthDay === d ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={editingMonthlyId ? saveMonthlyEdit : addMonthlyTask}
                disabled={!monthlyLabel.trim()}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition">
                {editingMonthlyId ? "שמירה" : "הוספה"}
              </button>
              <button onClick={cancelMonthlyForm} className="text-xs text-t-3 hover:text-t-1 px-3 transition">ביטול</button>
            </div>
          </div>
        )}

        {monthlyTasks.length === 0 && !addingMonthly ? (
          <p className="text-sm text-t-3 text-center py-4">אין משימות חודשיות עדיין</p>
        ) : (
          <div className="space-y-2">
            {monthlyTasks.map(task => (
              <div key={task.id} className="group calm-card rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-t-1">{task.label}</p>
                  <p className="text-[11px] text-t-4 mt-0.5">חוזר כל {ordinalHe(task.monthDay)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => startEditMonthly(task)} className="p-1.5 text-t-4 hover:text-accent transition">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteMonthlyTask(task.id)} className="p-1.5 text-t-4 hover:text-[#F87171] transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
