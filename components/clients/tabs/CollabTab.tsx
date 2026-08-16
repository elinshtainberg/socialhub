"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, RefreshCw } from "lucide-react";
import { fetchCollabs, createCollab, updateCollab, deleteCollab } from "@/lib/queries/collabs";

type CollabStatus = "בדיון" | "אושר" | "פעיל" | "הסתיים" | "בוטל";
type Platform = "instagram" | "tiktok" | "youtube" | "אחר";

type Collab = {
  id: string;
  name: string;
  handle: string;       // @username only (no URL)
  platforms: Platform[]; // multi-select
  type: string;
  status: CollabStatus;
  lastPost: string;
  amount: string;
  notes: string;
};

const STATUSES: CollabStatus[] = ["בדיון", "אושר", "פעיל", "הסתיים", "בוטל"];
const STATUS_STYLE: Record<CollabStatus, string> = {
  "בדיון":  "bg-[#FBBF24]/15 text-[#FBBF24]",
  "אושר":   "bg-[#60655D]/15 text-[#60655D]",
  "פעיל":   "bg-[#4A6B50]/15 text-[#4A6B50]",
  "הסתיים": "bg-[rgba(181,154,127,0.1)] text-t-3",
  "בוטל":   "bg-[#F87171]/15 text-[#F87171]",
};

const PLATFORMS: { key: Platform; label: string; bg: string; buildUrl: (h: string) => string }[] = [
  { key: "instagram", label: "Instagram", bg: "#E1306C", buildUrl: h => `https://instagram.com/${h}` },
  { key: "tiktok",   label: "TikTok",    bg: "#010101", buildUrl: h => `https://tiktok.com/@${h}` },
  { key: "youtube",  label: "YouTube",   bg: "#FF0000", buildUrl: h => `https://youtube.com/@${h}` },
  { key: "אחר",      label: "אחר",       bg: "#9CA3AF", buildUrl: () => "" },
];

const TYPES = ["ספונסר", "קולאב", "שיתוף תוכן", "ברטר", "גיוון", "אחר"];

function cleanHandle(raw: string): string {
  if (!raw) return "";
  // extract username from URL if needed
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] ? `@${parts[0].replace("@", "")}` : raw;
  } catch {
    return raw.startsWith("@") ? raw : `@${raw}`;
  }
}

function usernameOnly(handle: string): string {
  return (handle ?? "").replace("@", "").trim();
}

function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function LastPostBadge({ date }: { date: string }) {
  const days = daysSince(date);
  if (days === null) return <span className="text-xs text-t-4">לא עודכן</span>;
  const color = days > 30 ? "#F87171" : days > 14 ? "#FBBF24" : "#4A6B50";
  const label = days === 0 ? "היום" : days === 1 ? "אתמול" : `לפני ${days} ימים`;
  return <span className="text-xs font-semibold" style={{ color }}>{label}</span>;
}

const BLANK: Omit<Collab, "id"> = {
  name: "", handle: "", platforms: ["instagram"],
  type: "קולאב", status: "בדיון",
  lastPost: "", amount: "", notes: "",
};

