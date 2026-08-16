"use client";
import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";

type BrandData = {
  tone: string;
  audience: string;
  colors: string;
  doNot: string;
  hashtags: string;
  extra: string;
};

const EMPTY: BrandData = { tone: "", audience: "", colors: "", doNot: "", hashtags: "", extra: "" };

export function BrandTab({ clientId }: { clientId: string }) {
  const [data, setData] = useState<BrandData>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BrandData>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`brand-${clientId}`);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [clientId]);

  const isEmpty = !data.tone && !data.audience && !data.colors && !data.doNot && !data.hashtags && !data.extra;

  function startEdit() { setDraft({ ...data }); setEditing(true); }

  function save() {
    setData(draft);
    try { localStorage.setItem(`brand-${clientId}`, JSON.stringify(draft)); } catch {}
    setEditing(false);
  }

  const inputBase = "w-full rounded-xl px-3 py-2 text-sm text-t-1 focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 calm-card placeholder:text-t-4";

  if (editing) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-t-1">עריכת כרטיס מותג</p>
          <button onClick={() => setEditing(false)} className="text-xs text-t-3 hover:text-t-1 transition">ביטול</button>
        </div>
        {[
          { key: "tone" as const,     label: "טון דיבור",      placeholder: "חם ואישי, לא רשמי, עם הומור עדין..." },
          { key: "audience" as const, label: "קהל יעד",         placeholder: "נשים 25–40, תל אביב, מתעניינות בבריאות..." },
          { key: "colors" as const,   label: "צבעי מותג",       placeholder: "סגול, קרם, לבן..." },
          { key: "hashtags" as const, label: "האשטגים קבועים",  placeholder: "#..." },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-t-3 block mb-1">{f.label}</label>
            <input value={draft[f.key]} onChange={e => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} className={inputBase} />
          </div>
        ))}
        {[
          { key: "doNot" as const, label: "מה לא לפרסם", placeholder: "נושאים רגישים, מתחרים, סגנון תמונה..." },
          { key: "extra" as const, label: "הערות נוספות", placeholder: "כל דבר חשוב שצריך לזכור..." },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-t-3 block mb-1">{f.label}</label>
            <textarea value={draft[f.key]} onChange={e => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} rows={3} className={`${inputBase} resize-none`} />
          </div>
        ))}
        <button onClick={save}
          className="px-5 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:opacity-90 transition">
          שמירה
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3 opacity-30">🎨</p>
        <p className="text-sm text-t-3 mb-4">עדיין אין כרטיס מותג ללקוח הזה</p>
        <button onClick={startEdit}
          className="px-5 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:opacity-90 transition">
          יצירת כרטיס מותג
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-medium text-t-1">כרטיס מותג</p>
        <button onClick={startEdit}
          className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition font-medium">
          <Pencil size={12} /> עריכה
        </button>
      </div>

      <div className="space-y-3">
        {data.tone && (
          <div className="calm-card rounded-2xl px-4 py-3">
            <p className="text-[10px] text-t-4 font-medium mb-1">טון דיבור</p>
            <p className="text-sm text-t-1">{data.tone}</p>
          </div>
        )}
        {data.audience && (
          <div className="calm-card rounded-2xl px-4 py-3">
            <p className="text-[10px] text-t-4 font-medium mb-1">קהל יעד</p>
            <p className="text-sm text-t-1">{data.audience}</p>
          </div>
        )}
        {(data.colors || data.hashtags) && (
          <div className="grid grid-cols-2 gap-3">
            {data.colors && (
              <div className="calm-card rounded-2xl px-4 py-3">
                <p className="text-[10px] text-t-4 font-medium mb-1">צבעי מותג</p>
                <p className="text-sm text-t-1">{data.colors}</p>
              </div>
            )}
            {data.hashtags && (
              <div className="calm-card rounded-2xl px-4 py-3">
                <p className="text-[10px] text-t-4 font-medium mb-1">האשטגים</p>
                <p className="text-sm text-t-3 leading-relaxed">{data.hashtags}</p>
              </div>
            )}
          </div>
        )}
        {data.doNot && (
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.15)" }}>
            <p className="text-[10px] font-medium mb-1" style={{ color: "#F87171" }}>מה לא לפרסם</p>
            <p className="text-sm text-t-1">{data.doNot}</p>
          </div>
        )}
        {data.extra && (
          <div className="calm-card rounded-2xl px-4 py-3">
            <p className="text-[10px] text-t-4 font-medium mb-1">הערות</p>
            <p className="text-sm text-t-2 leading-relaxed">{data.extra}</p>
          </div>
        )}
      </div>
    </div>
  );
}
