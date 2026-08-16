"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";

type Link = { id: string; title: string; url: string; tag: string };
const KEY = "personal-links";
const TAGS = ["כללי", "קניות", "השראה", "עבודה", "בריאות", "אחר"];

export function savedLinksCount(): number {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").length; } catch { return 0; }
}

export function SavedLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("כללי");

  useEffect(() => {
    try { setLinks(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {}
  }, []);

  function persist(next: Link[]) {
    setLinks(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function add() {
    if (!url.trim()) return;
    const t = title.trim() || url.replace(/^https?:\/\//, "").split("/")[0];
    persist([{ id: `link-${Date.now()}`, url: url.trim(), title: t, tag }, ...links]);
    setUrl(""); setTitle(""); setTag("כללי"); setAdding(false);
  }

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4";

  return (
    <div className="space-y-3">
      {adding ? (
        <div className="calm-card rounded-2xl p-4 space-y-3">
          <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="https://..." className={inputCls} />
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="שם הקישור (אופציונלי)" className={inputCls} />
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map(t => (
              <button key={t} type="button" onClick={() => setTag(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${tag === t ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!url.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40">שמירה</button>
            <button onClick={() => setAdding(false)} className="text-xs text-t-3 hover:text-t-1">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition font-medium">
          <Plus size={13} /> הוספת קישור
        </button>
      )}

      {links.length === 0 && !adding && (
        <p className="text-sm text-t-4 text-center py-6">אין קישורים שמורים</p>
      )}

      <div className="space-y-1.5">
        {links.map(l => (
          <div key={l.id} className="group flex items-center gap-2 calm-card rounded-xl px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-t-1 truncate">{l.title}</p>
              <p className="text-xs text-t-4 truncate">{l.url.replace(/^https?:\/\//, "")}</p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded calm-card text-t-3 shrink-0">{l.tag}</span>
            <a href={l.url} target="_blank" rel="noopener noreferrer"
              className="text-t-4 hover:text-accent transition shrink-0">
              <ExternalLink size={13} />
            </a>
            <button onClick={() => persist(links.filter(x => x.id !== l.id))}
              className="opacity-0 group-hover:opacity-100 text-t-4 hover:text-[#F87171] transition shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
