"use client";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Client, Task } from "@/lib/supabase/types";
export function TaskList({ tasks, clients=[], getRelatedLabel, onChanged, emptyText="אין משימות", highlight=false }: {
  tasks:Task[]; clients?:Client[];
  getRelatedLabel?:(t:Task)=>string|undefined; onChanged:()=>void; emptyText?:string; highlight?:boolean;
}) {
  if (tasks.length === 0) return emptyText
    ? <p className="text-sm font-light text-t-3 py-4 text-center">{emptyText}</p> : null;
  return (
    <div className="flex flex-col gap-1.5">
      {tasks.map(t=>(
        <TaskCard key={t.id} task={t} relatedLabel={getRelatedLabel?.(t)} clients={clients} onChanged={onChanged} highlight={highlight}/>
      ))}
    </div>
  );
}
