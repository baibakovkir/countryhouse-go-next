"use client";

import { type FormEvent } from "react";
import { FieldError } from "@/components/FieldError";
import type { FieldErrors } from "@/lib/validation";
import type { Expense, PlotObject } from "@/types/domain";

interface ExpenseFormProps {
  editing: Expense | null;
  objects: PlotObject[];
  loading: boolean;
  errors: FieldErrors;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  onCancel(): void;
}

export function ExpenseForm(props: ExpenseFormProps) {
  const { editing, objects, loading, errors, onSubmit, onCancel } = props;
  return (
    <form
      key={editing?.id ?? "new"}
      onSubmit={onSubmit}
      noValidate
      className="panel h-fit space-y-3"
    >
      <h2 className="text-xl font-semibold">{editing ? "Изменить расход" : "Новый расход"}</h2>
      <label className="field">
        Категория
        <input className="input" name="category" defaultValue={editing?.category} />
        <FieldError message={errors.category} />
      </label>
      <label className="field">
        Сумма, ₽
        <input className="input" name="amount" inputMode="decimal" defaultValue={editing?.amount} />
        <FieldError message={errors.amount} />
      </label>
      <label className="field">
        Дата
        <input className="input" name="date" type="date" defaultValue={editing?.date} />
        <FieldError message={errors.date} />
      </label>
      <label className="field">
        Объект
        <select className="input" name="plotObjectId" defaultValue={editing?.plotObjectId ?? ""}>
          <option value="">Общий расход</option>
          {objects.map((object) => (
            <option key={object.id} value={object.id}>
              {object.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Описание
        <textarea
          className="input min-h-20"
          name="description"
          defaultValue={editing?.description}
        />
      </label>
      <button className="button w-full" disabled={loading}>
        {editing ? "Сохранить" : "Добавить"}
      </button>
      {editing && (
        <button type="button" className="input w-full" onClick={onCancel}>
          Отмена
        </button>
      )}
    </form>
  );
}
