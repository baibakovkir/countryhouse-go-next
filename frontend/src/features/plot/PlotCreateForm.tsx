"use client";

import { type FormEvent, useState } from "react";
import { FieldError } from "@/components/FieldError";
import { readPlotInput, validatePlotInput } from "@/features/plot/plot-input";
import { errorDetails } from "@/lib/api";
import type { FieldErrors } from "@/lib/validation";
import type { CreatePlot, Plot } from "@/types/domain";

interface PlotCreateFormProps {
  loading: boolean;
  onCreate(input: CreatePlot): Promise<Plot>;
  onCreated(plot: Plot): void;
}

export function PlotCreateForm({ loading, onCreate, onCreated }: PlotCreateFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(form: HTMLFormElement) {
    const next = validatePlotInput(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate(event.currentTarget)) return;

    await onCreate(readPlotInput(event.currentTarget))
      .then(onCreated)
      .catch((error) => setErrors(errorDetails(error)));
  }

  return (
    <form
      className="panel grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"
      noValidate
      onBlur={(event) => {
        if (event.target instanceof HTMLInputElement) validate(event.currentTarget);
      }}
      onSubmit={submit}
    >
      <PlotField label="Название" name="name" error={errors.name} />
      <PlotField label="Ширина, м" name="width" error={errors.width} decimal />
      <PlotField label="Длина, м" name="length" error={errors.length} decimal />
      <button className="button self-end" disabled={loading}>
        Создать
      </button>
    </form>
  );
}

function PlotField({
  label,
  name,
  error,
  decimal = false,
}: {
  label: string;
  name: string;
  error?: string;
  decimal?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <input
        className="input"
        name={name}
        inputMode={decimal ? "decimal" : undefined}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </label>
  );
}
