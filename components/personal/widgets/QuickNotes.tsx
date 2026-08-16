"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

type Note = { id: string; title: string; body: string; updatedAt: string };
const KEY = "personal-notes";

export function quickNotesCount(): number {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").length; } catch { return 0; }
}

export function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const n: Note[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      setNotes(n);
      if (n.length) setActiveId(n[0].id);
    } catch {}
  }, []);

  function persist(next: Note[]) {
    setNotes(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function addNote() {
    const note: Note = { id: `note-${Date.now()}`, title: "פתק חדש", body: "", updatedAt: new Date().toISOString() };
    const next = [note, ...notes];
    persist(next);
    setActiveId(note.id);
  }

  function updateNote(id: string, field: "title" | "body", value: string) {
    persist(notes.map(n => n.id === id ? { ...n, [field]: value, updatedAt: new Date().toISOString() } : n));
  }

  function deleteNote(id: string) {
    const next = notes.filter(n => n.id !== id);
    persist(next);
    setActiveId(next.length ? next[0].id : null);
  }

  const active = notes.find(n => n.id === activeId) ?? null;
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  function handleSelectNote(id: string) {
    setActiveId(id);
    setMobileView("editor");
  }

  function handleAddNote() {
    addNote();
    setMobileView("editor");
  }

  return (
    <>
      {/* Desktop: two-column */}
      <div className="hidden sm:flex gap-3 h-64">
        <div className="w-36 shrink-0 flex flex-col gap-1 overflow-y-auto">
          <button onClick={addNote}
            className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition font-medium mb-1">
            <Plus size={13} /> פתק חדש
          </button>
          {notes.map(n => (
            <button key={n.id} onClick={() => setActiveId(n.id)}
              className={`text-right px-2.5 py-2 rounded-xl text-xs truncate transition ${activeId === n.id ? "calm-card text-t-1 font-medium" : "text-t-3 hover:text-t-1"}`}>
              {n.title || "ללא כותרת"}
            </button>
          ))}
          {notes.length === 0 && <p className="text-xs text-t-4 text-center pt-4">אין פתקים</p>}
        </div>
        <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: "1px solid rgba(181,154,127,0.08)" }}>
          {active ? (
            <>
              <div className="flex items-center justify-between px-3 pb-2 mb-2"
                style={{ borderBottom: "1px solid rgba(181,154,127,0.08)" }}>
                <input value={active.title} onChange={e => updateNote(active.id, "title", e.target.value)}
                  className="text-sm font-medium text-t-1 bg-transparent focus:outline-none flex-1" />
                <button onClick={() => deleteNote(active.id)} className="text-t-4 hover:text-[#F87171] transition">
                  <Trash2 size={13} />
                </button>
              </div>
              <textarea value={active.body} onChange={e => updateNote(active.id, "body", e.target.value)}
                placeholder="כתבי כאן..."
                className="flex-1 text-sm text-t-1 bg-transparent focus:outline-none resize-none px-3 placeholder:text-t-4 leading-relaxed" />
            </>
          ) : (
            <p className="text-sm text-t-4 text-center pt-10">בחרי פתק או צרי חדש</p>
          )}
        </div>
      </div>

      {/* Mobile: list or editor */}
      <div className="sm:hidden">
        {mobileView === "list" ? (
          <div className="flex flex-col gap-1">
            <button onClick={handleAddNote}
              className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition font-medium mb-1">
              <Plus size={13} /> פתק חדש
            </button>
            {notes.map(n => (
              <button key={n.id} onClick={() => handleSelectNote(n.id)}
                className="text-right px-3 py-2.5 rounded-xl text-sm calm-card text-t-1 transition">
                <p className="font-medium truncate">{n.title || "ללא כותרת"}</p>
                {n.body && <p className="text-xs text-t-3 truncate mt-0.5">{n.body}</p>}
              </button>
            ))}
            {notes.length === 0 && <p className="text-sm text-t-4 text-center py-4">אין פתקים</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button onClick={() => setMobileView("list")} className="text-xs text-accent">← כל הפתקים</button>
              {active && <button onClick={() => { deleteNote(active.id); setMobileView("list"); }}
                className="text-t-4 hover:text-[#F87171] transition"><Trash2 size={14} /></button>}
            </div>
            {active && (
              <>
                <input value={active.title} onChange={e => updateNote(active.id, "title", e.target.value)}
                  className="text-sm font-medium text-t-1 bg-transparent focus:outline-none w-full py-1"
                  style={{ borderBottom: "1px solid rgba(181,154,127,0.08)" }} />
                <textarea value={active.body} onChange={e => updateNote(active.id, "body", e.target.value)}
                  placeholder="כתבי כאן..." rows={6}
                  className="text-sm text-t-1 bg-transparent focus:outline-none resize-none w-full placeholder:text-t-4 leading-relaxed" />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
