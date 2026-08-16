"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Phone } from "lucide-react";

type Contact = { id: string; name: string; role: string; phone: string };
const KEY = "personal-contacts";

export function contactsCount(): number {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").length; } catch { return 0; }
}

export function ImportantContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {}
  }, []);

  function persist(next: Contact[]) {
    setContacts(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function add() {
    if (!name.trim()) return;
    persist([...contacts, { id: `contact-${Date.now()}`, name: name.trim(), role: role.trim(), phone: phone.trim() }]);
    setName(""); setRole(""); setPhone(""); setAdding(false);
  }

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4";

  return (
    <div className="space-y-2">
      {adding ? (
        <div className="calm-card rounded-2xl p-4 space-y-2">
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="שם" className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <input value={role} onChange={e => setRole(e.target.value)}
              placeholder="תפקיד / קשר (רופא, חשמלאי...)" className={inputCls} />
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="טלפון" className={inputCls} dir="ltr" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={add} disabled={!name.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40">הוספה</button>
            <button onClick={() => setAdding(false)} className="text-xs text-t-3 hover:text-t-1">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition font-medium">
          <Plus size={13} /> הוספת איש קשר
        </button>
      )}

      {contacts.length === 0 && !adding && (
        <p className="text-sm text-t-4 text-center py-6">רופא, חשמלאי, רואה חשבון...</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {contacts.map(c => (
          <div key={c.id} className="group calm-card rounded-xl px-3 py-2.5 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-t-1 truncate">{c.name}</p>
              {c.role && <p className="text-xs text-t-4 truncate">{c.role}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {c.phone && (
                <a href={`tel:${c.phone}`}
                  className="text-t-4 hover:text-accent transition">
                  <Phone size={13} />
                </a>
              )}
              <button onClick={() => persist(contacts.filter(x => x.id !== c.id))}
                className="opacity-0 group-hover:opacity-100 text-t-4 hover:text-[#F87171] transition">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
