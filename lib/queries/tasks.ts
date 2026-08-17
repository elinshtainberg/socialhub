import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/auth";
import type { Task, TaskCategory, TaskPriority } from "@/lib/supabase/types";
import { USE_MOCK_DATA, mockTasks } from "@/lib/mockData";
import { cachedFetch, cacheInvalidate } from "@/lib/queryCache";

export async function fetchTasks(filters?: {
  category?: TaskCategory;
  clientId?: string;
  studyId?: string;
  projectId?: string;
  isDaily?: boolean;
  excludeDone?: boolean;
}) {
  if (USE_MOCK_DATA) {
    let result = [...mockTasks];
    if (filters?.category) result = result.filter((t) => t.category === filters.category);
    if (filters?.clientId) result = result.filter((t) => t.client_id === filters.clientId);
    if (filters?.studyId) result = result.filter((t) => t.study_id === filters.studyId);
    if (filters?.projectId) result = result.filter((t) => t.project_id === filters.projectId);
    if (filters?.isDaily !== undefined) result = result.filter((t) => t.is_daily === filters.isDaily);
    if (filters?.excludeDone) result = result.filter((t) => t.status !== "done");
    return result;
  }

  const cacheKey = "tasks:" + JSON.stringify(filters ?? {});
  return cachedFetch(cacheKey, async () => {
    const supabase = createClient();
    let query = supabase.from("tasks").select("*").order("due_date", { ascending: true });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.clientId) query = query.eq("client_id", filters.clientId);
    if (filters?.studyId) query = query.eq("study_id", filters.studyId);
    if (filters?.projectId) query = query.eq("project_id", filters.projectId);
    if (filters?.isDaily !== undefined) query = query.eq("is_daily", filters.isDaily);
    if (filters?.excludeDone) query = query.neq("status", "done");

    const { data, error } = await query;
    if (error) throw error;
    return data as Task[];
  });
}

export async function createTask(input: {
  title: string;
  category: TaskCategory;
  client_id?: string | null;
  study_id?: string | null;
  project_id?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  is_daily?: boolean;
  duration_minutes?: number | null;
  notes?: string | null;
  workout_type?: string | null;
}) {
  if (USE_MOCK_DATA) {
    const maxOrder = mockTasks.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      user_id: "mock-user",
      title: input.title,
      category: input.category,
      client_id: input.client_id ?? null,
      study_id: input.study_id ?? null,
      project_id: input.project_id ?? null,
      due_date: input.due_date ?? null,
      priority: input.priority ?? "medium",
      is_daily: input.is_daily ?? false,
      sort_order: maxOrder + 1,
      duration_minutes: input.duration_minutes ?? null,
      notes: input.notes ?? null,
      workout_type: input.workout_type ?? null,
      status: "open",
      created_at: new Date().toISOString(),
    };
    mockTasks.push(newTask);
    return newTask;
  }

  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: input.title,
      category: input.category,
      client_id: input.client_id ?? null,
      study_id: input.study_id ?? null,
      project_id: input.project_id ?? null,
      due_date: input.due_date ?? null,
      priority: input.priority ?? "medium",
      is_daily: input.is_daily ?? false,
      duration_minutes: input.duration_minutes ?? null,
      notes: input.notes ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;
  cacheInvalidate("tasks:");
  return data as Task;
}

export async function updateTaskStatus(id: string, status: Task["status"]) {
  if (USE_MOCK_DATA) {
    const t = mockTasks.find((t) => t.id === id);
    if (t) t.status = status;
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw error;
  cacheInvalidate("tasks:");
}

export async function postponeTask(id: string, newDate: string) {
  if (USE_MOCK_DATA) {
    const t = mockTasks.find((t) => t.id === id);
    if (t) t.due_date = newDate;
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update({ due_date: newDate }).eq("id", id);
  if (error) throw error;
  cacheInvalidate("tasks:");
}

// Full task edit (title/category/client/study/project/date/priority/status/sort_order) — the single
// place every page's edit modal goes through, so behavior stays consistent.
export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      Task,
      | "title"
      | "category"
      | "client_id"
      | "study_id"
      | "project_id"
      | "due_date"
      | "priority"
      | "status"
      | "sort_order"
      | "duration_minutes"
      | "notes"
      | "workout_type"
    >
  >
) {
  if (USE_MOCK_DATA) {
    const t = mockTasks.find((t) => t.id === id);
    if (t) Object.assign(t, updates);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) throw error;
  cacheInvalidate("tasks:");
}

export async function deleteTask(id: string) {
  if (USE_MOCK_DATA) {
    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx !== -1) mockTasks.splice(idx, 1);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidate("tasks:");
}

/** Persist a new sort order for a list of task IDs (Today drag-and-drop). */
export function reorderTasks(orderedIds: string[]): void {
  if (!USE_MOCK_DATA) return; // no-op for real DB (would need a batch update)
  orderedIds.forEach((id, idx) => {
    const t = mockTasks.find((t) => t.id === id);
    if (t) t.sort_order = idx + 1;
  });
}

export async function markAllDailyDone(clientId: string) {
  if (USE_MOCK_DATA) {
    mockTasks.forEach((t) => {
      if (t.client_id === clientId && t.is_daily) t.status = "done";
    });
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: "done" })
    .eq("client_id", clientId)
    .eq("is_daily", true);
  if (error) throw error;
}
