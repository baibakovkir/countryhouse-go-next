import { PlotCanvas } from "@/components/PlotCanvas";
import type { Plot } from "@/types/domain";

interface PlotWorkspaceProps {
  plot: Plot;
  selectedObjectId: string | null;
  gridStep: number;
  zoom: number;
  onZoom(value: number): void;
  onSelect(id: string): void;
}

export function PlotWorkspace(props: PlotWorkspaceProps) {
  const { plot, selectedObjectId, gridStep, zoom, onZoom, onSelect } = props;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">План</h2>
        <div className="flex items-center gap-2 text-sm">
          <button className="input" onClick={() => onZoom(zoom - 0.1)}>
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="input" onClick={() => onZoom(zoom + 0.1)}>
            +
          </button>
        </div>
      </div>
      <PlotCanvas
        width={plot.width}
        length={plot.length}
        objects={plot.objects}
        selectedObjectId={selectedObjectId}
        gridStep={gridStep}
        zoom={zoom}
        onSelect={onSelect}
      />
    </section>
  );
}
