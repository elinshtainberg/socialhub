"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

type MediaType = "סרט" | "סדרה" | "ספר" | "פודקאסט";
type MediaStatus = "רוצה" | "ב-אמצע" | "סיימתי";
type MediaItem = { id: string; title: string; type: MediaType; status: MediaStatus };

const KEY = "personal-watchread";
const TYPES: MediaType[] = ["סרט", "סדרה", "ספר", "פודקאסט"];
const STATUSES: MediaStatus[] = ["רוצה", "ב-אמצע", "סיימתי"];
const TYPE_EMOJI: Record<MediaType, string> = { "סרט": "🎬", "סדרה": "📺", "ספר": "📚", "פודקאסט": "🎙️" };
const STATUS_STYLE: Record<MediaStatus, string> = {
  "רוצה":    "bg-[#9CA3AF]/15 text-[#9CA3AF]",
  "ב-אמצע":  "bg-[#FBBF24]/15 text-[#FBBF24]",
  "סיימתי":  "bg-[#4A6B50]/15 text-[#4A6B50]",
};

export function watchReadCount(): number {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").filter((i: MediaItem) => i.status !== "סיימתי").length; } catch { return 0; }
}

export function WatchReadList() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("סרט");
  const [filter, setFilter] = useState<MediaType | "הכל">("הכל");

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {}
  }, []);

  function persist(next: MediaItem[]) {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function add() {
    if (!title.trim()) return;
    persist([{ id: `media-${Date.now()}`, title: title.trim(), type, status: "רוצה" }, ...items]);
    setTitle(""); setAdding(false);
  }

  function cycleStatus(id: string) {
    persist(items.map(i => {
      if (i.id !== id) return i;
      const next: MediaStatus = i.status === "רוצה" ? "ב-אמצע" : i.status === "ב-אמצע" ? "סיימתי" : "רוצה";
      return { ...i, status: next };
    }));
  }

  const visible = filter === "הכל" ? items : items.filter(i => i.type === filter);
  const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(["הכל", ...TYPES] as (MediaType | "הכל")[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${filter === f ? "calm-card text-t-1 shadow-sm" : "text-t-3 hover:text-t-1"}`}>
            {f === "הכל" ? "הכל" : `${TYPE_EMOJI[f as MediaType]} ${f}`}
          </button>
        ))}
        <button onClick={() => setAdding(v => !v)}
          className="mr-auto flex items-center gap-1 text-xs text-accent hover:opacity-80 transition font-medium">
          <Plus size={13} /> הוספה
        </button>
      </div>

      {adding && (
        <div className="calm-card rounded-2xl p-3 space-y-2">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="שם..." className={inputCls} />
          <div className="flex gap-1.5">
            {TYPES.map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${type === t ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`}>
                {TYPE_EMOJI[t]} {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!title.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40">הוספה</button>
            <button onClick={() => setAdding(false)} className="text-xs text-t-3 hover:text-t-1">ביטול</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {visible.length === 0 && (
          <p className="text-sm text-t-4 text-center py-4">אין פריטים</p>
        )}
        {visible.map(i => (
          <div key={i.id} className="group flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:calm-card transition">
            <span className="text-sm">{TYPE_EMOJI[i.type]}</span>
            <span className={`flex-1 text-sm text-t-1 ${i.status === "סיימתי" ? "line-through opacity-50" : ""}`}>{i.title}</span>
            <button onClick={() => cycleStatus(i.id)}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 transition ${STATUS_STYLE[i.status]}`}>
              {i.status}
            </button>
            <button onClick={() => persist(items.filter(x => x.id !== i.id))}
              className="opacity-0 group-hover:opacity-100 text-t-4 hover:text-[#F87171] transition">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
