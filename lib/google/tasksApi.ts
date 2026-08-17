const BASE = "https://www.googleapis.com/tasks/v1";

export interface GTask {
  id: string;
  title?: string;
  notes?: string;
  due?: string;
  status?: "needsAction" | "completed";
  selfLink?: string;
}

export interface GTaskList {
  id: string;
  title: string;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getDefaultTaskListId(token: string): Promise<string> {
  const res = await fetch(`${BASE}/users/@me/lists?maxResults=1`, { headers: headers(token) });
  if (!res.ok) throw new Error("Failed to get task lists");
  const data = await res.json();
  return data.items?.[0]?.id ?? "@default";
}

export async function listTasks(token: string, taskListId: string): Promise<GTask[]> {
  const res = await fetch(
    `${BASE}/lists/${taskListId}/tasks?showCompleted=true&maxResults=100`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error("Failed to list Google tasks");
  const data = await res.json();
  return data.items ?? [];
}

export async function createTask(token: string, taskListId: string, task: {
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp
}): Promise<GTask> {
  const res = await fetch(`${BASE}/lists/${taskListId}/tasks`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create Google task");
  return res.json();
}

export async function deleteTask(token: string, taskListId: string, taskId: string): Promise<void> {
  await fetch(`${BASE}/lists/${taskListId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateTask(token: string, taskListId: string, taskId: string, patch: Partial<GTask>): Promise<GTask> {
  const res = await fetch(`${BASE}/lists/${taskListId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update Google task");
  return res.json();
}
