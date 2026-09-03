"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/FormField";
import { plotSchema, type PlotFormOutput, type PlotFormValues } from "@/features/plot/plot-input";
import { applyServerErrors } from "@/lib/forms";
import type { Plot, UpdatePlot } from "@/types/domain";

interface PlotListProps {
  plots: Plot[];
  loading: boolean;
  onUpdate(id: string, input: UpdatePlot): Promise<void>;
  onDelete(id: string): Promise<void>;
}

export function PlotList({ plots, loading, onUpdate, onDelete }: PlotListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plots.map((plot) =>
          editingId === plot.id ? (
            <PlotEditCard
              key={plot.id}
              plot={plot}
              loading={loading}
              onSave={(input) => onUpdate(plot.id, input)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <PlotCard
              key={plot.id}
              plot={plot}
              onEdit={() => setEditingId(plot.id)}
              onDelete={() => void onDelete(plot.id)}
            />
          ),
        )}
      </div>
      {plots.length === 0 && !loading && <p className="text-slate-500">Участков пока нет.</p>}
    </>
  );
}

function PlotCard({ plot, onEdit, onDelete }: { plot: Plot; onEdit(): void; onDelete(): void }) {
  return (
    <article className="panel group">
      <p className="eyebrow">Участок</p>
      <h2 className="mt-1 text-xl font-semibold">{plot.name}</h2>
      <p className="mt-1 text-slate-500">
        {plot.width} × {plot.length} м
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link className="ui-link-button" href={`/plots/${plot.id}/plan`}>
          Открыть
        </Link>
        <Button type="button" variant="secondary" onClick={onEdit}>
          Изменить
        </Button>
        <ConfirmDialog
          title="Удалить участок?"
          description={`«${plot.name}» и все связанные данные будут удалены.`}
          onConfirm={onDelete}
        />
      </div>
    </article>
  );
}

function PlotEditCard({
  plot,
  loading,
  onSave,
  onCancel,
}: {
  plot: Plot;
  loading: boolean;
  onSave(input: PlotFormOutput): Promise<void>;
  onCancel(): void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PlotFormValues, unknown, PlotFormOutput>({
    resolver: zodResolver(plotSchema),
    defaultValues: { name: plot.name, width: String(plot.width), length: String(plot.length) },
    mode: "onBlur",
  });
  const submit = handleSubmit(async (input) =>
    onSave(input)
      .then(onCancel)
      .catch((error) => applyServerErrors(error, setError)),
  );
  return (
    <form onSubmit={submit} className="panel space-y-3" noValidate>
      <TextField label="Название" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Ширина, м" error={errors.width?.message} {...register("width")} />
        <TextField label="Длина, м" error={errors.length?.message} {...register("length")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          Сохранить
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
