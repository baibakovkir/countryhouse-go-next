"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/FormField";
import type { FloorElement, SaveFloorElement } from "@/types/domain";

const schema = z.object({
  name: z.string().trim().min(1, "Введите название"),
  x: z.coerce.number().min(0),
  y: z.coerce.number().min(0),
  width: z.coerce.number().positive(),
  length: z.coerce.number().positive(),
  height: z.coerce.number().min(0),
  rotation: z.coerce.number(),
});
type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;
const values = (element: FloorElement): Values => ({
  name: element.name,
  x: element.x,
  y: element.y,
  width: element.width,
  length: element.length,
  height: element.height,
  rotation: element.rotation,
});

// eslint-disable-next-line max-lines-per-function
export function ElementInspector({
  element,
  loading,
  onSave,
  onDelete,
}: {
  element: FloorElement;
  loading: boolean;
  onSave(input: SaveFloorElement): Promise<void>;
  onDelete(): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: values(element),
  });
  useEffect(() => reset(values(element)), [element, reset]);
  const submit = handleSubmit((input) =>
    onSave({
      catalogKey: element.catalogKey,
      category: element.category,
      name: input.name,
      x: input.x,
      y: input.y,
      width: input.width,
      length: input.length,
      height: input.height,
      rotation: input.rotation,
      geometry: element.geometry,
      points: element.points,
      properties: element.properties,
    }),
  );
  return (
    <form className="space-y-3 border-t border-slate-200 pt-4" onSubmit={submit} noValidate>
      <div>
        <p className="eyebrow">Выбранный элемент</p>
        <h3 className="font-bold">{element.name}</h3>
      </div>
      <TextField label="Название" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="X, м" inputMode="decimal" error={errors.x?.message} {...register("x")} />
        <TextField label="Y, м" inputMode="decimal" error={errors.y?.message} {...register("y")} />
        <TextField
          label="Ширина, м"
          inputMode="decimal"
          error={errors.width?.message}
          {...register("width")}
        />
        <TextField
          label="Глубина, м"
          inputMode="decimal"
          error={errors.length?.message}
          {...register("length")}
        />
        <TextField
          label="Высота, м"
          inputMode="decimal"
          error={errors.height?.message}
          {...register("height")}
        />
        <TextField
          label="Поворот, °"
          inputMode="decimal"
          error={errors.rotation?.message}
          {...register("rotation")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" disabled={loading}>
          Сохранить
        </Button>
        <ConfirmDialog
          title="Удалить элемент?"
          description={`«${element.name}» будет удалён с плана этажа.`}
          onConfirm={() => void onDelete()}
        />
      </div>
    </form>
  );
}
