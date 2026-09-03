"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import {
  expenseSchema,
  type ExpenseFormOutput,
  type ExpenseFormValues,
} from "@/features/expenses/expense-input";
import { applyServerErrors } from "@/lib/forms";
import type { Expense, PlotObject } from "@/types/domain";

interface ExpenseFormProps {
  editing: Expense | null;
  objects: PlotObject[];
  loading: boolean;
  onSave(input: ExpenseFormOutput): Promise<void>;
  onCancel(): void;
}

const defaults = (item: Expense | null): ExpenseFormValues => ({
  category: item?.category ?? "",
  amount: item?.amount ?? "",
  date: item?.date ?? "",
  plotObjectId: item?.plotObjectId ?? "",
  description: item?.description ?? "",
  currency: "RUB",
});

export function ExpenseForm({ editing, objects, loading, onSave, onCancel }: ExpenseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExpenseFormValues, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
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
  const options = [
    { value: "", label: "Общий расход" },
    ...objects.map((object) => ({ value: object.id, label: object.name })),
  ];

  return (
    <form onSubmit={submit} noValidate className="panel h-fit space-y-4">
      <div>
        <p className="eyebrow">Финансы</p>
        <h2 className="text-xl font-semibold">{editing ? "Изменить расход" : "Новый расход"}</h2>
      </div>
      <TextField label="Категория" error={errors.category?.message} {...register("category")} />
      <TextField
        label="Сумма, ₽"
        inputMode="decimal"
        error={errors.amount?.message}
        {...register("amount")}
      />
      <TextField label="Дата" type="date" error={errors.date?.message} {...register("date")} />
      <Controller
        name="plotObjectId"
        control={control}
        render={({ field }) => (
          <SelectField
            label="Объект"
            value={field.value}
            options={options}
            onChange={field.onChange}
          />
        )}
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
