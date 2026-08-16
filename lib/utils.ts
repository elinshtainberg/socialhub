import type { TaskPriority, TaskStatus } from "@/lib/supabase/types";

// "Regular" priority intentionally has no visible label — only urgent/low are
// meaningful signals worth a badge. This avoids the old "רגילה" badge being
// confused with task status.
export function priorityLabel(p: TaskPriority) {
  return { low: "נמוכה", medium: "", urgent: "דחוף" }[p];
}

export function priorityColor(p: TaskPriority): "gray" | "purple" | "urgent" {
  return { low: "gray", medium: "purple", urgent: "urgent" }[p] as
    | "gray"
    | "purple"
    | "urgent";
}

// Single source of truth for task status labels/colors, used consistently
// across today/week/month/personal/client pages.
export function taskStatusLabel(s: TaskStatus) {
  return { open: "פתוחה", in_progress: "בתהליך", done: "הושלמה" }[s];
}

export function taskStatusColor(s: TaskStatus): "gray" | "purple" | "blue" {
  return { open: "gray", in_progress: "purple", done: "blue" }[s];
}

// ----------------------------------------------------------------------
// Date helpers — all "YYYY-MM-DD" strings represent a calendar date with
// no timezone attached. They must NEVER be round-tripped through
// `Date.toISOString()` (which converts to UTC and can shift the date by a
// day) — that was the root cause of the "postpone to tomorrow shows the
// day after" bug. Always build/parse date strings using local
// year/month/day components instead.
// ----------------------------------------------------------------------

// Converts a local Date object to a "YYYY-MM-DD" string using its local
// (not UTC) date components.
export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parses a "YYYY-MM-DD" string into a local Date at midnight, avoiding the
// UTC-midnight interpretation that `new Date(dateStr)` would otherwise use.
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return localDateStr(new Date());
}

export function formatDateHe(dateStr: string | null) {
  if (!dateStr) return "";
  return parseLocalDate(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

export function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  return dateStr === todayISO();
}

export function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return dateStr < todayISO();
}
