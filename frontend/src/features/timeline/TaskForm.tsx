"use client";

import { type FormEvent } from "react";
import { FieldError } from "@/components/FieldError";
import type { FieldErrors } from "@/lib/validation";
import type { TimelineTask } from "@/types/domain";

interface TaskFormProps {
  editing: TimelineTask | null;
  loading: boolean;
  errors: FieldErrors;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  onCancel(): void;
}

export function TaskForm({ editing, loading, errors, onSubmit, onCancel }: TaskFormProps) {
  return (
    <form
      key={editing?.id ?? "new"}
      onSubmit={onSubmit}
      noValidate
      className="panel h-fit space-y-3"
    >
      <h2 className="text-xl font-semibold">{editing ? "Изменить задачу" : "Новая задача"}</h2>
      <label className="field">
        Что сделать
        <input className="input" name="title" defaultValue={editing?.title} />
        <FieldError message={errors.title} />
      </label>
      <label className="field">
        Срок
        <input className="input" name="dueDate" type="date" defaultValue={editing?.dueDate} />
        <FieldError message={errors.dueDate} />
      </label>
      <label className="field">
        Плановый бюджет, ₽
        <input
          className="input"
          name="plannedBudget"
          inputMode="decimal"
          defaultValue={editing?.plannedBudget ?? ""}
        />
        <FieldError message={errors.plannedBudget} />
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
