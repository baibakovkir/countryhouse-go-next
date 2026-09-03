"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PlotPageHeader } from "@/components/PlotPageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import type { ObjectFormOutput } from "@/features/plot/object-input";
import { PlotObjectForm } from "@/features/plot/PlotObjectForm";
import { PlotWorkspace } from "@/features/plot/PlotWorkspace";
import { TerrainEditor } from "@/features/plot/TerrainEditor";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { useDataStore } from "@/stores/data-store";
import { useEditorStore } from "@/stores/editor-store";
import type { PlotObject } from "@/types/domain";

// eslint-disable-next-line max-lines-per-function
export default function PlotPlanPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const store = useDataStore();
  const status = usePlotPage(plotId, store.loadPlot);
  const editor = useEditorStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [terrainEditing, setTerrainEditing] = useState(false);
  async function save(input: ObjectFormOutput) {
    if (!store.plot) return;
    const request = editingId
      ? store.updateObject(plotId, editingId, input)
      : store.createObject(plotId, input);
    await request;
  }

  function clearSelection() {
    setEditingId(null);
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
    store.plot.objects.find((item) => item.id === (editingId ?? editor.selectedObjectId)) ?? null;
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
            setTerrainEditing(false);
            editor.select(id);
            setEditingId(id);
          }}
          onMove={(id, position) => store.updateObject(plotId, id, position)}
          terrainEditing={terrainEditing}
          onMovePoint={(id, index, point) => {
            const object = store.plot?.objects.find((item) => item.id === id);
            if (!object) return Promise.resolve();
            const points = object.points.map((item, pointIndex) =>
              pointIndex === index ? point : item,
            );
            return store.updateObject(plotId, id, { points });
          }}
          onMoveTerrainPoint={(index, point) => {
            if (!store.plot) return Promise.resolve();
            const terrainPoints = store.plot.terrainPoints.map((item, pointIndex) =>
              pointIndex === index ? point : item,
            );
            return store.updatePlot(plotId, { terrainPoints });
          }}
        />
        <div className="space-y-5">
          <TerrainEditor
            points={store.plot.terrainPoints ?? []}
            width={store.plot.width}
            length={store.plot.length}
            loading={store.loading}
            onSave={(terrainPoints) => store.updatePlot(plotId, { terrainPoints })}
            editingOnPlan={terrainEditing}
            onEditingOnPlan={(value) => {
              setTerrainEditing(value);
              if (value) clearSelection();
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
    </div>
  );
}
