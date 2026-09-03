"use client";

import { useRef, useState } from "react";
import {
  calculateScale,
  clampObjectPosition,
  screenToMeters,
  snapToGrid,
  toScreenX,
  toScreenY,
} from "@/features/plot/geo";
import type { PlotObject } from "@/types/domain";

interface PlotCanvasProps {
  width: number;
  length: number;
  objects: PlotObject[];
  selectedObjectId?: string | null;
  gridStep?: number;
  zoom?: number;
  onSelect?: (id: string) => void;
  onMove?: (id: string, position: { x: number; y: number }) => Promise<void>;
}

const viewport = { width: 900, height: 620, padding: 58 };
const colors: Record<PlotObject["type"], string> = {
  building: "#64748b",
  garden_bed: "#a16207",
  tree: "#16a34a",
};
type DragState = { id: string; pointerId: number; offsetX: number; offsetY: number };

// eslint-disable-next-line max-lines-per-function
export function PlotCanvas({
  width,
  length,
  objects,
  selectedObjectId,
  gridStep = 1,
  zoom = 1,
  onSelect,
  onMove,
}: PlotCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<{ id: string; x: number; y: number } | null>(null);
  const scale = calculateScale(width, length, viewport) * zoom;
  const pixelWidth = width * scale;
  const pixelLength = length * scale;
  const viewBoxWidth = Math.max(viewport.width, pixelWidth + viewport.padding + 26);
  const viewBoxHeight = Math.max(viewport.height, pixelLength + viewport.padding + 26);
  const displayedObjects = objects.map((object) =>
    preview?.id === object.id ? { ...object, x: preview.x, y: preview.y } : object,
  );
  const activeObject = displayedObjects.find(
    (object) => object.id === (preview?.id ?? selectedObjectId),
  );

  function pointerPosition(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const point = screenToMeters(event.clientX, event.clientY, rect, {
      width: viewBoxWidth,
      height: viewBoxHeight,
    });
    return {
      x: (point.x - viewport.padding) / scale,
      y: length - (point.y - viewport.padding) / scale,
    };
  }

  function startDrag(event: React.PointerEvent<SVGGElement>, object: PlotObject) {
    if (!onMove || event.button !== 0) return;
    const point = pointerPosition(event as unknown as React.PointerEvent<SVGSVGElement>);
    if (!point) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      id: object.id,
      pointerId: event.pointerId,
      offsetX: point.x - object.x,
      offsetY: point.y - object.y,
    });
    setPreview({ id: object.id, x: object.x, y: object.y });
    onSelect?.(object.id);
  }

  function moveDrag(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const object = objects.find((item) => item.id === drag.id);
    const point = pointerPosition(event);
    if (!object || !point) return;
    const position = clampObjectPosition(
      snapToGrid(point.x - drag.offsetX, gridStep),
      snapToGrid(point.y - drag.offsetY, gridStep),
      object.width,
      object.length,
      width,
      length,
    );
    setPreview({ id: object.id, ...position });
  }

  async function finishDrag(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const finished = preview;
    setDrag(null);
    setPreview(null);
    if (finished && onMove) await onMove(finished.id, { x: finished.x, y: finished.y });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="block h-auto min-h-[360px] w-full max-w-full"
        role="img"
        aria-label="План участка"
        onPointerMove={moveDrag}
        onPointerUp={(event) => void finishDrag(event)}
        onPointerCancel={(event) => void finishDrag(event)}
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
        <CoordinateGuides
          activeObject={activeObject}
          plotLength={length}
          pixelWidth={pixelWidth}
          scale={scale}
        />
        <PlotObjects
          objects={displayedObjects}
          plotLength={length}
          scale={scale}
          selectedObjectId={selectedObjectId}
          onSelect={onSelect}
          onPointerDown={startDrag}
        />
        <text x={viewport.padding} y={viewport.padding - 28} fontSize="13" fill="#475569">
          {width} × {length} м · начало координат слева снизу
        </text>
      </svg>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function
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
    <g aria-hidden="true">
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
      <line
        x1={viewport.padding}
        y1={viewport.padding + pixelLength}
        x2={viewport.padding + pixelWidth + 8}
        y2={viewport.padding + pixelLength}
        stroke="#0f766e"
        strokeWidth="2"
      />
      <line
        x1={viewport.padding}
        y1={viewport.padding + pixelLength}
        x2={viewport.padding}
        y2={viewport.padding - 8}
        stroke="#0f766e"
        strokeWidth="2"
      />
      <text
        x={viewport.padding + pixelWidth + 12}
        y={viewport.padding + pixelLength + 5}
        fontSize="12"
        fill="#0f766e"
      >
        X (м)
      </text>
      <text
        x={viewport.padding - 6}
        y={viewport.padding - 14}
        fontSize="12"
        fill="#0f766e"
        textAnchor="end"
      >
        Y (м)
      </text>
      {vertical.map((meter) => (
        <text
          key={`xl-${meter}`}
          x={toScreenX(meter, scale, viewport.padding)}
          y={viewport.padding + pixelLength + 20}
          fontSize="10"
          fill="#64748b"
          textAnchor="middle"
        >
          {meter}
        </text>
      ))}
      {horizontal.map((meter) => (
        <text
          key={`yl-${meter}`}
          x={viewport.padding - 8}
          y={viewport.padding + (length - meter) * scale + 4}
          fontSize="10"
          fill="#64748b"
          textAnchor="end"
        >
          {meter}
        </text>
      ))}
    </g>
  );
}

