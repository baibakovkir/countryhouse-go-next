"use client";

import { calculateScale, toScreenX, toScreenY } from "@/features/plot/geo";
import type { PlotObject } from "@/types/domain";

interface PlotCanvasProps {
  width: number;
  length: number;
  objects: PlotObject[];
  selectedObjectId?: string | null;
  gridStep?: number;
  zoom?: number;
  onSelect?: (id: string) => void;
}

const viewport = { width: 900, height: 620, padding: 40 };
const colors: Record<PlotObject["type"], string> = {
  building: "#64748b",
  garden_bed: "#a16207",
  tree: "#16a34a",
};

export function PlotCanvas({
  width,
  length,
  objects,
  selectedObjectId,
  gridStep = 1,
  zoom = 1,
  onSelect,
}: PlotCanvasProps) {
  const scale = calculateScale(width, length, viewport) * zoom;
  const pixelWidth = width * scale;
  const pixelLength = length * scale;
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
      <svg
        viewBox={`0 0 ${Math.max(viewport.width, pixelWidth + 80)} ${Math.max(viewport.height, pixelLength + 80)}`}
        className="min-h-[420px] min-w-[640px]"
        aria-label="План участка"
      >
        <rect
          x={viewport.padding}
          y={viewport.padding}
          width={pixelWidth}
          height={pixelLength}
          fill="#f8fafc"
          stroke="#334155"
          strokeWidth="2"
        />
        <PlotGrid
          width={width}
          length={length}
          gridStep={gridStep}
          scale={scale}
          pixelWidth={pixelWidth}
          pixelLength={pixelLength}
        />
        <PlotObjects
          objects={objects}
          plotLength={length}
          scale={scale}
          selectedObjectId={selectedObjectId}
          onSelect={onSelect}
        />
        <text x={viewport.padding} y={viewport.padding - 12} fontSize="13" fill="#475569">
          {width} × {length} м · начало координат слева снизу
        </text>
      </svg>
    </div>
  );
}

function PlotGrid({
  width,
  length,
  gridStep,
  scale,
  pixelWidth,
  pixelLength,
}: {
  width: number;
  length: number;
  gridStep: number;
  scale: number;
  pixelWidth: number;
  pixelLength: number;
}) {
  const vertical = Array.from(
    { length: Math.floor(width / gridStep) + 1 },
    (_, index) => index * gridStep,
  );
  const horizontal = Array.from(
    { length: Math.floor(length / gridStep) + 1 },
    (_, index) => index * gridStep,
  );
  return (
    <g>
      {vertical.map((meter) => (
        <line
          key={`x-${meter}`}
          x1={toScreenX(meter, scale, viewport.padding)}
          y1={viewport.padding}
          x2={toScreenX(meter, scale, viewport.padding)}
          y2={viewport.padding + pixelLength}
          stroke="#e2e8f0"
        />
      ))}
      {horizontal.map((meter) => {
        const y = viewport.padding + (length - meter) * scale;
        return (
          <line
            key={`y-${meter}`}
            x1={viewport.padding}
            y1={y}
            x2={viewport.padding + pixelWidth}
            y2={y}
            stroke="#e2e8f0"
          />
        );
      })}
    </g>
  );
}

function PlotObjects({
  objects,
  plotLength,
  scale,
  selectedObjectId,
  onSelect,
}: {
  objects: PlotObject[];
  plotLength: number;
  scale: number;
  selectedObjectId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <g>
      {objects.map((object) => {
        const x = toScreenX(object.x, scale, viewport.padding);
        const y = toScreenY(object.y, object.length, plotLength, scale, viewport.padding);
        const selected = selectedObjectId === object.id;
        return (
          <g key={object.id} onClick={() => onSelect?.(object.id)} className="cursor-pointer">
            <rect
              x={x}
              y={y}
              width={object.width * scale}
              height={object.length * scale}
              rx="3"
              fill={colors[object.type]}
              fillOpacity="0.75"
              stroke={selected ? "#0f172a" : "white"}
              strokeWidth={selected ? 4 : 2}
            />
            <text
              x={x + 6}
              y={y + 18}
              fontSize="13"
              fill="white"
              className="pointer-events-none font-semibold"
            >
              {object.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
