"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Flame } from "lucide-react";
import type { Client, Task, TaskCategory } from "@/lib/supabase/types";
const CONTENT_TYPES = ["פוסט","ריל","סטורי","טיקטוק","הכנת גאנט","אחר"];
const cats: { value: TaskCategory; label: string }[] = [
  {value:"client",label:"לקוח"},{value:"personal",label:"אישי"},
];
const statuses: { value:"open"|"in_progress"; label:string }[] = [
  {value:"open",label:"פתוחה"},{value:"in_progress",label:"בתהליך"},
];
export interface TaskEditValues {
  title:string; category:TaskCategory; client_id:string|null; study_id:string|null;
  project_id:string|null; due_date:string|null; priority:Task["priority"]; status:"open"|"in_progress";
  duration_minutes:number|null; notes:string|null; workout_type:string|null;
}
export function TaskEditModal({ open, task, clients, onCancel, onSave }: {
  open:boolean; task:Task|null; clients:Client[];
  onCancel:()=>void; onSave:(u:TaskEditValues)=>void;
}) {
  const [title,setTitle]=useState("");
  const [cat,setCat]=useState<TaskCategory>("personal");
  const [clientId,setClientId]=useState("");
  const [dueDate,setDueDate]=useState("");
  const [urgent,setUrgent]=useState(false);
  const [status,setStatus]=useState<"open"|"in_progress">("open");
  const [contentType,setContentType]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(open&&task){
      setTitle(task.title);setCat(task.category==="study"||task.category==="workout"?"personal":task.category);
      setClientId(task.client_id??"");setDueDate(task.due_date??"");
      setUrgent(task.priority==="urgent");
      setStatus(task.status==="in_progress"?"in_progress":"open");
      setContentType(task.category==="client"?(task.workout_type??""):"");
    }
  },[open,task]);

  if(!task) return null;
  const IS = { background:"rgba(255,252,248,0.55)", border:"1px solid rgba(181,154,127,0.10)", borderRadius:10, color:"#33291F" };

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault(); if(!title.trim()) return; setSaving(true);
    try { onSave({ title:title.trim(), category:cat, client_id:cat==="client"?clientId||null:null,
      study_id:null, project_id:null, due_date:dueDate||null,
      priority:urgent?"urgent":"medium", status,
      duration_minutes: null,
      notes: null,
      workout_type: cat==="client" && contentType ? contentType : null });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="text-lg font-light text-t-1 mb-5">עריכת משימה</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
          placeholder="כותרת המשימה" className="w-full calm-input px-4 py-2.5 text-sm" required/>
        <div>
          <p className="section-label mb-2">קטגוריה</p>
          <div className="flex gap-1 flex-wrap">
            {cats.map(c=>(
              <button type="button" key={c.value} onClick={()=>setCat(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-all ${cat===c.value?"accent-pill":"calm-pill cursor-pointer"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {cat==="client" && (
          <select value={clientId} onChange={e=>setClientId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm font-light rounded-xl" style={IS}>
            <option value="">בחר/י לקוח</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {cat==="client" && (
          <div className="flex gap-1.5 flex-wrap">
            {CONTENT_TYPES.map(t=>(
              <button type="button" key={t}
                onClick={()=>setContentType(p=>p===t?"":t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contentType===t?"accent-pill":"calm-pill text-t-3 hover:text-t-2"}`}>
                {t}
              </button>
            ))}
          </div>
        )}
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
          className="w-full px-4 py-2.5 text-sm font-light calm-input" style={{ color:"#5C4C3F" }}/>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={()=>setUrgent(u=>!u)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${urgent?"accent-pill":"calm-pill cursor-pointer"}`}>
            <Flame size={12}/> דחוף
          </button>
          <div className="flex gap-0.5 rounded-xl p-1" style={{ background:"rgba(181,154,127,0.06)" }}>
            {statuses.map(s=>(
              <button key={s.value} type="button" onClick={()=>setStatus(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-all ${status===s.value?"calm-card-lift text-t-1":"text-t-3"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving||!title.trim()} className="flex-1">{saving?"שומר...":"שמירה"}</Button>
          <button type="button" onClick={onCancel} className="text-sm font-light text-t-3 px-4 hover:text-t-2 transition-colors">ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
