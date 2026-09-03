"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PlotPageHeader } from "@/components/PlotPageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import type { ObjectFormOutput } from "@/features/plot/object-input";
import { PlotObjectForm } from "@/features/plot/PlotObjectForm";
import { PlotWorkspace } from "@/features/plot/PlotWorkspace";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { useDataStore } from "@/stores/data-store";
import { useEditorStore } from "@/stores/editor-store";
import type { PlotObject } from "@/types/domain";

export default function PlotPlanPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const store = useDataStore();
  const status = usePlotPage(plotId, store.loadPlot);
  const editor = useEditorStore();
  const [editing, setEditing] = useState<PlotObject | null>(null);
  async function save(input: ObjectFormOutput) {
    if (!store.plot) return;
    const request = editing
      ? store.updateObject(plotId, editing.id, input)
      : store.createObject(plotId, input);
    await request;
  }

  function clearSelection() {
    setEditing(null);
    editor.select(null);
  }

  async function remove(object: PlotObject) {
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
          viewMode={editor.viewMode}
          onZoom={editor.setZoom}
          onViewMode={editor.setViewMode}
          onSelect={(id) => {
            editor.select(id);
            setEditing(store.plot?.objects.find((object) => object.id === id) ?? null);
          }}
        />
        <PlotObjectForm
          plot={store.plot}
          current={current}
          loading={store.loading}
          onSave={save}
          onCreateNew={clearSelection}
          onDelete={remove}
        />
      </div>
    </div>
  );
}
