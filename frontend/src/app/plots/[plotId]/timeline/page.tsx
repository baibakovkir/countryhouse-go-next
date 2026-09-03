"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PlotPageHeader } from "@/components/PlotPageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { TaskForm } from "@/features/timeline/TaskForm";
import { TaskList } from "@/features/timeline/TaskList";
import type { TaskFormOutput } from "@/features/timeline/task-input";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { useDataStore } from "@/stores/data-store";
import type { TimelineTask } from "@/types/domain";

export default function TimelinePage() {
  const { plotId } = useParams<{ plotId: string }>();
  const store = useDataStore();
  const status = usePlotPage(plotId, store.loadPlot, store.loadTasks);
  const [editing, setEditing] = useState<TimelineTask | null>(null);
  async function save(input: TaskFormOutput) {
    const request = editing
      ? store.updateTask(plotId, editing.id, input)
      : store.createTask(plotId, input);
    await request;
  }

  async function remove(item: TimelineTask) {
    await store
      .deleteTask(plotId, item.id)
      .then(() => setEditing(null))
      .catch(() => undefined);
  }

  if (status !== "authenticated" || !store.plot)
    return <StatusMessage error={store.error} loading />;
  return (
    <div className="space-y-5">
      <PlotPageHeader
        plotId={plotId}
        title={`Работы · ${store.plot.name}`}
        description="Задачи отсортированы по сроку."
      />
      <StatusMessage error={store.error} loading={store.loading} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <TaskForm
          editing={editing}
          loading={store.loading}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
        <TaskList tasks={store.tasks} onEdit={setEditing} onDelete={(item) => void remove(item)} />
      </div>
    </div>
  );
}
