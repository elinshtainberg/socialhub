"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { todayISO } from "@/lib/utils";
export function PostponeModal({ open, currentDate, onCancel, onConfirm }: {
  open:boolean; currentDate:string|null; onCancel:()=>void; onConfirm:(d:string)=>void;
}) {
  const [date, setDate] = useState(currentDate ?? todayISO());
  useEffect(() => { if(open) setDate(currentDate ?? todayISO()); }, [open, currentDate]);
  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="text-base font-light text-t-1 mb-1">לדחות למתי?</h2>
      <p className="text-xs font-light text-t-3 mb-5">בחרי תאריך חדש</p>
      <input type="date" autoFocus value={date} onChange={e=>setDate(e.target.value)}
        className="w-full calm-input px-4 py-2.5 text-sm mb-5"/>
      <div className="flex gap-2">
        <Button onClick={()=>onConfirm(date)} disabled={!date} className="flex-1">עדכון תאריך</Button>
        <button onClick={onCancel} className="text-sm font-light text-t-3 px-4 hover:text-t-2 transition-colors">ביטול</button>
      </div>
    </Modal>
  );
}
