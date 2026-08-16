"use client";
import { useState } from "react";
import { ShoppingCart, Link2, StickyNote, Phone, Receipt, Tv } from "lucide-react";
import { PersonalLists } from "./PersonalLists";
import { SavedLinks } from "./widgets/SavedLinks";
import { QuickNotes } from "./widgets/QuickNotes";
import { ImportantContacts } from "./widgets/ImportantContacts";
import { ExpenseTracker } from "./widgets/ExpenseTracker";
import { WatchReadList } from "./widgets/WatchReadList";

type WidgetId = "lists" | "links" | "notes" | "contacts" | "expenses" | "watchread";

const WIDGETS: { id: WidgetId; label: string; icon: React.ElementType; sub: string; color: string }[] = [
  { id: "lists",     label: "רשימות",          icon: ShoppingCart, sub: "קניות, תרופות, לסדר", color: "#8B5CF6" },
  { id: "notes",     label: "פתקים",           icon: StickyNote,   sub: "מחשבות מהירות",       color: "#F59E0B" },
  { id: "links",     label: "קישורים",         icon: Link2,        sub: "לקרוא אחר כך",         color: "#1D4ED8" },
  { id: "contacts",  label: "אנשי קשר",        icon: Phone,        sub: "רופא, חשמלאי...",      color: "#EC4899" },
  { id: "expenses",  label: "הוצאות",          icon: Receipt,      sub: "מעקב חודשי",           color: "#16A34A" },
  { id: "watchread", label: "לצפות / לקרוא",   icon: Tv,           sub: "סרטים, ספרים...",      color: "#EA580C" },
];

function WidgetContent({ id }: { id: WidgetId }) {
  if (id === "lists")     return <PersonalLists />;
  if (id === "links")     return <SavedLinks />;
  if (id === "notes")     return <QuickNotes />;
  if (id === "contacts")  return <ImportantContacts />;
  if (id === "expenses")  return <ExpenseTracker />;
  if (id === "watchread") return <WatchReadList />;
  return null;
}

const COLS = 3;

export function PersonalGrid() {
  const [open, setOpen] = useState<WidgetId | null>(null);

  const openIdx = open ? WIDGETS.findIndex(w => w.id === open) : -1;
  const openRow = openIdx >= 0 ? Math.floor(openIdx / COLS) : -1;
  const rows = Math.ceil(WIDGETS.length / COLS);

  return (
    <div className="mb-6 space-y-3">
      {Array.from({ length: rows }, (_, rowIdx) => {
        const rowWidgets = WIDGETS.slice(rowIdx * COLS, rowIdx * COLS + COLS);
        const isRowOpen = openRow === rowIdx;
        return (
          <div key={rowIdx}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rowWidgets.map(w => {
                const Icon = w.icon;
                const isOpen = open === w.id;
                return (
                  <button key={w.id} onClick={() => setOpen(isOpen ? null : w.id)}
                    className="text-right p-4 rounded-2xl transition-all"
                    style={isOpen
                      ? { background: w.color, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }
                      : { background: "#FEFDFB", border: "1px solid rgba(30,20,10,0.07)", boxShadow: "0 1px 3px rgba(28,18,8,0.07)" }
                    }>
                    <Icon size={18} className="mb-2" style={{ color: isOpen ? "rgba(255,255,255,0.9)" : w.color }} />
                    <p className="text-sm font-medium" style={{ color: isOpen ? "#fff" : "#100F0C" }}>{w.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: isOpen ? "rgba(255,255,255,0.70)" : "#98948C" }}>{w.sub}</p>
                  </button>
                );
              })}
            </div>

            {isRowOpen && open && (
              <div className="calm-card rounded-2xl p-5 mt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-t-1">
                    {WIDGETS.find(w => w.id === open)?.label}
                  </p>
                  <button onClick={() => setOpen(null)}
                    className="text-xs text-t-4 hover:text-t-1 transition">סגירה ×</button>
                </div>
                <WidgetContent id={open} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
