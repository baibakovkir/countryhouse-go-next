"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import type { PlotPoint } from "@/types/domain";

interface TerrainValues {
  points: Array<{ x: string; y: string; z: string }>;
}

// eslint-disable-next-line max-lines-per-function
export function TerrainEditor({
  points,
  width,
  length,
  loading,
  onSave,
  editingOnPlan,
  onEditingOnPlan,
}: {
  points: PlotPoint[];
  width: number;
  length: number;
  loading: boolean;
  onSave(points: PlotPoint[]): Promise<void>;
  editingOnPlan: boolean;
  onEditingOnPlan(value: boolean): void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TerrainValues>({
    defaultValues: { points: points.map(stringPoint) },
  });
  const rows = useFieldArray({ control, name: "points" });
  useEffect(() => reset({ points: points.map(stringPoint) }), [points, reset]);
  const submit = handleSubmit(async ({ points: values }) => {
    const parsed = values.map((point) => ({
      x: Number(point.x),
      y: Number(point.y),
      z: Number(point.z),
    }));
    const invalid = parsed.findIndex(
      (point) =>
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        !Number.isFinite(point.z) ||
        point.x < 0 ||
        point.y < 0 ||
        point.x > width ||
        point.y > length,
    );
    if (invalid >= 0) {
      setError(`points.${invalid}.x`, { message: "Точка должна находиться в границах участка" });
      return;
    }
    await onSave(parsed).catch(() => undefined);
  });
  return (
    <form className="panel space-y-3" onSubmit={submit}>
      <div>
        <p className="eyebrow">Рельеф</p>
        <h2 className="text-xl font-semibold">Высотные отметки</h2>
        <p className="mt-1 text-sm text-slate-600">
          Добавьте измеренные точки X, Y и высоту Z. Поверхность между ними строится автоматически.
        </p>
      </div>
      {rows.fields.map((row, index) => (
        <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_44px] items-end gap-2">
          <TextField
            label="X, м"
            inputMode="decimal"
            error={errors.points?.[index]?.x?.message}
            {...register(`points.${index}.x`, { required: true })}
          />
          <TextField
            label="Y, м"
            inputMode="decimal"
            {...register(`points.${index}.y`, { required: true })}
          />
          <TextField
            label="Z, м"
            inputMode="decimal"
            {...register(`points.${index}.z`, { required: true })}
          />
          <Button
            type="button"
            variant="ghost"
            aria-label={`Удалить точку ${index + 1}`}
            onClick={() => rows.remove(index)}
          >
            ×
          </Button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => rows.append({ x: "0", y: "0", z: "0" })}
        >
          Добавить точку
        </Button>
        <Button type="submit" disabled={loading}>
          Сохранить рельеф
        </Button>
      </div>
      <Button
        type="button"
        className="w-full"
        variant={editingOnPlan ? "primary" : "secondary"}
        onClick={() => onEditingOnPlan(!editingOnPlan)}
      >
        {editingOnPlan ? "Завершить редактирование на плане" : "Двигать точки на плане"}
      </Button>
    </form>
  );
}

const stringPoint = (point: PlotPoint) => ({
  x: String(point.x),
  y: String(point.y),
  z: String(point.z),
});
