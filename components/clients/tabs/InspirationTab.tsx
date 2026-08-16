"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";

type InspirationEntry = {
  id: string;
  handle: string;
  platform: string;
  why: string;
  url: string;
};

const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "אחר"];

export function InspirationTab({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<InspirationEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [why, setWhy] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`inspiration-${clientId}`);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, [clientId]);

  function persist(next: InspirationEntry[]) {
    setEntries(next);
    try { localStorage.setItem(`inspiration-${clientId}`, JSON.stringify(next)); } catch {}
  }

  function add() {
    if (!handle.trim()) return;
    persist([...entries, { id: `ins-${Date.now()}`, handle: handle.trim(), platform, why: why.trim(), url: url.trim() }]);
    setHandle(""); setWhy(""); setUrl(""); setPlatform("Instagram");
    setAdding(false);
  }

  function remove(id: string) { persist(entries.filter(e => e.id !== id)); }

  const btnCls = (active: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs font-medium transition ${active ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-t-1">השראה ומתחרים</p>
          <p className="text-xs text-t-4 mt-0.5">חשבונות לעקוב, ללמוד, ולהתחרות</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-accent hover:opacity-80 font-medium transition">
            <Plus size={14} /> הוספה
          </button>
        )}
      </div>

      {adding && (
        <div className="calm-card rounded-2xl p-4 space-y-3">
          <input autoFocus value={handle} onChange={e => setHandle(e.target.value)}
            placeholder="@שם החשבון"
            className="w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4" />
          <div>
            <p className="text-[10px] text-t-4 mb-1.5">פלטפורמה</p>
            <div className="flex gap-1.5 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => setPlatform(p)} className={btnCls(platform === p)}>{p}</button>
              ))}
            </div>
          </div>
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="קישור לפרופיל (אופציונלי)"
            className="w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4" />
          <textarea value={why} onChange={e => setWhy(e.target.value)}
            placeholder="למה רלוונטי? מה אפשר ללמוד?"
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4 resize-none" />
          <div className="flex gap-2">
            <button onClick={add} disabled={!handle.trim()}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition">
              הוספה
            </button>
            <button onClick={() => setAdding(false)} className="text-xs text-t-3 hover:text-t-1 px-3 transition">ביטול</button>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding ? (
        <p className="text-sm text-t-3 text-center py-8">אין חשבונות עדיין · הוסיפי את הראשון</p>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="group calm-card rounded-xl px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-t-1">{e.handle}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md calm-card text-t-3 font-medium">{e.platform}</span>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer"
                      className="text-t-4 hover:text-accent transition">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {e.why && <p className="text-xs text-t-3 mt-1">{e.why}</p>}
              </div>
              <button onClick={() => remove(e.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-t-4 hover:text-[#F87171] transition shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
