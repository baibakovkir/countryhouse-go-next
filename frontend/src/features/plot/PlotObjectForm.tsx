"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useForm,
  useWatch,
} from "react-hook-form";
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
  { value: "terrace", label: "Терраса" },
  { value: "stairs", label: "Ступени" },
  { value: "utility", label: "Коммуникация" },
  { value: "custom", label: "Свой элемент" },
];
const geometries = [
  { value: "footprint", label: "Площадь" },
  { value: "polyline", label: "Трасса" },
  { value: "polygon", label: "Полигон" },
];

function defaults(object: PlotObject | null): ObjectFormValues {
  if (!object)
    return {
      type: "building",
      geometry: "footprint",
      name: "",
      x: "0",
      y: "0",
      width: "1",
      length: "1",
      height: "0",
      z: "0",
      points: "[]",
      properties: "{}",
    };
  return {
    type: object.type,
    geometry: object.geometry ?? "footprint",
    name: object.name,
    x: String(object.x),
    y: String(object.y),
    width: String(object.width),
    length: String(object.length),
    height: String(object.height),
    z: String(object.z),
    points: JSON.stringify(object.points ?? []),
    properties: JSON.stringify(object.properties ?? {}),
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
            value={field.value ?? "building"}
            options={types}
            onChange={field.onChange}
            error={fieldError(errors, "type")}
          />
        )}
      />
      <Controller
        name="geometry"
        control={control}
        render={({ field }) => (
          <SelectField
            label="Геометрия"
            value={field.value ?? "footprint"}
            options={geometries}
            onChange={field.onChange}
            error={fieldError(errors, "geometry")}
          />
        )}
      />
      <TextField label="Название" error={fieldError(errors, "name")} {...register("name")} />
      <GeometryFields register={register} control={control} errors={errors} />
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
  control,
  errors,
}: {
  register: UseFormRegister<ObjectFormValues>;
  control: Control<ObjectFormValues, unknown, ObjectFormOutput>;
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
      <TextField
        label="Z / отметка, м"
        inputMode="decimal"
        error={fieldError(errors, "z")}
        {...register("z")}
      />
      <PointEditor control={control} error={fieldError(errors, "points")} />
      <input type="hidden" {...register("properties")} />
    </>
  );
}

// eslint-disable-next-line max-lines-per-function
function PointEditor({
  control,
  error,
}: {
  control: Control<ObjectFormValues, unknown, ObjectFormOutput>;
  error?: string;
}) {
  const geometry = useWatch({ control, name: "geometry" });
  if (geometry === "footprint") return null;
  return (
    <Controller
      name="points"
      control={control}
      render={({ field }) => {
        let points: Array<{ x: number; y: number; z: number }> = [];
        try {
          points = JSON.parse(field.value || "[]") as typeof points;
        } catch {
          /* validation shows the error */
        }
        const change = (index: number, key: "x" | "y" | "z", value: string) => {
          const next = points.map((point, pointIndex) =>
            pointIndex === index ? { ...point, [key]: Number(value) } : point,
          );
          field.onChange(JSON.stringify(next));
        };
        return (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              {geometry === "polyline" ? "Точки трассы" : "Вершины полигона"}
            </legend>
            <p className="text-xs text-slate-500">
              Координаты указаны в метрах от левого нижнего угла участка.
            </p>
            {points.map((point, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_44px] gap-2">
                <input
                  aria-label={`X точки ${index + 1}`}
                  className="ui-input min-w-0"
                  type="number"
                  step="any"
                  value={point.x}
                  onChange={(event) => change(index, "x", event.target.value)}
                />
                <input
                  aria-label={`Y точки ${index + 1}`}
                  className="ui-input min-w-0"
                  type="number"
                  step="any"
                  value={point.y}
                  onChange={(event) => change(index, "y", event.target.value)}
                />
                <input
                  aria-label={`Z точки ${index + 1}`}
                  className="ui-input min-w-0"
                  type="number"
                  step="any"
                  value={point.z}
                  onChange={(event) => change(index, "z", event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Удалить точку ${index + 1}`}
                  onClick={() =>
                    field.onChange(
                      JSON.stringify(points.filter((_, pointIndex) => pointIndex !== index)),
                    )
                  }
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => field.onChange(JSON.stringify([...points, { x: 0, y: 0, z: 0 }]))}
            >
              Добавить точку
            </Button>
            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          </fieldset>
        );
      }}
    />
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
      <Button className="w-full" type="submit" disabled={loading}>
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
