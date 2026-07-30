import type { Expense } from "@/types/domain";

interface ExpenseHistoryProps {
  expenses: Expense[];
  onEdit(expense: Expense): void;
  onDelete(expense: Expense): void;
}

export function ExpenseHistory({ expenses, onEdit, onDelete }: ExpenseHistoryProps) {
  return (
    <section className="panel">
      <h2 className="text-xl font-semibold">История</h2>
      {expenses.length === 0 ? (
        <p className="mt-4 text-slate-500">Расходов пока нет.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {expenses.map((item) => (
            <ExpenseRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

function ExpenseRow({
  item,
  onEdit,
  onDelete,
}: {
  item: Expense;
  onEdit(item: Expense): void;
  onDelete(item: Expense): void;
}) {
  return (
    <article className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div>
        <h3 className="font-semibold">{item.category}</h3>
        <p className="text-sm text-slate-500">
          {item.date}
          {item.description ? ` · ${item.description}` : ""}
        </p>
        <div className="mt-2 flex gap-2">
          <button className="text-sm text-emerald-700 underline" onClick={() => onEdit(item)}>
            Изменить
          </button>
          <button className="text-sm text-red-700 underline" onClick={() => onDelete(item)}>
            Удалить
          </button>
        </div>
      </div>
      <strong>
        {item.amount} {item.currency}
      </strong>
    </article>
  );
}
