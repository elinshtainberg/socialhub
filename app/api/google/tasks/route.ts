import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/getToken";
import { getDefaultTaskListId, listTasks, createTask, deleteTask } from "@/lib/google/tasksApi";

// GET /api/google/tasks
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ connected: false, tasks: [] });

  const listId = await getDefaultTaskListId(token);
  const tasks = await listTasks(token, listId);
  return NextResponse.json({ connected: true, tasks, listId });
}

// POST /api/google/tasks — create task in Google Tasks + store google_task_id
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ ok: false, reason: "not_connected" });

  const body = await req.json();
  const { taskId, title, notes, dueDate } = body;

  const listId = await getDefaultTaskListId(token);
  const gTask = await createTask(token, listId, {
    title,
    notes: notes ?? undefined,
    due: dueDate ? `${dueDate}T00:00:00.000Z` : undefined,
  });

  if (taskId) {
    await supabase
      .from("tasks")
      .update({ google_task_id: gTask.id, google_task_list_id: listId })
      .eq("id", taskId);
  }

  return NextResponse.json({ ok: true, googleTaskId: gTask.id });
}

// DELETE /api/google/tasks?googleTaskId=xxx&listId=xxx
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const googleTaskId = req.nextUrl.searchParams.get("googleTaskId");
  const listId = req.nextUrl.searchParams.get("listId");
  if (!googleTaskId || !listId) return NextResponse.json({ ok: true });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ ok: false, reason: "not_connected" });

  await deleteTask(token, listId, googleTaskId);
  return NextResponse.json({ ok: true });
}
