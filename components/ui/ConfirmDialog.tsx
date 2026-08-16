"use client";
import { Modal } from "@/components/ui/Modal";
export function ConfirmDialog({ open, onCancel, onConfirm, message="למחוק את הפריט?" }: {
  open: boolean; onCancel: () => void; onConfirm: () => void; message?: string;
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <p className="text-sm font-light text-t-1 text-center mb-6 mt-2">{message}</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-light text-t-2 hover:text-t-1 transition-colors">ביטול</button>
        <button onClick={onConfirm} className="px-5 py-2 rounded-xl text-sm font-normal transition-all"
          style={{ background:"rgba(194,74,26,0.09)", border:"1px solid rgba(194,74,26,0.18)", color:"#C24A1A" }}>מחיקה</button>
      </div>
    </Modal>
  );
}
