// Google sync helpers — no React hooks, safe to import from any client-side module.
// All calls are best-effort: failure never blocks the main action.

export async function pushCalendarItemToGoogle(item: {
  id: string;
  title: string;
  date: string;
  startTime?: string | null;
  notes?: string | null;
}) {
  try {
    await fetch("/api/google/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calendarItemId: item.id,
        title: item.title,
        date: item.date,
        startTime: item.startTime ?? null,
        notes: item.notes ?? null,
      }),
    });
  } catch {}
}

export async function deleteGoogleEvent(googleEventId: string) {
  try {
    await fetch(`/api/google/events?googleEventId=${encodeURIComponent(googleEventId)}`, {
      method: "DELETE",
    });
  } catch {}
}

export async function pushTaskToGoogle(task: {
  id: string;
  title: string;
  dueDate?: string | null;
  notes?: string | null;
}) {
  try {
    await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate ?? null,
        notes: task.notes ?? null,
      }),
    });
  } catch {}
}

export async function deleteGoogleTask(googleTaskId: string, listId: string) {
  try {
    await fetch(
      `/api/google/tasks?googleTaskId=${encodeURIComponent(googleTaskId)}&listId=${encodeURIComponent(listId)}`,
      { method: "DELETE" }
    );
  } catch {}
}
