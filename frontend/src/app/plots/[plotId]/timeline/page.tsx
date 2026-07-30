"use client";

import { type FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { PlotPageHeader } from "@/components/PlotPageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { TaskForm } from "@/features/timeline/TaskForm";
import { TaskList } from "@/features/timeline/TaskList";
import { readTaskInput, validateTaskInput } from "@/features/timeline/task-input";
import { errorDetails } from "@/lib/api";
import type { FieldErrors } from "@/lib/validation";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { useDataStore } from "@/stores/data-store";
import type { TimelineTask } from "@/types/domain";

export default function TimelinePage() {
  const { plotId } = useParams<{ plotId: string }>();
  const store = useDataStore();
  const status = usePlotPage(plotId, store.loadPlot, store.loadTasks);
  const [editing, setEditing] = useState<TimelineTask | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const next = validateTaskInput(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const request = editing
      ? store.updateTask(plotId, editing.id, readTaskInput(form))
      : store.createTask(plotId, readTaskInput(form));
    await request
      .then(() => {
        form.reset();
        setEditing(null);
      })
      .catch((error) => setErrors(errorDetails(error)));
  }

  async function remove(item: TimelineTask) {
    if (!confirm(`Удалить задачу «${item.title}»?`)) return;
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
          errors={errors}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
        />
        <TaskList tasks={store.tasks} onEdit={setEditing} onDelete={(item) => void remove(item)} />
      </div>
    </div>
  );
}