function CollabForm({
  initial, onSave, onCancel,
}: {
  initial: Omit<Collab, "id">;
  onSave: (d: Omit<Collab, "id">) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState(initial);

  function togglePlatform(key: Platform) {
    setD(p => {
      const has = p.platforms.includes(key);
      const next = has ? p.platforms.filter(k => k !== key) : [...p.platforms, key];
      return { ...p, platforms: next.length ? next : [key] }; // at least one
    });
  }

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4";
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`;

  return (
    <div className="calm-card rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-t-4 font-medium block mb-1.5">שם היוצר / מותג *</label>
          <input autoFocus value={d.name}
            onChange={e => setD(p => ({ ...p, name: e.target.value }))}
            placeholder="ליאור כהן" className={inputCls} />
        </div>
        <div>
          <label className="text-[11px] text-t-4 font-medium block mb-1.5">שם משתמש</label>
          <input value={d.handle}
            onChange={e => setD(p => ({ ...p, handle: e.target.value }))}
            placeholder="@lior_cohen" className={inputCls} />
          <p className="text-[10px] text-t-4 mt-1">רק שם המשתמש, ללא URL</p>
        </div>
      </div>

      <div>
        <label className="text-[11px] text-t-4 font-medium block mb-1.5">פלטפורמות (ניתן לבחור כמה)</label>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => {
            const active = d.platforms.includes(p.key);
            return (
              <button key={p.key} type="button" onClick={() => togglePlatform(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? "text-white" : "calm-card text-t-3 hover:text-t-1"}`}
                style={active ? { background: p.bg } : {}}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-t-4 font-medium block mb-1.5">סוג שיתוף</label>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(t => (
            <button key={t} type="button"
              onClick={() => setD(p => ({ ...p, type: t }))}
              className={chip(d.type === t)}>{t}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-t-4 font-medium block mb-1.5">סטטוס</label>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} type="button"
              onClick={() => setD(p => ({ ...p, status: s }))}
              className={chip(d.status === s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-t-4 font-medium block mb-1.5">שווי / תגמול</label>
          <input value={d.amount}
            onChange={e => setD(p => ({ ...p, amount: e.target.value }))}
            placeholder="₪1,500 / ברטר" className={inputCls} />
        </div>
        <div>
          <label className="text-[11px] text-t-4 font-medium block mb-1.5">פוסט אחרון שעלה</label>
          <input type="date" value={d.lastPost}
            onChange={e => setD(p => ({ ...p, lastPost: e.target.value }))}
            className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-[11px] text-t-4 font-medium block mb-1.5">הערות</label>
        <textarea value={d.notes}
          onChange={e => setD(p => ({ ...p, notes: e.target.value }))}
          placeholder="תנאים, הערות, לינקים..." rows={2}
          className={`${inputCls} resize-none`} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => onSave({ ...d, handle: cleanHandle(d.handle) })}
          disabled={!d.name.trim()}
          className="px-5 py-2 rounded-xl text-sm font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition">
          שמירה
        </button>
        <button onClick={onCancel} className="text-sm text-t-3 hover:text-t-1 transition">ביטול</button>
      </div>
    </div>
  );
}

function migrate(raw: Record<string, unknown>): Collab {
  const validPlatforms: Platform[] = ["instagram", "tiktok", "youtube", "אחר"];
  // normalize platforms array
  let platforms: Platform[];
  if (Array.isArray(raw.platforms)) {
    platforms = raw.platforms.filter((p: unknown) => validPlatforms.includes(p as Platform)) as Platform[];
  } else if (typeof raw.platform === "string" && validPlatforms.includes(raw.platform as Platform)) {
    platforms = [raw.platform as Platform];
  } else {
    platforms = ["אחר"];
  }
  if (!platforms.length) platforms = ["אחר"];

  const validStatuses: CollabStatus[] = ["בדיון","אושר","פעיל","הסתיים","בוטל"];

  return {
    id: String(raw.id ?? `collab-${Math.random()}`),
    name: String(raw.name ?? raw.partner ?? ""),
    handle: cleanHandle(String(raw.handle ?? "")),
    platforms,
    type: String(raw.type ?? "אחר"),
    status: validStatuses.includes(raw.status as CollabStatus) ? raw.status as CollabStatus : "בדיון",
    lastPost: String(raw.lastPost ?? raw.date ?? ""),
    amount: String(raw.amount ?? ""),
    notes: String(raw.notes ?? ""),
  };
}

function dbToCollab(row: import("@/lib/supabase/types").ClientCollab): Collab {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    platforms: (row.platforms ?? ["instagram"]) as Platform[],
    type: row.type,
    status: row.status as CollabStatus,
    lastPost: row.last_post ?? "",
    amount: row.amount,
    notes: row.notes,
  };
}

