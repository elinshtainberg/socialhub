"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripVertical, MoreHorizontal, Star } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PostponeModal } from "@/components/tasks/PostponeModal";
import { TaskEditModal, type TaskEditValues } from "@/components/tasks/TaskEditModal";
import type { Client, Task } from "@/lib/supabase/types";
import { deleteTask, postponeTask, updateTask, updateTaskStatus } from "@/lib/queries/tasks";
import { formatDateHe, isOverdue } from "@/lib/utils";

const CAT_LABEL: Record<string, string> = {
  client: "לקוח", personal: "אישי",
};

export function TodayTaskCard({
  task, clients, isFocus, onToggleFocus, onChanged, onCompleted, onReopened,
}: {
  task: Task;
  clients: Client[];
  isFocus: boolean;
  onToggleFocus: () => void;
  onChanged: () => void;
  onCompleted?: (task: Task) => void;
  onReopened?: (task: Task) => void;
}) {
  const isDone  = task.status === "done";
  const isIP    = task.status === "in_progress";
  const overdue = isOverdue(task.due_date) && !isDone;

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [mounted,      setMounted]      = useState(false);

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);
  const [menuPos,  setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuBtnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  async function act(fn: () => Promise<void>) { await fn(); onChanged(); }

  function openMenu() {
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuW = 180;
    const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
    setMenuPos({ top: rect.bottom + 6, left });
    setMenuOpen(true);
  }

  const clientName = task.category === "client" ? clients.find(c => c.id === task.client_id)?.name : undefined;

  const menuItems: { label: string; danger?: boolean; onClick: () => void }[] = [
    { label: "עריכה", onClick: () => { setMenuOpen(false); setEditOpen(true); } },
    task.status === "open"
      ? { label: "סמן כבתהליך", onClick: () => { setMenuOpen(false); act(() => updateTaskStatus(task.id, "in_progress")); } }
      : { label: "החזר לפתוחה", onClick: () => { setMenuOpen(false); act(() => updateTaskStatus(task.id, "open")); } },
    task.priority === "urgent"
      ? { label: "הסר דחיפות", onClick: () => { setMenuOpen(false); act(() => updateTask(task.id, { priority: "medium" })); } }
      : { label: "סמן כדחוף",  onClick: () => { setMenuOpen(false); act(() => updateTask(task.id, { priority: "urgent" })); } },
    { label: "דחה / שנה תאריך", onClick: () => { setMenuOpen(false); setPostponeOpen(true); } },
    { label: "מחיקה", danger: true, onClick: () => { setMenuOpen(false); setConfirmOpen(true); } },
  ];

  return (
    <>
      {/* Clean list row — container provides the card boundary */}
      <div className="flex items-center gap-3 px-4 py-3 group/row transition-colors hover:bg-black/[0.02]">

        {/* Drag handle */}
        <span data-drag-handle className="shrink-0 opacity-0 group-hover/row:opacity-30 hover:!opacity-60 transition-opacity" style={{ cursor: "grab" }}>
          <GripVertical size={13} className="text-t-4" />
        </span>

        {/* Completion circle */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => {
            if (!isDone) onCompleted?.(task);
            else onReopened?.(task);
            act(() => updateTaskStatus(task.id, isDone ? "open" : "done"));
          }}
          className="shrink-0 w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all hover:scale-110"
          style={{
            borderColor: isDone ? "rgba(17,17,16,0.35)" : "rgba(17,17,16,0.20)",
            background:  isDone ? "rgba(17,17,16,0.07)" : "transparent",
            borderWidth: isDone ? 1.5 : 1,
          }}
        >
          {isDone && <span className="block w-1.5 h-1.5 rounded-full" style={{ background: "rgba(17,17,16,0.45)" }} />}
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-light leading-snug text-t-1"
            style={{ textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.38 : 1 }}>
            {task.title}
          </p>

          {/* Metadata — compact, single line */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[11px] text-t-4">{CAT_LABEL[task.category]}</span>
            {clientName && <span className="text-[11px] text-t-4">· {clientName}</span>}
            {task.category === "client" && task.workout_type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>{task.workout_type}</span>
            )}
            {isIP && !isDone && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: "rgba(0,0,0,0.06)", color: "#5E5E5C" }}>בתהליך</span>
            )}
            {task.priority === "urgent" && !isDone && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: "rgba(194,74,26,0.09)", color: "#C24A1A" }}>דחוף</span>
            )}
            {task.due_date && !isDone && (
              <span className="text-[11px]" style={{ color: overdue ? "#C24A1A" : "#9A9A98" }}>
                · {formatDateHe(task.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* Focus star */}
        {!isDone && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={onToggleFocus}
            className="shrink-0 p-1.5 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
            style={{
              color: isFocus ? "#C24A1A" : "rgba(17,17,16,0.25)",
              background: isFocus ? "rgba(194,74,26,0.08)" : "transparent",
              opacity: isFocus ? 1 : undefined,
            }}
          >
            <Star size={13} fill={isFocus ? "currentColor" : "none"} />
          </button>
        )}

        {/* Three-dot menu */}
        <button
          ref={menuBtnRef}
          onMouseDown={e => e.stopPropagation()}
          onClick={openMenu}
          className="shrink-0 p-1.5 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
          style={{
            color: "rgba(17,17,16,0.30)",
            background: menuOpen ? "rgba(0,0,0,0.05)" : "transparent",
            opacity: menuOpen ? 1 : undefined,
          }}
        >
          <MoreHorizontal size={13} />
        </button>
      </div>

      {/* Portal menu */}
      {mounted && menuOpen && createPortal(
        <div ref={menuRef} style={{
          position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999,
          minWidth: 180,
          background: "#FFFFFF",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
          padding: "4px 0", direction: "rtl",
        }}>
          {menuItems.map(item => (
            <button key={item.label} onClick={item.onClick}
              className="w-full text-right px-4 py-2.5 text-[13px] font-light transition-colors block"
              style={{ color: item.danger ? "#C24A1A" : "#111110" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = item.danger ? "rgba(194,74,26,0.06)" : "rgba(0,0,0,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      <ConfirmDialog open={confirmOpen} onCancel={() => setConfirmOpen(false)}
        onConfirm={() => act(() => deleteTask(task.id)).then(() => setConfirmOpen(false))} />
      <PostponeModal open={postponeOpen} currentDate={task.due_date}
        onCancel={() => setPostponeOpen(false)}
        onConfirm={d => act(() => postponeTask(task.id, d)).then(() => setPostponeOpen(false))} />
      <TaskEditModal open={editOpen} task={task} clients={clients}
        onCancel={() => setEditOpen(false)}
        onSave={(u: TaskEditValues) => act(() => updateTask(task.id, u)).then(() => setEditOpen(false))} />
    </>
  );
}
