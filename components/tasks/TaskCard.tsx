"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PostponeModal } from "@/components/tasks/PostponeModal";
import { TaskEditModal, type TaskEditValues } from "@/components/tasks/TaskEditModal";
import type { Client, Task } from "@/lib/supabase/types";
import { deleteTask, postponeTask, updateTask, updateTaskStatus } from "@/lib/queries/tasks";
import { formatDateHe, isOverdue } from "@/lib/utils";

export function TaskCard({
  task, relatedLabel, clients = [], onChanged, highlight = false,
}: {
  task: Task;
  relatedLabel?: string;
  clients?: Client[];
  onChanged: () => void;
  highlight?: boolean;
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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (
        menuBtnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [menuOpen]);

  async function act(fn: () => Promise<void>) { await fn(); onChanged(); }

  function openMenu() {
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuW = 176;
    const left  = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
    setMenuPos({ top: rect.bottom + 4, left });
    setMenuOpen(true);
  }

  const meta: React.ReactNode[] = [];
  if (relatedLabel)
    meta.push(<span key="rel" className="text-[11px] font-light text-t-3">{relatedLabel}</span>);
  if (task.category === "client" && task.workout_type)
    meta.push(
      <span key="ctype" className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
        style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>{task.workout_type}</span>
    );
  if (task.priority === "urgent" && !isDone)
    meta.push(
      <span key="urg" className="text-[10px] px-1.5 py-0.5 rounded font-medium"
        style={{ background: "rgba(198,125,78,0.15)", color: "#C67D4E" }}>דחוף</span>
    );
  if (isIP && !isDone)
    meta.push(
      <span key="ip" className="text-[10px] px-1.5 py-0.5 rounded font-medium"
        style={{ background: "rgba(156,144,120,0.12)", color: "#3E4640" }}>בתהליך</span>
    );
  if (task.due_date)
    meta.push(
      <span key="date" className="text-[11px] font-light"
        style={{ color: overdue ? "#C67D4E" : "#9C8B7A" }}>
        {formatDateHe(task.due_date)}
      </span>
    );

  const menuItems: { label: string; danger?: boolean; onClick: () => void }[] = [
    { label: "עריכה", onClick: () => { setMenuOpen(false); setEditOpen(true); } },
    task.status === "open"
      ? { label: "סמן כבתהליך", onClick: () => { setMenuOpen(false); act(() => updateTaskStatus(task.id, "in_progress")); } }
      : task.status === "in_progress"
        ? { label: "החזר לפתוחה", onClick: () => { setMenuOpen(false); act(() => updateTaskStatus(task.id, "open")); } }
        : { label: "פתח מחדש",    onClick: () => { setMenuOpen(false); act(() => updateTaskStatus(task.id, "open")); } },
    task.priority === "urgent"
      ? { label: "הסר דחיפות", onClick: () => { setMenuOpen(false); act(() => updateTask(task.id, { priority: "medium" })); } }
      : { label: "סמן כדחוף",  onClick: () => { setMenuOpen(false); act(() => updateTask(task.id, { priority: "urgent" })); } },
    { label: "דחה / שנה תאריך", onClick: () => { setMenuOpen(false); setPostponeOpen(true); } },
    { label: "מחיקה", danger: true, onClick: () => { setMenuOpen(false); setConfirmOpen(true); } },
  ];

  return (
    <>
      <div
        className="task-row flex items-center gap-3 px-4 py-3.5"
        style={{ borderRadius: 16, opacity: isDone ? 0.45 : 1, ...(highlight && { border: "1px solid #F97316" }) }}
      >
        {/* ── Completion circle ── */}
        <button
          onClick={() => act(() => updateTaskStatus(task.id, isDone ? "open" : "done"))}
          title={isDone ? "פתח מחדש" : "סמן כבוצע"}
          className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: isDone ? "rgba(156,144,120,0.6)" : "rgba(181,154,127,0.22)",
            background:  isDone ? "rgba(156,144,120,0.12)" : "transparent",
          }}
        >
          {isDone && (
            <span className="block w-2 h-2 rounded-full" style={{ background: "rgba(156,144,120,0.75)" }} />
          )}
        </button>

        {/* ── Title + metadata ── */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-light text-t-1 leading-snug"
            style={{ textDecoration: isDone ? "line-through" : "none" }}
          >
            {task.title}
          </p>
          {meta.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {meta}
            </div>
          )}
        </div>

        {/* ── Three-dot menu ── */}
        <button
          ref={menuBtnRef}
          onClick={openMenu}
          title="פעולות נוספות"
          className="shrink-0 p-1.5 rounded-lg transition-all"
          style={{
            color:      "rgba(181,154,127,0.35)",
            background: menuOpen ? "rgba(181,154,127,0.07)" : "transparent",
          }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* ── Portal menu ── */}
      {mounted && menuOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position:             "fixed",
            top:                  menuPos.top,
            left:                 menuPos.left,
            zIndex:               9999,
            minWidth:             176,
            background:           "rgba(255,250,245,0.97)",
            backdropFilter:       "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border:               "1px solid rgba(181,154,127,0.13)",
            borderRadius:         12,
            boxShadow:            "0 8px 32px rgba(100,70,50,0.15)",
            padding:              "4px 0",
            direction:            "rtl",
          }}
        >
          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full text-right px-4 py-2.5 text-[13px] font-light transition-colors"
              style={{ color: item.danger ? "#B85C5C" : "#33291F", display: "block" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = item.danger ? "rgba(200,90,90,0.07)" : "rgba(181,154,127,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* ── Modals ── */}
      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => act(() => deleteTask(task.id)).then(() => setConfirmOpen(false))}
      />
      <PostponeModal
        open={postponeOpen}
        currentDate={task.due_date}
        onCancel={() => setPostponeOpen(false)}
        onConfirm={d => act(() => postponeTask(task.id, d)).then(() => setPostponeOpen(false))}
      />
      <TaskEditModal
        open={editOpen}
        task={task}
        clients={clients}
        onCancel={() => setEditOpen(false)}
        onSave={(u: TaskEditValues) => act(() => updateTask(task.id, u)).then(() => setEditOpen(false))}
      />
    </>
  );
}