export function CollabTab({ clientId }: { clientId: string }) {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = await fetchCollabs(clientId);
      setCollabs(rows.map(dbToCollab));
    } catch (e) {
      console.error("collabs load error", e);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function addNew(d: Omit<Collab, "id">) {
    try {
      await createCollab(clientId, {
        name: d.name, handle: d.handle, platforms: d.platforms,
        type: d.type, status: d.status, last_post: d.lastPost || null,
        amount: d.amount, notes: d.notes,
      });
      setAdding(false);
      load();
    } catch (e) { console.error("createCollab error", e); }
  }

  async function saveEdit(id: string, d: Omit<Collab, "id">) {
    try {
      await updateCollab(id, {
        name: d.name, handle: d.handle, platforms: d.platforms,
        type: d.type, status: d.status, last_post: d.lastPost || null,
        amount: d.amount, notes: d.notes,
      });
      setEditingId(null);
      load();
    } catch (e) { console.error("updateCollab error", e); }
  }

  async function markPostedToday(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await updateCollab(id, { last_post: today });
      load();
    } catch (e) { console.error("markPostedToday error", e); }
  }

  async function removeCollab(id: string) {
    try {
      await deleteCollab(id);
      load();
    } catch (e) { console.error("deleteCollab error", e); }
  }

  if (loading) return <p className="text-sm text-t-3">טוען...</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-t-1">שיתופי פעולה וספונסרים</p>
          <p className="text-xs text-t-4 mt-0.5">מעקב אחר קולאבים, ברטרים ודילים</p>
        </div>
        {!adding && !editingId && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80 transition">
            <Plus size={13} /> הוספה
          </button>
        )}
      </div>

      {adding && (
        <CollabForm initial={BLANK} onSave={addNew} onCancel={() => setAdding(false)} />
      )}

      {collabs.length === 0 && !adding && (
        <p className="text-sm text-t-3 text-center py-10">אין שיתופי פעולה עדיין</p>
      )}

      <div className="space-y-3">
        {collabs.map(c => {
          if (editingId === c.id) {
            return (
              <CollabForm key={c.id}
                initial={{ name: c.name, handle: c.handle, platforms: c.platforms, type: c.type, status: c.status, lastPost: c.lastPost, amount: c.amount, notes: c.notes }}
                onSave={d => saveEdit(c.id, d)}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          const h = usernameOnly(c.handle);

          return (
            <div key={c.id} className="calm-card rounded-2xl px-5 py-4 group">
              {/* Top row: name + handle + platform links + type + status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-t-1">{c.name}</span>
                    {c.handle && (
                      <span className="text-xs text-t-3">{c.handle}</span>
                    )}
                  </div>

                  {/* Platform badges — each is a clickable link to the profile */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {c.platforms.map(pk => {
                      const plat = PLATFORMS.find(p => p.key === pk) ?? PLATFORMS[PLATFORMS.length - 1];
                      const url = h ? plat.buildUrl(h) : "";
                      const badge = (
                        <span key={pk}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ background: plat.bg }}>
                          {plat.label}
                        </span>
                      );
                      return url ? (
                        <a key={pk} href={url} target="_blank" rel="noopener noreferrer"
                          title={`פתח פרופיל ${plat.label}`}>
                          {badge}
                        </a>
                      ) : badge;
                    })}
                    <span className="text-[10px] px-2 py-0.5 rounded-full calm-card text-t-3 font-medium">{c.type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                    {c.amount && (
                      <span className="text-[10px] text-t-4">{c.amount}</span>
                    )}
                  </div>
                </div>

                {/* Edit/delete — visible on hover */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setEditingId(c.id)}
                    className="p-1.5 rounded-lg text-t-4 hover:text-accent hover:calm-card transition">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => removeCollab(c.id)}
                    className="p-1.5 rounded-lg text-t-4 hover:text-[#F87171] hover:calm-card transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Last post tracker */}
              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(181,154,127,0.08)" }}>
                <span className="text-xs text-t-3 shrink-0">פוסט אחרון:</span>
                <LastPostBadge date={c.lastPost} />
                {c.lastPost && (
                  <span className="text-xs text-t-4">
                    ({new Date(c.lastPost).toLocaleDateString("he-IL")})
                  </span>
                )}
                <div className="flex-1" />
                <button onClick={() => markPostedToday(c.id)}
                  className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition font-medium shrink-0">
                  <RefreshCw size={11} /> עלה היום
                </button>
              </div>

              {c.notes && <p className="text-xs text-t-4 mt-2">{c.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
