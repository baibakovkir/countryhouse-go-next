"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, type FieldErrors, type UseFormRegister, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import {
  createObjectSchema,
  type ObjectFormOutput,
  type ObjectFormValues,
} from "@/features/plot/object-input";
import { applyServerErrors } from "@/lib/forms";
import type { Plot, PlotObject } from "@/types/domain";

interface PlotObjectFormProps {
  plot: Plot;
  current: PlotObject | null;
  loading: boolean;
  onSave(input: ObjectFormOutput): Promise<void>;
  onCreateNew(): void;
  onDelete(object: PlotObject): Promise<void>;
}

const types = [
  { value: "building", label: "Строение" },
  { value: "garden_bed", label: "Грядка" },
  { value: "tree", label: "Дерево" },
];

function defaults(object: PlotObject | null): ObjectFormValues {
  if (!object)
    return {
      type: "building",
      name: "",
      x: "0",
      y: "0",
      width: "1",
      length: "1",
      height: "0",
      z: 0,
    };
  return {
    type: object.type,
    name: object.name,
    x: String(object.x),
    y: String(object.y),
    width: String(object.width),
    length: String(object.length),
    height: String(object.height),
    z: 0,
  };
}

export function PlotObjectForm({
  plot,
  current,
  loading,
  onSave,
  onCreateNew,
  onDelete,
}: PlotObjectFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ObjectFormValues, unknown, ObjectFormOutput>({
    resolver: zodResolver(createObjectSchema(plot)),
    defaultValues: defaults(current),
    mode: "onBlur",
  });

  useEffect(() => reset(defaults(current)), [current, reset]);

  const submit = handleSubmit(async (input) => {
    await onSave(input)
      .then(() => {
        reset(defaults(null));
        onCreateNew();
      })
      .catch((error) => applyServerErrors(error, setError));
  });

  return (
    <form onSubmit={submit} noValidate className="panel h-fit space-y-4">
      <ObjectFormHeader editing={Boolean(current)} />
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <SelectField
            label="Тип"
            value={field.value}
            options={types}
            onChange={field.onChange}
            error={fieldError(errors, "type")}
          />
        )}
      />
      <TextField label="Название" error={fieldError(errors, "name")} {...register("name")} />
      <GeometryFields register={register} errors={errors} />
      {errors.root?.server?.message && (
        <p className="text-sm text-red-700">{errors.root.server.message}</p>
      )}
      <ObjectFormActions
        current={current}
        loading={loading}
        onCreateNew={onCreateNew}
        onDelete={onDelete}
      />
    </form>
  );
}

function fieldError(errors: FieldErrors<ObjectFormValues>, field: keyof ObjectFormValues) {
  return errors[field]?.message;
}

function ObjectFormHeader({ editing }: { editing: boolean }) {
  return (
    <div>
      <p className="eyebrow">Объект</p>
      <h2 className="text-xl font-semibold">{editing ? "Редактирование" : "Новый объект"}</h2>
    </div>
  );
}

function GeometryFields({
  register,
  errors,
}: {
  register: UseFormRegister<ObjectFormValues>;
  errors: FieldErrors<ObjectFormValues>;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="X"
          inputMode="decimal"
          error={fieldError(errors, "x")}
          {...register("x")}
        />
        <TextField
          label="Y"
          inputMode="decimal"
          error={fieldError(errors, "y")}
          {...register("y")}
        />
        <TextField
          label="Ширина"
          inputMode="decimal"
          error={fieldError(errors, "width")}
          {...register("width")}
        />
        <TextField
          label="Длина"
          inputMode="decimal"
          error={fieldError(errors, "length")}
          {...register("length")}
        />
      </div>
      <TextField
        label="Высота, м"
        inputMode="decimal"
        error={fieldError(errors, "height")}
        {...register("height")}
      />
    </>
  );
}

function ObjectFormActions({
  current,
  loading,
  onCreateNew,
  onDelete,
}: Pick<PlotObjectFormProps, "current" | "loading" | "onCreateNew" | "onDelete">) {
  return (
    <>
      <Button className="w-full" disabled={loading}>
        {current ? "Сохранить" : "Добавить"}
      </Button>
      {current && (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCreateNew}>
            Новый объект
          </Button>
          <ConfirmDialog
            title="Удалить объект?"
            description={`«${current.name}» будет удалён без возможности восстановления.`}
            onConfirm={() => void onDelete(current)}
          />
        </div>
      )}
    </>
  );
}
