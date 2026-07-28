"use client";

import Link from "next/link";
import { type FormEvent, useEffect } from "react";
import { StatusMessage } from "@/components/StatusMessage";
import { useDataStore } from "@/stores/data-store";

export default function ExpensesPage() {
  const { plot, expenses, loading, error, loadPlot, loadExpenses, createExpense } = useDataStore();
  useEffect(() => { void loadPlot(); }, [loadPlot]);
  useEffect(() => { if (plot) void loadExpenses(); }, [plot, loadExpenses]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const objectID = String(data.get("plotObjectId"));
    await createExpense({
      plotObjectId: objectID || null,
      category: String(data.get("category")), amount: String(data.get("amount")), currency: "RUB",
      date: String(data.get("date")), description: String(data.get("description")),
    }).then(() => form.reset()).catch(() => undefined);
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Расходы</h1><p className="mt-1 text-slate-600">Общие траты и расходы по объектам.</p></div>
      <StatusMessage error={error} loading={loading} />
      {!plot ? <p className="panel">Сначала <Link className="text-emerald-700 underline" href="/plot">создайте участок</Link>.</p> : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form onSubmit={submit} className="panel h-fit space-y-3">
            <h2 className="text-xl font-semibold">Новый расход</h2>
            <label className="field">Категория<input className="input" name="category" placeholder="Материалы" required /></label>
            <label className="field">Сумма, ₽<input className="input" name="amount" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" required /></label>
            <label className="field">Дата<input className="input" name="date" type="date" required /></label>
            <label className="field">Объект<select className="input" name="plotObjectId"><option value="">Общий расход</option>{plot.objects.map((object) => <option key={object.id} value={object.id}>{object.name}</option>)}</select></label>
            <label className="field">Описание<textarea className="input min-h-20" name="description" /></label>
            <button className="button w-full" disabled={loading}>Сохранить</button>
          </form>
          <section className="panel">
            <h2 className="text-xl font-semibold">История</h2>
            {expenses.length === 0 ? <p className="mt-4 text-slate-500">Расходов пока нет.</p> : <div className="mt-4 divide-y divide-slate-100">{expenses.map((item) => (
              <article key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div><h3 className="font-semibold">{item.category}</h3><p className="text-sm text-slate-500">{item.date}{item.description ? ` · ${item.description}` : ""}</p></div>
                <strong>{item.amount} {item.currency}</strong>
              </article>
            ))}</div>}
          </section>
        </div>
      )}
    </div>
  );
}
