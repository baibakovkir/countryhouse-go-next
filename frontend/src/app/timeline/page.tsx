"use client";

import Link from "next/link";
import { type FormEvent, useEffect } from "react";
import { StatusMessage } from "@/components/StatusMessage";
import { useDataStore } from "@/stores/data-store";

export default function TimelinePage() {
  const { plot, tasks, loading, error, loadPlot, loadTasks, createTask } = useDataStore();
  useEffect(() => { void loadPlot(); }, [loadPlot]);
  useEffect(() => { if (plot) void loadTasks(); }, [plot, loadTasks]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawBudget = String(data.get("plannedBudget"));
    await createTask({
      title: String(data.get("title")), dueDate: String(data.get("dueDate")),
      plannedBudget: rawBudget || null, currency: "RUB", description: String(data.get("description")),
    }).then(() => form.reset()).catch(() => undefined);
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">План работ</h1><p className="mt-1 text-slate-600">Задачи отсортированы по сроку.</p></div>
      <StatusMessage error={error} loading={loading} />
      {!plot ? <p className="panel">Сначала <Link className="text-emerald-700 underline" href="/plot">создайте участок</Link>.</p> : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form onSubmit={submit} className="panel h-fit space-y-3">
            <h2 className="text-xl font-semibold">Новая задача</h2>
            <label className="field">Что сделать<input className="input" name="title" required /></label>
            <label className="field">Срок<input className="input" name="dueDate" type="date" required /></label>
            <label className="field">Плановый бюджет, ₽<input className="input" name="plannedBudget" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" /></label>
            <label className="field">Описание<textarea className="input min-h-20" name="description" /></label>
            <button className="button w-full" disabled={loading}>Добавить</button>
          </form>
          <section className="panel">
            <h2 className="text-xl font-semibold">Ближайшие работы</h2>
            {tasks.length === 0 ? <p className="mt-4 text-slate-500">Задач пока нет.</p> : <ol className="mt-4 space-y-3">{tasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{task.title}</h3><time className="text-sm font-medium text-emerald-800">{task.dueDate}</time></div>
                {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
                {task.plannedBudget !== null && <p className="mt-2 text-sm">Бюджет: <strong>{task.plannedBudget} {task.currency}</strong></p>}
              </li>
            ))}</ol>}
          </section>
        </div>
      )}
    </div>
  );
}
