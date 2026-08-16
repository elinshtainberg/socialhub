"use client";

import { Spinner } from "@/components/ui/Spinner";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddTaskTrigger, TaskModal } from "@/components/tasks/TaskModal";
import { TaskList } from "@/components/tasks/TaskList";
import { fetchTasks } from "@/lib/queries/tasks";
import { fetchClients } from "@/lib/queries/clients";
import { PersonalGrid } from "@/components/personal/PersonalGrid";
import type { Client, Task } from "@/lib/supabase/types";

export default function PersonalPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([
        fetchTasks({ category: "personal" }),
        fetchClients(),
      ]);
      setTasks(t); setClients(c);
    } catch (e) {
      console.error("personal load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = tasks.filter((t) => t.status !== "done").length;

  return (
    <div>
      <PageHeader title="אישי" subtitle={`${open} משימות פתוחות`} />

      <PersonalGrid />

      <div className="mb-6">
        <AddTaskTrigger onClick={() => setAddOpen(true)} />
        <TaskModal open={addOpen} onClose={() => setAddOpen(false)} defaultCategory="personal" onCreated={load} />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        // Done tasks fade in place inside the same list — never a separate card.
        <TaskList
          tasks={tasks}
          clients={clients}
          onChanged={load}
          emptyText="אין משימות אישיות 🌿"
        />
      )}
    </div>
  );
}
