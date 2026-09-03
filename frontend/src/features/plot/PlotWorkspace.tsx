"use client";

import { Tabs } from "@base-ui/react/tabs";
import dynamic from "next/dynamic";
import { PlotCanvas } from "@/components/PlotCanvas";
import { Button } from "@/components/ui/Button";
import type { Plot } from "@/types/domain";

const Plot3DScene = dynamic(
  () => import("@/components/Plot3DScene").then((module) => module.Plot3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[620px] place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500">
        Загрузка 3D-сцены…
      </div>
    ),
  },
);

interface PlotWorkspaceProps {
  plot: Plot;
  selectedObjectId: string | null;
  gridStep: number;
  zoom: number;
  viewMode: "2d" | "3d";
  onZoom(value: number): void;
  onViewMode(value: "2d" | "3d"): void;
  onSelect(id: string): void;
  onMove(id: string, position: { x: number; y: number }): Promise<void>;
  terrainEditing: boolean;
  onMovePoint(id: string, index: number, point: { x: number; y: number; z: number }): Promise<void>;
  onMoveTerrainPoint(index: number, point: { x: number; y: number; z: number }): Promise<void>;
}

// eslint-disable-next-line max-lines-per-function
export function PlotWorkspace({
  plot,
  selectedObjectId,
  gridStep,
  zoom,
  viewMode,
  onZoom,
  onViewMode,
  onSelect,
  onMove,
  terrainEditing,
  onMovePoint,
  onMoveTerrainPoint,
}: PlotWorkspaceProps) {
  return (
    <section className="space-y-3">
      <Tabs.Root
        value={viewMode}
        onValueChange={(value) => onViewMode(value === "3d" ? "3d" : "2d")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Визуализация</p>
            <h2 className="text-xl font-semibold">План участка</h2>
          </div>
          <Tabs.List
            className="relative flex rounded-xl bg-slate-100 p-1"
            aria-label="Режим отображения"
          >
            <Tabs.Tab
              value="2d"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 outline-none data-[active]:bg-white data-[active]:text-slate-950 data-[active]:shadow-sm"
            >
              2D
            </Tabs.Tab>
            <Tabs.Tab
              value="3d"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 outline-none data-[active]:bg-white data-[active]:text-slate-950 data-[active]:shadow-sm"
            >
              3D
            </Tabs.Tab>
          </Tabs.List>
        </div>
        <Tabs.Panel value="2d" className="space-y-3 outline-none">
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-3"
              onClick={() => onZoom(zoom - 0.1)}
            >
              −
            </Button>
            <span className="min-w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-3"
              onClick={() => onZoom(zoom + 0.1)}
            >
              +
            </Button>
          </div>
          <PlotCanvas
            width={plot.width}
            length={plot.length}
            objects={plot.objects}
            terrainPoints={plot.terrainPoints ?? []}
            selectedObjectId={selectedObjectId}
            gridStep={gridStep}
            zoom={zoom}
            onSelect={onSelect}
            onMove={onMove}
            terrainEditing={terrainEditing}
            onMovePoint={onMovePoint}
            onMoveTerrainPoint={onMoveTerrainPoint}
          />
        </Tabs.Panel>
        <Tabs.Panel value="3d" className="outline-none">
          <Plot3DScene plot={plot} selectedObjectId={selectedObjectId} onSelect={onSelect} />
        </Tabs.Panel>
      </Tabs.Root>
    </section>
  );
}
