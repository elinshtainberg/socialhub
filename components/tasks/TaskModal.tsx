"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Flame } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createTask } from "@/lib/queries/tasks";
import type { Client, TaskCategory } from "@/lib/supabase/types";

const cats: { value: TaskCategory; label: string }[] = [
  { value: "client", label: "לקוח" },
  { value: "personal", label: "אישי" },
];

const IS = { background: "rgba(255,252,248,0.62)", border: "1px solid rgba(181,154,127,0.16)", borderRadius: 10, color: "#33291F", width: "100%" };

const CONTENT_TYPES = [
  { value: "post",    label: "פוסט" },
  { value: "reel",    label: "ריל" },
  { value: "story",   label: "סטורי" },
  { value: "tiktok",  label: "טיקטוק" },
  { value: "other",   label: "אחר" },
];

// ─────────────────────────────────────────────────────────────────────────
// One trigger, two visual forms — both open the exact same TaskModal.
// "row"  → dashed inline invitation, used inside lists.
// "icon" → small soft circular button, used in page headers.
// ─────────────────────────────────────────────────────────────────────────
export function AddTaskTrigger({ variant = "row", label = "הוספת משימה", onClick }: {
  variant?: "row" | "icon"; label?: string; onClick: () => void;
}) {
  if (variant === "icon") {
    return (
      <button onClick={onClick} title={label}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
        style={{ background: "rgba(156,144,120,0.20)", color: "#5C3E6E" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(156,144,120,0.30)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(156,144,120,0.20)"; }}>
        <Plus size={18} />
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-light text-t-3 hover:text-t-2 transition-all duration-200"
      style={{ background: "rgba(255,252,248,0.5)", border: "1px dashed rgba(181,154,127,0.20)" }}>
      <Plus size={15} /> {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Single task-creation surface for the whole app. Same fields, same order,
// everywhere: title → category (if not locked) → contextual extras.
// ─────────────────────────────────────────────────────────────────────────
export function TaskModal({ open, onClose, clients = [], defaultCategory, defaultClientId,
  defaultDueDate, onCreated }: {
  open: boolean; onClose: () => void; clients?: Client[];
  defaultCategory?: TaskCategory; defaultClientId?: string;
  defaultDueDate?: string; onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<TaskCategory>(defaultCategory ?? "client");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [dueDate, setDueDate] = useState(defaultDueDate ?? "");
  const [urgent, setUrgent] = useState(false);
  const [contentType, setContentType] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(""); setUrgent(false); setContentType("");
      setCat(defaultCategory ?? "client");
      setClientId(defaultClientId ?? "");
      setDueDate(defaultDueDate ?? "");
      setTimeout(() => ref.current?.focus(), 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        title: title.trim(), category: cat,
        client_id: cat === "client" ? clientId || null : null,
        due_date: dueDate || null,
        priority: urgent ? "urgent" : "medium",
        workout_type: cat === "client" && contentType ? contentType : null,
      });
      onCreated?.();
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-light mb-5" style={{ color: "#2563EB" }}>משימה חדשה</h2>
      <form onSubmit={submit} className="space-y-3">
        <input ref={ref} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="מה צריך לעשות?" className="calm-input px-4 py-2.5 text-sm" style={{ width: "100%" }} />

        {!defaultCategory && (
          <div className="flex gap-1 flex-wrap">
            {cats.map((c) => (
              <button type="button" key={c.value} onClick={() => setCat(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-all ${cat === c.value ? "accent-pill" : "calm-pill cursor-pointer hover:text-t-2"}`}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {cat === "client" && !defaultClientId && (
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="px-4 py-2.5 text-sm font-light rounded-xl" style={IS}>
            <option value="">בחר/י לקוח</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {cat === "client" && (
          <div className="flex gap-1.5 flex-wrap">
            {CONTENT_TYPES.map(t => (
              <button type="button" key={t.value}
                onClick={() => setContentType(prev => prev === t.value ? "" : t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contentType === t.value ? "accent-pill" : "calm-pill text-t-3 hover:text-t-2"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="text-[11px] font-medium mb-1.5 tracking-wide" style={{ color: "#9C8B7A" }}>
            עד תאריך <span className="font-light opacity-60">(ריק = משימה פתוחה)</span>
          </p>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="px-4 py-2.5 text-sm font-light calm-input" style={{ color: "#5C4C3F", width: "100%" }} />
        </div>

        <button type="button" onClick={() => setUrgent((u) => !u)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
          style={urgent
            ? { background: "rgba(220,38,38,0.12)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)" }
            : { background: "rgba(181,154,127,0.10)", color: "#9C8B7A", border: "1px solid transparent" }}>
          <Flame size={12} /> דחוף
        </button>

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving || !title.trim()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 font-normal disabled:opacity-35 select-none transition-all duration-200 px-5 py-2.5 text-sm rounded-[var(--r-md)]"
            style={{ background: "#2563EB", color: "#fff", border: "none", boxShadow: "0 1px 3px rgba(37,99,235,0.30)" }}>
            {saving ? "שומר..." : "הוספה"}
          </button>
          <button type="button" onClick={onClose} className="text-sm font-light text-t-3 px-4 hover:text-t-2 transition-colors">ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
