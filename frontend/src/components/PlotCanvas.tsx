"use client";

import type { PlotObject } from "@/types/domain";
import { calculateScale, toScreenX, toScreenY } from "@/features/plot/geo";

interface Props {
  width: number;
  length: number;
  objects: PlotObject[];
  selectedObjectId?: string | null;
  gridStep?: number;
  zoom?: number;
  onSelect?: (id: string) => void;
}

const colors: Record<PlotObject["type"], string> = {
  building: "#64748b",
  garden_bed: "#a16207",
  tree: "#16a34a",
};

export function PlotCanvas({ width, length, objects, selectedObjectId, gridStep = 1, zoom = 1, onSelect }: Props) {
  const viewport = { width: 900, height: 620, padding: 40 };
  const scale = calculateScale(width, length, viewport) * zoom;
  const plotPixelWidth = width * scale;
  const plotPixelLength = length * scale;
  const verticalLines = Array.from({ length: Math.floor(width / gridStep) + 1 }, (_, index) => index * gridStep);
  const horizontalLines = Array.from({ length: Math.floor(length / gridStep) + 1 }, (_, index) => index * gridStep);

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
      <svg viewBox={`0 0 ${Math.max(viewport.width, plotPixelWidth + 80)} ${Math.max(viewport.height, plotPixelLength + 80)}`} className="min-h-[420px] min-w-[640px]" aria-label="План участка">
        <rect x={viewport.padding} y={viewport.padding} width={plotPixelWidth} height={plotPixelLength} fill="#f8fafc" stroke="#334155" strokeWidth="2" />
        {verticalLines.map((meter) => <line key={`x-${meter}`} x1={toScreenX(meter, scale, viewport.padding)} y1={viewport.padding} x2={toScreenX(meter, scale, viewport.padding)} y2={viewport.padding + plotPixelLength} stroke="#e2e8f0" />)}
        {horizontalLines.map((meter) => {
          const y = viewport.padding + (length - meter) * scale;
          return <line key={`y-${meter}`} x1={viewport.padding} y1={y} x2={viewport.padding + plotPixelWidth} y2={y} stroke="#e2e8f0" />;
        })}
        {objects.map((object) => {
          const x = toScreenX(object.x, scale, viewport.padding);
          const y = toScreenY(object.y, object.length, length, scale, viewport.padding);
          return (
            <g key={object.id} onClick={() => onSelect?.(object.id)} className="cursor-pointer">
              <rect x={x} y={y} width={object.width * scale} height={object.length * scale} rx="3" fill={colors[object.type]} fillOpacity="0.75" stroke={selectedObjectId === object.id ? "#0f172a" : "white"} strokeWidth={selectedObjectId === object.id ? 4 : 2} />
              <text x={x + 6} y={y + 18} fontSize="13" fill="white" className="pointer-events-none font-semibold">{object.name}</text>
            </g>
          );
        })}
        <text x={viewport.padding} y={viewport.padding - 12} fontSize="13" fill="#475569">{width} × {length} м · начало координат слева снизу</text>
      </svg>
    </div>
  );
}

