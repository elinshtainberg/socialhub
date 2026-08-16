"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";

type ListItem = { id: string; text: string; done: boolean };
type PersonalList = { id: string; name: string; items: ListItem[] };

const STORAGE_KEY = "personal-lists";

const PRESET_NAMES = ["קניות", "תרופות", "לסדר", "לקנות אונליין", "רשימת משאלות"];

export function PersonalLists() {
  const [lists, setLists] = useState<PersonalList[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersonalList[] = JSON.parse(raw);
        setLists(parsed);
        if (parsed.length) setActiveId(parsed[0].id);
      }
    } catch {}
  }, []);

  function persist(next: PersonalList[]) {
    setLists(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function createList(name: string) {
    if (!name.trim()) return;
    const list: PersonalList = { id: `list-${Date.now()}`, name: name.trim(), items: [] };
    const next = [...lists, list];
    persist(next);
    setActiveId(list.id);
    setNewListName("");
    setAddingList(false);
  }

  function deleteList(id: string) {
    const next = lists.filter(l => l.id !== id);
    persist(next);
    setActiveId(next.length ? next[0].id : null);
  }

  function addItem() {
    if (!newItem.trim() || !activeId) return;
    const item: ListItem = { id: `item-${Date.now()}`, text: newItem.trim(), done: false };
    persist(lists.map(l => l.id === activeId ? { ...l, items: [...l.items, item] } : l));
    setNewItem("");
  }

  function toggleItem(itemId: string) {
    persist(lists.map(l => l.id === activeId
      ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
      : l));
  }

  function deleteItem(itemId: string) {
    persist(lists.map(l => l.id === activeId
      ? { ...l, items: l.items.filter(i => i.id !== itemId) }
      : l));
  }

  function clearDone() {
    persist(lists.map(l => l.id === activeId
      ? { ...l, items: l.items.filter(i => !i.done) }
      : l));
  }

  const active = lists.find(l => l.id === activeId) ?? null;
  const doneCount = active?.items.filter(i => i.done).length ?? 0;

  return (
    <div className="calm-card rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(181,154,127,0.08)" }}>
        {lists.map(l => (
          <button key={l.id} onClick={() => setActiveId(l.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition shrink-0 ${
              activeId === l.id
                ? "text-t-1 font-medium border-b-2 border-accent -mb-[1px]"
                : "text-t-3 hover:text-t-1"
            }`}>
            {l.name}
            <span className="text-[10px] text-t-4">
              {l.items.filter(i => !i.done).length || ""}
            </span>
          </button>
        ))}
        {addingList ? (
          <div className="flex items-center gap-1 px-3 py-2 shrink-0">
            <input autoFocus value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createList(newListName); if (e.key === "Escape") setAddingList(false); }}
              placeholder="שם הרשימה"
              className="text-sm text-t-1 bg-transparent focus:outline-none w-28 placeholder:text-t-4" />
            <button onClick={() => createList(newListName)}
              className="text-xs text-accent hover:opacity-80 transition">אישור</button>
            <button onClick={() => setAddingList(false)} className="text-t-4 hover:text-t-2 transition">
              <X size={13} />
            </button>
          </div>
        ) : (
          <button onClick={() => setAddingList(true)}
            className="flex items-center gap-1 px-3 py-2.5 text-xs text-t-4 hover:text-accent transition shrink-0 mr-auto">
            <Plus size={13} /> רשימה חדשה
          </button>
        )}
      </div>

      {/* Empty state — no lists yet */}
      {lists.length === 0 && !addingList && (
        <div className="py-10 text-center space-y-3">
          <p className="text-sm text-t-3">אין רשימות עדיין</p>
          <div className="flex flex-wrap gap-2 justify-center px-4">
            {PRESET_NAMES.map(name => (
              <button key={name} onClick={() => createList(name)}
                className="px-3 py-1.5 rounded-xl text-xs calm-card text-t-3 hover:text-accent hover:border-accent/30 transition">
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active list */}
      {active && (
        <div className="p-4">
          {/* Add item */}
          <div className="flex items-center gap-2 mb-3">
            <input value={newItem} onChange={e => setNewItem(e.target.value)}
              onKeyUp={e => { if (e.key === "Enter") addItem(); }}
              placeholder="הוסיפי פריט..."
              className="flex-1 text-sm text-t-1 bg-transparent focus:outline-none placeholder:text-t-4 py-1" />
            <button onClick={addItem} disabled={!newItem.trim()}
              className="text-accent disabled:opacity-30 transition">
              <Plus size={16} />
            </button>
          </div>

          {/* Items */}
          {active.items.length === 0 ? (
            <p className="text-sm text-t-4 text-center py-4">הרשימה ריקה — הוסיפי פריט למעלה</p>
          ) : (
            <div className="space-y-0.5">
              {active.items.filter(i => !i.done).map(item => (
                <div key={item.id}
                  className="flex items-center gap-3 group py-2 rounded-xl px-2 hover:calm-card transition">
                  <button onClick={() => toggleItem(item.id)}
                    className="w-6 h-6 rounded-full border-2 border-t-3/60 flex items-center justify-center shrink-0 hover:border-accent transition active:scale-90" />
                  <span className="flex-1 text-sm text-t-1">{item.text}</span>
                  <button onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-t-4 hover:text-[#F87171] transition p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {/* Done items */}
              {active.items.filter(i => i.done).length > 0 && (
                <div className="pt-2 mt-1" style={{ borderTop: "1px dashed rgba(181,154,127,0.12)" }}>
                  {active.items.filter(i => i.done).map(item => (
                    <div key={item.id}
                      className="flex items-center gap-3 group py-2 rounded-xl px-2 opacity-45">
                      <button onClick={() => toggleItem(item.id)}
                        className="w-6 h-6 rounded-full border-2 border-t-3/50 flex items-center justify-center shrink-0 bg-t-3/15 active:scale-90">
                        <div className="w-2.5 h-2.5 rounded-full bg-t-3/60" />
                      </button>
                      <span className="flex-1 text-sm text-t-3 line-through">{item.text}</span>
                      <button onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-t-4 hover:text-[#F87171] transition p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: "1px solid rgba(181,154,127,0.08)" }}>
            {doneCount > 0 ? (
              <button onClick={clearDone}
                className="text-xs text-t-4 hover:text-[#F87171] transition">
                נקי את הסומנים ({doneCount})
              </button>
            ) : <span />}
            <button onClick={() => deleteList(active.id)}
              className="text-xs text-t-4 hover:text-[#F87171] transition">
              מחיקת רשימה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