function CoordinateGuides({
  activeObject,
  plotLength,
  pixelWidth,
  scale,
}: {
  activeObject?: PlotObject;
  plotLength: number;
  pixelWidth: number;
  scale: number;
}) {
  if (!activeObject) return null;
  const x = toScreenX(activeObject.x, scale, viewport.padding);
  const y = toScreenY(activeObject.y, 0, plotLength, scale, viewport.padding);
  return (
    <g pointerEvents="none" aria-hidden="true">
      <line
        x1={x}
        y1={viewport.padding}
        x2={x}
        y2={viewport.padding + plotLength * scale}
        stroke="#0f766e"
        strokeDasharray="5 5"
      />
      <line
        x1={viewport.padding}
        y1={y}
        x2={viewport.padding + pixelWidth}
        y2={y}
        stroke="#0f766e"
        strokeDasharray="5 5"
      />
      <rect
        x={Math.min(x + 6, viewport.padding + pixelWidth - 98)}
        y={Math.max(viewport.padding + 4, y - 28)}
        width="92"
        height="22"
        rx="5"
        fill="#0f766e"
      />
      <text
        x={Math.min(x + 12, viewport.padding + pixelWidth - 92)}
        y={Math.max(viewport.padding + 19, y - 13)}
        fontSize="11"
        fill="white"
      >
        x {activeObject.x} · y {activeObject.y}
      </text>
    </g>
  );
}

function PlotObjects({
  objects,
  plotLength,
  scale,
  selectedObjectId,
  onSelect,
  onPointerDown,
}: {
  objects: PlotObject[];
  plotLength: number;
  scale: number;
  selectedObjectId?: string | null;
  onSelect?: (id: string) => void;
  onPointerDown: (event: React.PointerEvent<SVGGElement>, object: PlotObject) => void;
}) {
  return (
    <g>
      {objects.map((object) => {
        const x = toScreenX(object.x, scale, viewport.padding);
        const y = toScreenY(object.y, object.length, plotLength, scale, viewport.padding);
        const selected = selectedObjectId === object.id;
        return (
          <g
            key={object.id}
            onClick={() => onSelect?.(object.id)}
            onPointerDown={(event) => onPointerDown(event, object)}
            className="cursor-grab touch-none active:cursor-grabbing"
            role="button"
            aria-label={`${object.name}, x ${object.x}, y ${object.y}`}
          >
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
