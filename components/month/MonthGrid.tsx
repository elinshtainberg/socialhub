"use client";
import type { CalendarItem, Task } from "@/lib/supabase/types";
import { todayISO } from "@/lib/utils";
const WD = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
export const dayTagLabel: Record<string,string> = {
  post:"פוסט",reel:"ריל",story:"סטורי",tiktok:"טיקטוק",other:"תוכן אחר",
  holiday:"חג",event:"אירוע",meeting:"פגישה",shoot:"יום צילום",workout:"אימון",
};
export const dayTagStyle: Record<string, { bg: string; color: string }> = {
  shoot:   { bg: "rgba(249,115,22,0.14)",  color: "#C2410C" },
  meeting: { bg: "rgba(59,130,246,0.13)",  color: "#1D4ED8" },
  event:   { bg: "rgba(139,92,246,0.13)",  color: "#6D28D9" },
  holiday: { bg: "rgba(244,63,94,0.13)",   color: "#BE123C" },
  post:    { bg: "rgba(99,102,241,0.12)",  color: "#4338CA" },
  reel:    { bg: "rgba(236,72,153,0.12)",  color: "#BE185D" },
  story:   { bg: "rgba(20,184,166,0.12)",  color: "#0F766E" },
  tiktok:  { bg: "rgba(15,15,15,0.10)",    color: "#111111" },
  other:   { bg: "rgba(120,113,108,0.12)", color: "#57534E" },
  workout: { bg: "rgba(34,197,94,0.12)",  color: "#15803D" },
};
// kept for backward compat (type buttons in sidebar)
export const dayTagColor: Record<string,string> = Object.fromEntries(
  Object.entries(dayTagStyle).map(([k,v])=>[k,v.bg])
);
export const dayTagButtonClass: Record<string,string> = {
  task:"accent-pill",post:"calm-pill",reel:"calm-pill",story:"calm-pill",
  tiktok:"calm-pill",other:"calm-pill",
  holiday:"accent-pill",event:"accent-pill",meeting:"accent-pill",shoot:"calm-pill",
};
const prio: Record<string,number> = { holiday:1,event:1,meeting:2,shoot:3,post:4,reel:4,story:4,tiktok:4,other:4 };

export function MonthGrid({ year, month, tasks=[], calendarItems=[], selectedDate, onDayClick }: {
  year:number; month:number; tasks?:Task[]; calendarItems?:CalendarItem[];
  selectedDate:string|null; onDayClick:(d:string)=>void;
}) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = Array(first).fill(null);
  for (let d=1;d<=days;d++) cells.push(d);
  const todayStr = todayISO();

  function ds(d:number){ return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

  return (
    <div className="calm-card p-4">
      <div className="grid grid-cols-7 gap-1 mb-3">
        {WD.map(d=><div key={d} className="text-center section-label py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day,i)=>{
          if(day===null) return <div key={i} className="h-20"/>;
          const dateStr = ds(day);
          // CalendarItems (events, meetings, shoots, content) always take
          // visual priority. Tasks are secondary — any task with a due_date
          // shows automatically, no toggle needed.
          const dTasks = tasks.filter(t=>t.due_date===dateStr);
          const dItems = calendarItems.filter(c=>c.date===dateStr);
          const isToday = dateStr===todayStr;
          const isSel   = dateStr===selectedDate;
          const sorted  = [...dItems].sort((a,b)=>(prio[a.type]??9)-(prio[b.type]??9));
          const max=3;
          const cVis = sorted.slice(0,max);
          const tVis = dTasks.slice(0,Math.max(0,max-cVis.length));
          const over = Math.max(0,sorted.length+dTasks.length-max);
          return (
            <button key={i} onClick={()=>onDayClick(dateStr)}
              className="min-h-[80px] rounded-xl p-2 flex flex-col gap-1 transition-all duration-200"
              style={{
                background: isSel ? "rgba(156,144,120,0.24)" :
                            isToday ? "rgba(156,144,120,0.14)" : "rgba(255,252,248,0.5)",
                boxShadow: isSel ? "0 0 0 1.5px rgba(156,144,120,0.55)" : "none",
              }}
              onMouseEnter={e=>{ if(!isSel&&!isToday) (e.currentTarget as HTMLElement).style.background="rgba(255,252,248,0.75)"; }}
              onMouseLeave={e=>{ if(!isSel&&!isToday) (e.currentTarget as HTMLElement).style.background="rgba(255,252,248,0.5)"; }}>
              <span className="text-[11px] self-end"
                style={{ color: isToday ? "#5C3E6E" : isSel ? "#5C3E6E" : "#4A3B2F",
                         fontWeight: isToday || isSel ? 600 : 400 }}>
                {day}
              </span>
              <div className="flex flex-col gap-0.5 w-full">
                {cVis.map(item=>{
                  const s = dayTagStyle[item.type] ?? { bg:"rgba(181,154,127,0.11)", color:"#3D2F24" };
                  return (
                    <span key={item.id} className="text-[10px] font-semibold truncate px-1.5 py-0.5 rounded"
                      style={{ background: s.bg, color: s.color }}>
                      {dayTagLabel[item.type]}
                    </span>
                  );
                })}
                {tVis.map(t=>(
                  <span key={t.id} className="text-[10px] font-light truncate flex items-center gap-1"
                    style={{ color:"#EA6C00", opacity:t.status==="done"?0.5:1 }}>
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background:"#F97316" }}/>
                    {t.title}
                  </span>
                ))}
                {over>0 && <span className="text-[10px] text-t-4 text-right">+{over}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
