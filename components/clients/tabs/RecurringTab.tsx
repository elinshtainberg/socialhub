"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { loadRules, saveRules, type RecurringRule } from "@/lib/recurring";
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

  useEffect(() => { setRules(loadRules(clientId)); }, [clientId]);

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
    </div>
  );
}
