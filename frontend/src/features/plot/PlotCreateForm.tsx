"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { plotSchema, type PlotFormOutput, type PlotFormValues } from "@/features/plot/plot-input";
import { applyServerErrors } from "@/lib/forms";
import type { CreatePlot, Plot } from "@/types/domain";

interface PlotCreateFormProps {
  loading: boolean;
  onCreate(input: CreatePlot): Promise<Plot>;
  onCreated(plot: Plot): void;
}

export function PlotCreateForm({ loading, onCreate, onCreated }: PlotCreateFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PlotFormValues, unknown, PlotFormOutput>({
    resolver: zodResolver(plotSchema),
    defaultValues: { name: "", width: "", length: "" },
    mode: "onBlur",
  });

  const submit = handleSubmit(async (input) => {
    await onCreate(input)
      .then((plot) => {
        reset();
        onCreated(plot);
      })
      .catch((error) => applyServerErrors(error, setError));
  });

  return (
    <form
      className="panel grid gap-4 md:grid-cols-[1fr_160px_160px_auto]"
      noValidate
      onSubmit={submit}
    >
      <TextField label="Название" error={errors.name?.message} {...register("name")} />
      <TextField
        label="Ширина, м"
        inputMode="decimal"
        error={errors.width?.message}
        {...register("width")}
      />
      <TextField
        label="Длина, м"
        inputMode="decimal"
        error={errors.length?.message}
        {...register("length")}
      />
      <Button className="self-end" disabled={loading}>
        Создать
      </Button>
    </form>
  );
}
