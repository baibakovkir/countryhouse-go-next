"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PlotPageHeader } from "@/components/PlotPageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { ExpenseForm } from "@/features/expenses/ExpenseForm";
import { ExpenseHistory } from "@/features/expenses/ExpenseHistory";
import type { ExpenseFormOutput } from "@/features/expenses/expense-input";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { useDataStore } from "@/stores/data-store";
import type { Expense } from "@/types/domain";

export default function ExpensesPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const store = useDataStore();
  const status = usePlotPage(plotId, store.loadPlot, store.loadExpenses);
  const [editing, setEditing] = useState<Expense | null>(null);
  async function save(input: ExpenseFormOutput) {
    const request = editing
      ? store.updateExpense(plotId, editing.id, input)
      : store.createExpense(plotId, input);
    await request;
  }

  async function remove(item: Expense) {
    await store
      .deleteExpense(plotId, item.id)
      .then(() => setEditing(null))
      .catch(() => undefined);
  }

  if (status !== "authenticated" || !store.plot)
    return <StatusMessage error={store.error} loading />;
  return (
    <div className="space-y-5">
      <PlotPageHeader
        plotId={plotId}
        title={`Расходы · ${store.plot.name}`}
        description="Общие траты и расходы по объектам."
      />
      <StatusMessage error={store.error} loading={store.loading} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <ExpenseForm
          editing={editing}
          objects={store.plot.objects}
          loading={store.loading}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
        <ExpenseHistory
          expenses={store.expenses}
          onEdit={setEditing}
          onDelete={(item) => void remove(item)}
        />
      </div>
    </div>
  );
}
