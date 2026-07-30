"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { readPlotInput, validatePlotInput } from "@/features/plot/plot-input";
import { errorDetails } from "@/lib/api";
import type { FieldErrors } from "@/lib/validation";
import type { Plot, UpdatePlot } from "@/types/domain";

interface PlotListProps {
  plots: Plot[];
  loading: boolean;
  onUpdate(id: string, input: UpdatePlot): Promise<void>;
  onDelete(id: string): Promise<void>;
}

export function PlotList({ plots, loading, onUpdate, onDelete }: PlotListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function save(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const next = validatePlotInput(event.currentTarget);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onUpdate(id, readPlotInput(event.currentTarget))
      .then(() => setEditingId(null))
      .catch((error) => setErrors(errorDetails(error)));
  }

  async function remove(plot: Plot) {
    if (!confirm(`Удалить участок «${plot.name}» и все связанные данные?`)) return;
    await onDelete(plot.id).catch(() => undefined);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plots.map((plot) =>
          editingId === plot.id ? (
            <PlotEditCard
              key={plot.id}
              plot={plot}
              errors={errors}
              onSave={save}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <PlotCard
              key={plot.id}
              plot={plot}
              onEdit={() => setEditingId(plot.id)}
              onDelete={() => void remove(plot)}
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
    <article className="panel">
      <h2 className="text-xl font-semibold">{plot.name}</h2>
      <p className="mt-1 text-slate-500">
        {plot.width} × {plot.length} м
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="button" href={`/plots/${plot.id}/plan`}>
          Открыть
        </Link>
        <button className="input" onClick={onEdit}>
          Изменить
        </button>
        <button className="input text-red-700" onClick={onDelete}>
          Удалить
        </button>
      </div>
    </article>
  );
}

function PlotEditCard({
  plot,
  errors,
  onSave,
  onCancel,
}: {
  plot: Plot;
  errors: FieldErrors;
  onSave(event: FormEvent<HTMLFormElement>, id: string): void;
  onCancel(): void;
}) {
  return (
    <form onSubmit={(event) => onSave(event, plot.id)} className="panel space-y-3">
      <input
        className="input w-full"
        name="name"
        defaultValue={plot.name}
        aria-invalid={Boolean(errors.name)}
      />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" name="width" defaultValue={plot.width} />
        <input className="input" name="length" defaultValue={plot.length} />
      </div>
      <div className="flex gap-2">
        <button className="button">Сохранить</button>
        <button type="button" className="input" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}
