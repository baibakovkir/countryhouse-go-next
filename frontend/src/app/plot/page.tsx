"use client";

import { type FormEvent, useEffect } from "react";
import { PlotCanvas } from "@/components/PlotCanvas";
import { StatusMessage } from "@/components/StatusMessage";
import { useDataStore } from "@/stores/data-store";
import { useEditorStore } from "@/stores/editor-store";
import type { PlotObjectType } from "@/types/domain";

const numeric = (data: FormData, field: string) => Number(data.get(field));

export default function PlotPage() {
  const { plot, loading, error, loadPlot, createPlot, createObject } = useDataStore();
  const { selectedObjectId, zoom, gridStep, select, setZoom } = useEditorStore();

  useEffect(() => { void loadPlot(); }, [loadPlot]);

  async function onCreatePlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createPlot({ width: numeric(data, "width"), length: numeric(data, "length") }).catch(() => undefined);
  }

  async function onCreateObject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await createObject({
      type: String(data.get("type")) as PlotObjectType,
      name: String(data.get("name")),
      x: numeric(data, "x"), y: numeric(data, "y"), z: 0,
      width: numeric(data, "width"), length: numeric(data, "length"), height: numeric(data, "height"),
    }).then(() => form.reset()).catch(() => undefined);
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Участок</h1><p className="mt-1 text-slate-600">Размеры и объекты задаются в метрах.</p></div>
      <StatusMessage error={error} loading={loading} />
      {!plot ? (
        <form onSubmit={onCreatePlot} className="panel max-w-xl space-y-4">
          <h2 className="text-xl font-semibold">Создать участок</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">Ширина, м<input className="input" name="width" type="number" min="0.1" step="0.1" required /></label>
            <label className="field">Длина, м<input className="input" name="length" type="number" min="0.1" step="0.1" required /></label>
          </div>
          <button className="button" disabled={loading}>Создать</button>
        </form>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">План {plot.width} × {plot.length} м</h2>
              <div className="flex items-center gap-2 text-sm"><button className="input" onClick={() => setZoom(zoom - 0.1)}>−</button><span>{Math.round(zoom * 100)}%</span><button className="input" onClick={() => setZoom(zoom + 0.1)}>+</button></div>
            </div>
            <PlotCanvas width={plot.width} length={plot.length} objects={plot.objects} selectedObjectId={selectedObjectId} gridStep={gridStep} zoom={zoom} onSelect={select} />
          </section>
          <form onSubmit={onCreateObject} className="panel h-fit space-y-3">
            <h2 className="text-xl font-semibold">Добавить объект</h2>
            <label className="field">Тип<select className="input" name="type"><option value="building">Строение</option><option value="garden_bed">Грядка</option><option value="tree">Дерево</option></select></label>
            <label className="field">Название<input className="input" name="name" required /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field">X<input className="input" name="x" type="number" min="0" step="0.1" required /></label>
              <label className="field">Y<input className="input" name="y" type="number" min="0" step="0.1" required /></label>
              <label className="field">Ширина<input className="input" name="width" type="number" min="0.1" step="0.1" required /></label>
              <label className="field">Длина<input className="input" name="length" type="number" min="0.1" step="0.1" required /></label>
            </div>
            <label className="field">Высота для 3D, м<input className="input" name="height" type="number" min="0" step="0.1" defaultValue="0" required /></label>
            <button className="button w-full" disabled={loading}>Добавить</button>
          </form>
        </div>
      )}
    </div>
  );
}

