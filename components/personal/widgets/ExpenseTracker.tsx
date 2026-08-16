"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

type Expense = { id: string; amount: number; desc: string; cat: string; date: string };
const KEY = "personal-expenses";
const CATS = ["אוכל", "קניות", "תחבורה", "בריאות", "בידור", "ביגוד", "אחר"];
const CAT_COLOR: Record<string, string> = {
  "אוכל": "#60655D", "קניות": "#9C9078", "תחבורה": "#4A6B50",
  "בריאות": "#F87171", "בידור": "#FBBF24", "ביגוד": "#F472B6", "אחר": "#9CA3AF",
};

function monthKey() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }

export function expensesTotal(): number {
  try {
    const mk = monthKey();
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
      .filter((e: Expense) => e.date.startsWith(mk))
      .reduce((s: number, e: Expense) => s + e.amount, 0);
  } catch { return 0; }
}

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("אחר");

  useEffect(() => {
    try { setExpenses(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {}
  }, []);

  function persist(next: Expense[]) {
    setExpenses(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function add() {
    if (!amount || isNaN(Number(amount))) return;
    const today = new Date().toISOString().slice(0, 10);
    persist([{ id: `exp-${Date.now()}`, amount: Number(amount), desc: desc.trim(), cat, date: today }, ...expenses]);
    setAmount(""); setDesc(""); setCat("אחר"); setAdding(false);
  }

  const mk = monthKey();
  const thisMonth = expenses.filter(e => e.date.startsWith(mk));
  const total = thisMonth.reduce((s, e) => s + e.amount, 0);

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 placeholder:text-t-4";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-t-4">סה״כ החודש</p>
          <p className="text-xl font-semibold text-t-1">₪{total.toLocaleString()}</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition font-medium">
            <Plus size={13} /> הוצאה חדשה
          </button>
        )}
      </div>

      {adding && (
        <div className="calm-card rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input autoFocus type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="סכום ₪" className={inputCls} dir="ltr" />
            <input value={desc} onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              placeholder="תיאור (אופציונלי)" className={inputCls} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATS.map(c => (
              <button key={c} type="button" onClick={() => setCat(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${cat === c ? "text-white" : "calm-card text-t-3 hover:text-t-1"}`}
                style={cat === c ? { background: CAT_COLOR[c] } : {}}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!amount}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40">הוספה</button>
            <button onClick={() => setAdding(false)} className="text-xs text-t-3 hover:text-t-1">ביטול</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {thisMonth.length === 0 && !adding && (
          <p className="text-sm text-t-4 text-center py-4">אין הוצאות החודש</p>
        )}
        {thisMonth.map(e => (
          <div key={e.id} className="group flex items-center gap-2 py-1.5 px-1 rounded-lg hover:calm-card transition">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLOR[e.cat] ?? "#9CA3AF" }} />
            <span className="text-xs text-t-4 shrink-0">{e.cat}</span>
            <span className="flex-1 text-sm text-t-2 truncate">{e.desc || "—"}</span>
            <span className="text-sm font-medium text-t-1 shrink-0">₪{e.amount.toLocaleString()}</span>
            <button onClick={() => persist(expenses.filter(x => x.id !== e.id))}
              className="opacity-0 group-hover:opacity-100 text-t-4 hover:text-[#F87171] transition">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
