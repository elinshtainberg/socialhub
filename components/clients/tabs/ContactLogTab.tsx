"use client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

type LogEntry = { id: string; date: string; text: string };

function storageKey(clientId: string) { return `contact-log-${clientId}`; }

function load(clientId: string): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(storageKey(clientId)) ?? "[]"); } catch { return []; }
}
function save(clientId: string, entries: LogEntry[]) {
  localStorage.setItem(storageKey(clientId), JSON.stringify(entries));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ContactLogTab({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [text, setText] = useState("");

  useEffect(() => { setEntries(load(clientId)); }, [clientId]);

  function addEntry() {
    const t = text.trim();
    if (!t) return;
    const next = [{ id: `log-${Date.now()}`, date: new Date().toISOString(), text: t }, ...entries];
    setEntries(next);
    save(clientId, next);
    setText("");
  }

  function deleteEntry(id: string) {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    save(clientId, next);
  }

  return (
    <div className="space-y-4">
      {/* Quick add */}
      <div className="calm-card rounded-2xl p-4">
        <p className="text-[11px] text-t-4 mb-2">רשומה חדשה</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addEntry(); }}
          placeholder="פגישה, שיחת ווטסאפ, החלטה, משוב... (⌘Enter לשמירה)"
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-sm text-t-1 focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 calm-card resize-none transition mb-3"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-t-4">{new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long" })}</span>
          <button onClick={addEntry} disabled={!text.trim()}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40 transition hover:opacity-90">
            שמירה
          </button>
        </div>
      </div>

      {/* Log entries */}
      {entries.length === 0 ? (
        <p className="text-sm text-t-3 text-center py-8">עדיין אין רשומות קשר · הוסיפי את הראשונה</p>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="group flex gap-3">
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#9C9078]/40 mt-0.5" />
                <div className="w-px flex-1 bg-[#9C9078]/15 mt-1.5" />
              </div>
              {/* Content */}
              <div className="flex-1 calm-card rounded-xl p-3 mb-1">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] text-t-4">{formatDate(entry.date)}</span>
                  <button onClick={() => deleteEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-t-4 hover:text-[#F87171] transition shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-sm text-t-1 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
