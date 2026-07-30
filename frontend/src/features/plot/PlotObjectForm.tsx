"use client";

import { type FormEvent } from "react";
import { FieldError } from "@/components/FieldError";
import type { FieldErrors } from "@/lib/validation";
import type { PlotObject } from "@/types/domain";

interface PlotObjectFormProps {
  current: PlotObject | null;
  loading: boolean;
  errors: FieldErrors;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  onCreateNew(): void;
  onDelete(object: PlotObject): void;
}

const geometryFields = [
  ["x", "X"],
  ["y", "Y"],
  ["width", "Ширина"],
  ["length", "Длина"],
] as const;

export function PlotObjectForm(props: PlotObjectFormProps) {
  const { current, loading, errors, onSubmit, onCreateNew, onDelete } = props;
  return (
    <form
      key={current?.id ?? "new"}
      onSubmit={onSubmit}
      noValidate
      className="panel h-fit space-y-3"
    >
      <h2 className="text-xl font-semibold">{current ? "Изменить объект" : "Добавить объект"}</h2>
      <label className="field">
        Тип
        <select className="input" name="type" defaultValue={current?.type ?? "building"}>
          <option value="building">Строение</option>
          <option value="garden_bed">Грядка</option>
          <option value="tree">Дерево</option>
        </select>
      </label>
      <label className="field">
        Название
        <input className="input" name="name" defaultValue={current?.name} />
        <FieldError message={errors.name} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {geometryFields.map(([name, label]) => (
          <label className="field" key={name}>
            {label}
            <input
              className="input"
              name={name}
              inputMode="decimal"
              defaultValue={current?.[name]}
            />
            <FieldError message={errors[name]} />
          </label>
        ))}
      </div>
      <label className="field">
        Высота, м
        <input
          className="input"
          name="height"
          inputMode="decimal"
          defaultValue={current?.height ?? 0}
        />
        <FieldError message={errors.height} />
      </label>
      <button className="button w-full" disabled={loading}>
        {current ? "Сохранить" : "Добавить"}
      </button>
      {current && (
        <div className="flex gap-2">
          <button type="button" className="input flex-1" onClick={onCreateNew}>
            Новый объект
          </button>
          <button type="button" className="input text-red-700" onClick={() => onDelete(current)}>
            Удалить
          </button>
        </div>
      )}
    </form>
  );
}
