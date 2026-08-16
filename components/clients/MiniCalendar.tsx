"use client";
import type { CalendarItem, Task } from "@/lib/supabase/types";
import { todayISO } from "@/lib/utils";
import { dayTagColor, dayTagLabel } from "@/components/month/MonthGrid";

export { dayTagLabel };

export const tagLabel = dayTagLabel;
export const tagColor: Record<string, string> = {
  post:"gray", reel:"gray", story:"gray", tiktok:"gray", other:"gray",
  holiday:"urgent", event:"urgent", meeting:"purple", shoot:"gray",
};

const weekDays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export function MiniCalendar({ year, month, items, tasks = [], recurringDays, onDayClick }: {
  year: number; month: number; items: CalendarItem[]; tasks?: Task[]; recurringDays?: Set<number>; onDayClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const todayStr = todayISO();

  function itemsForDay(day: number) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return items.filter((e) => e.date === ds);
  }
  function tasksForDay(day: number) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.due_date === ds);
  }

  return (
    <div className="calm-card rounded-2xl  p-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => <div key={d} className="text-center text-xs text-t-3 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayItems = itemsForDay(day);
          const dayTasks = tasksForDay(day);
          const isToday = dateStr === todayStr;
          const visible = dayItems.slice(0, 2);
          const extra = dayItems.length - visible.length;
          const dayOfWeek = new Date(year, month, day).getDay();
          const hasRecurring = recurringDays?.has(dayOfWeek) ?? false;
          return (
            <button key={i} onClick={() => onDayClick(dateStr)}
              className={`min-h-[72px] rounded-xl p-1.5 text-right flex flex-col items-end gap-1 transition-all ${isToday ? "bg-[#9C9078]/10" : hasRecurring ? "bg-[#9C9078]/05 hover:calm-card-hover" : "hover:calm-card-hover"}`}>
              <div className="flex items-center gap-1 w-full justify-end">
                <span className={`text-xs font-medium ${isToday ? "text-accent" : "text-t-2"}`}>{day}</span>
                {hasRecurring && <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#9C9078", opacity: 0.5 }} />}
              </div>
              <div className="flex flex-wrap gap-0.5 justify-end w-full">
                {visible.map((e) => (
                  <span key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${dayTagColor[e.type]}`}>
                    {dayTagLabel[e.type]}
                  </span>
                ))}
                {extra > 0 && <span className="text-[10px] text-t-3">+{extra}</span>}
              </div>
              {dayTasks.length > 0 && (
                <span className="text-[10px] text-t-3 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full" style={{ background:"#7A6A5A" }}/>
                  {dayTasks.length} משימות
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
