"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/FormField";
import {
  taskSchema,
  type TaskFormOutput,
  type TaskFormValues,
} from "@/features/timeline/task-input";
import { applyServerErrors } from "@/lib/forms";
import type { TimelineTask } from "@/types/domain";

interface TaskFormProps {
  editing: TimelineTask | null;
  loading: boolean;
  onSave(input: TaskFormOutput): Promise<void>;
  onCancel(): void;
}
const defaults = (item: TimelineTask | null): TaskFormValues => ({
  title: item?.title ?? "",
  dueDate: item?.dueDate ?? "",
  plannedBudget: item?.plannedBudget ?? "",
  description: item?.description ?? "",
  currency: "RUB",
});

export function TaskForm({ editing, loading, onSave, onCancel }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaskFormValues, unknown, TaskFormOutput>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaults(editing),
    mode: "onBlur",
  });
  useEffect(() => reset(defaults(editing)), [editing, reset]);
  const submit = handleSubmit(async (input) =>
    onSave(input)
      .then(() => {
        reset(defaults(null));
        onCancel();
      })
      .catch((error) => applyServerErrors(error, setError)),
  );
  return (
    <form onSubmit={submit} noValidate className="panel h-fit space-y-4">
      <div>
        <p className="eyebrow">Календарь</p>
        <h2 className="text-xl font-semibold">{editing ? "Изменить задачу" : "Новая задача"}</h2>
      </div>
      <TextField label="Что сделать" error={errors.title?.message} {...register("title")} />
      <TextField
        label="Срок"
        type="date"
        error={errors.dueDate?.message}
        {...register("dueDate")}
      />
      <TextField
        label="Плановый бюджет, ₽"
        inputMode="decimal"
        error={errors.plannedBudget?.message}
        {...register("plannedBudget")}
      />
      <TextAreaField
        label="Описание"
        error={errors.description?.message}
        {...register("description")}
      />
      {errors.root?.server?.message && (
        <p className="text-sm text-red-700">{errors.root.server.message}</p>
      )}
      <Button className="w-full" type="submit" disabled={loading}>
        {editing ? "Сохранить" : "Добавить"}
      </Button>
      {editing && (
        <Button className="w-full" type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      )}
    </form>
  );
}
