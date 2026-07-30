"use client";

import { type FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { PlotPageHeader } from "@/components/PlotPageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { readObjectInput, validateObjectInput } from "@/features/plot/object-input";
import { PlotObjectForm } from "@/features/plot/PlotObjectForm";
import { PlotWorkspace } from "@/features/plot/PlotWorkspace";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { errorDetails } from "@/lib/api";
import type { FieldErrors } from "@/lib/validation";
import { useDataStore } from "@/stores/data-store";
import { useEditorStore } from "@/stores/editor-store";
import type { PlotObject } from "@/types/domain";

export default function PlotPlanPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const store = useDataStore();
  const status = usePlotPage(plotId, store.loadPlot);
  const editor = useEditorStore();
  const [editing, setEditing] = useState<PlotObject | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!store.plot) return;
    const next = validateObjectInput(form, store.plot);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const input = readObjectInput(form);
    const request = editing
      ? store.updateObject(plotId, editing.id, input)
      : store.createObject(plotId, input);
    await request
      .then(() => {
        form.reset();
        clearSelection();
      })
      .catch((error) => setErrors(errorDetails(error)));
  }

  function clearSelection() {
    setEditing(null);
    editor.select(null);
  }

  async function remove(object: PlotObject) {
    if (!confirm(`Удалить объект «${object.name}»?`)) return;
    await store
      .deleteObject(plotId, object.id)
      .then(clearSelection)
      .catch(() => undefined);
  }

  if (status !== "authenticated" || !store.plot)
    return <StatusMessage error={store.error} loading />;
  const current =
    editing ?? store.plot.objects.find((item) => item.id === editor.selectedObjectId) ?? null;
  return (
    <div className="space-y-5">
      <PlotPageHeader
        plotId={plotId}
        title={store.plot.name}
        description={`${store.plot.width} × ${store.plot.length} м`}
      />
      <StatusMessage error={store.error} loading={store.loading} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PlotWorkspace
          plot={store.plot}
          selectedObjectId={editor.selectedObjectId}
          gridStep={editor.gridStep}
          zoom={editor.zoom}
          onZoom={editor.setZoom}
          onSelect={(id) => {
            editor.select(id);
            setEditing(store.plot?.objects.find((object) => object.id === id) ?? null);
          }}
        />
        <PlotObjectForm
          current={current}
          loading={store.loading}
          errors={errors}
          onSubmit={submit}
          onCreateNew={clearSelection}
          onDelete={(object) => void remove(object)}
        />
      </div>
    </div>
  );
}
