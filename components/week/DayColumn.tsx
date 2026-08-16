import type { CalendarItem, Task } from "@/lib/supabase/types";
import type { RecurringItem } from "@/lib/recurring";
import { dayTagLabel, dayTagStyle } from "@/components/month/MonthGrid";

const catLabel: Record<string, string> = {
  client: "לקוח", study: "לימודים", personal: "אישי", workout: "אימונים",
};

export function DayColumn({ label, dateNum, isToday, isSelected, tasks, calendarItems=[], recurringItems=[], getRelatedLabel, onClick }: {
  label: string; dateNum: number; isToday: boolean; isSelected?: boolean;
  tasks: Task[]; calendarItems?: CalendarItem[]; recurringItems?: RecurringItem[];
  getRelatedLabel?: (t: Task) => string | undefined; onClick?: () => void;
}) {
  const openCount = tasks.filter(t => t.status !== "done").length;

  return (
    <button
      onClick={onClick}
      className="flex flex-col min-h-[420px] text-right transition-all cursor-pointer w-[140px] shrink-0 rounded-2xl"
      style={{
        background: "#FFFFFF",
        border: isToday
          ? "1px solid #111110"
          : "1px solid rgba(28,18,8,0.08)",
        boxShadow: isToday
          ? "0 2px 8px rgba(28,18,8,0.08)"
          : "none",
      }}>

      {/* Day header */}
      <div className="flex items-center justify-between px-3 py-3 w-full"
        style={{ borderBottom: "1px solid rgba(28,18,8,0.06)" }}>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-t-4">{label}</p>
          <p className={`text-xl font-light leading-tight mt-0.5 ${isToday ? "text-t-1 font-normal" : "text-t-2"}`}>
            {dateNum}
          </p>
        </div>
        {openCount > 0 && (
          <span className="text-[11px] font-medium text-t-4">{openCount}</span>
        )}
        {openCount === 0 && tasks.length > 0 && (
          <span className="text-[11px] text-t-4 opacity-50">✓</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-2.5 py-2 flex flex-col gap-1 w-full">

        {/* Recurring content — quietest layer */}
        {recurringItems.map(item => (
          <div key={item.id} className="flex items-start gap-1.5 px-1 py-1">
            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "rgba(28,18,8,0.20)" }} />
            <span className="text-[10px] text-t-4 font-light leading-snug truncate">
              {item.label} · {item.clientName}
            </span>
          </div>
        ))}

        {/* Calendar events — color only where it carries meaning */}
        {calendarItems.map(item => {
          const s = dayTagStyle[item.type] ?? { bg: "rgba(120,113,108,0.12)", color: "#57534E" };
          return (
            <div key={item.id} className="flex items-start gap-1.5 px-1 py-1 rounded-md"
              style={{ background: s.bg }}>
              <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
              <span className="text-[10px] font-semibold leading-snug truncate" style={{ color: s.color }}>
                {dayTagLabel[item.type] ?? item.type} · {item.title}
                {item.start_time ? ` · ${item.start_time}` : ""}
              </span>
            </div>
          );
        })}

        {/* Tasks */}
        {tasks.length === 0 && calendarItems.length === 0 && recurringItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-t-4 font-light">אין משימות</p>
          </div>
        ) : (
          tasks.map(t => (
            <div key={t.id} className="flex items-start gap-1.5 px-1 py-1.5" style={{ opacity: t.status === "done" ? 0.35 : 1, borderLeft: "2px solid #F97316", paddingLeft: 6 }}>
              <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-light leading-snug break-words ${t.status === "done" ? "line-through" : ""} text-t-1`}>
                {t.title}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-t-4">{catLabel[t.category]}</span>
                {getRelatedLabel?.(t) && (
                  <span className="text-[10px] text-t-4 truncate max-w-[70px]">· {getRelatedLabel(t)}</span>
                )}
                {t.priority === "urgent" && t.status !== "done" && (
                  <span className="text-[10px]" style={{ color: "#C24A1A" }}>· דחוף</span>
                )}
              </div>
              </div>
            </div>
          ))
        )}
      </div>
    </button>
  );
}
