import { DayColumn } from "@/components/week/DayColumn";
import type { CalendarItem, Task } from "@/lib/supabase/types";
import type { RecurringItem } from "@/lib/recurring";
import { localDateStr, todayISO } from "@/lib/utils";

const dayLabels = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function WeekGrid({
  weekDates,
  tasks,
  calendarItems = [],
  weekRecurring = [],
  selectedDate,
  getRelatedLabel,
  onDayClick,
}: {
  weekDates: Date[];
  tasks: Task[];
  calendarItems?: CalendarItem[];
  weekRecurring?: RecurringItem[][];
  selectedDate?: string | null;
  getRelatedLabel?: (task: Task) => string | undefined;
  onDayClick?: (dateStr: string) => void;
}) {
  const todayStr = todayISO();

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-2">
    <div className="flex gap-2.5" style={{ minWidth: "max-content" }}>
      {weekDates.map((date, i) => {
        const dateStr = localDateStr(date);
        const dayTasks = tasks.filter((t) => t.due_date === dateStr);
        const dayItems = calendarItems.filter((c) => c.date === dateStr);
        return (
          <DayColumn
            key={i}
            label={dayLabels[i]}
            dateNum={date.getDate()}
            isToday={dateStr === todayStr}
            isSelected={dateStr === selectedDate}
            tasks={dayTasks}
            calendarItems={dayItems}
            recurringItems={weekRecurring[i] ?? []}
            getRelatedLabel={getRelatedLabel}
            onClick={() => onDayClick?.(dateStr)}
          />
        );
      })}
    </div>
    </div>
  );
}
