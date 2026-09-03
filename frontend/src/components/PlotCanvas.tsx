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
import type { PlotObject, PlotPoint } from "@/types/domain";

interface PlotCanvasProps {
  width: number;
  length: number;
  objects: PlotObject[];
  terrainPoints?: PlotPoint[];
  selectedObjectId?: string | null;
  gridStep?: number;
  zoom?: number;
  onSelect?: (id: string) => void;
  onMove?: (id: string, position: { x: number; y: number }) => Promise<void>;
  terrainEditing?: boolean;
  onMovePoint?: (id: string, index: number, point: PlotPoint) => Promise<void>;
  onMoveTerrainPoint?: (index: number, point: PlotPoint) => Promise<void>;
}

const viewport = { width: 900, height: 620, padding: 58 };
const colors: Partial<Record<PlotObject["type"], string>> = {
  building: "#64748b",
  garden_bed: "#a16207",
  tree: "#16a34a",
};
type DragState = { id: string; pointerId: number; offsetX: number; offsetY: number };
type PointDrag = {
  kind: "object" | "terrain";
  id?: string;
  index: number;
  pointerId: number;
  z: number;
};

// eslint-disable-next-line max-lines-per-function
export function PlotCanvas({
  width,
  length,
  objects,
  terrainPoints = [],
  selectedObjectId,
  gridStep = 1,
  zoom = 1,
  onSelect,
  onMove,
  terrainEditing = false,
  onMovePoint,
  onMoveTerrainPoint,
}: PlotCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<{ id: string; x: number; y: number } | null>(null);
  const [pointDrag, setPointDrag] = useState<PointDrag | null>(null);
  const [pointPreview, setPointPreview] = useState<PlotPoint | null>(null);
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
    if (object.geometry !== "footprint") {
      onSelect?.(object.id);
      return;
    }
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
    if (pointDrag) {
      const point = pointerPosition(event);
      if (!point || pointDrag.pointerId !== event.pointerId) return;
      setPointPreview({
        x: Math.min(width, Math.max(0, snapToGrid(point.x, gridStep))),
        y: Math.min(length, Math.max(0, snapToGrid(point.y, gridStep))),
        z: pointDrag.z,
      });
      return;
    }
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

  // eslint-disable-next-line complexity
  async function finishDrag(event: React.PointerEvent<SVGSVGElement>) {
    if (pointDrag && pointDrag.pointerId === event.pointerId) {
      const finished = pointPreview;
      const active = pointDrag;
      setPointDrag(null);
      setPointPreview(null);
      if (finished) {
        if (active.kind === "terrain" && onMoveTerrainPoint)
          await onMoveTerrainPoint(active.index, finished);
        if (active.kind === "object" && active.id && onMovePoint)
          await onMovePoint(active.id, active.index, finished);
      }
      return;
    }
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
        <g aria-label="Высотные отметки">
          {terrainPoints.map((point, index) => (
            <g key={`${point.x}-${point.y}-${index}`}>
              <circle
                cx={toScreenX(point.x, scale, viewport.padding)}
                cy={toScreenY(point.y, 0, length, scale, viewport.padding)}
                r="7"
                fill="#f8fafc"
                stroke="#047857"
                strokeWidth="3"
              />
              <text
                x={toScreenX(point.x, scale, viewport.padding) + 10}
                y={toScreenY(point.y, 0, length, scale, viewport.padding) - 8}
                fontSize="11"
                fill="#065f46"
              >
                {point.z >= 0 ? "+" : ""}
                {point.z} м
              </text>
            </g>
          ))}
        </g>
        <PlotObjects
          objects={displayedObjects}
          plotLength={length}
          scale={scale}
          selectedObjectId={selectedObjectId}
          onSelect={onSelect}
          onPointerDown={startDrag}
        />
        <PointHandles
          objects={displayedObjects}
          terrainPoints={terrainPoints}
          terrainEditing={terrainEditing}
          selectedObjectId={selectedObjectId}
          plotLength={length}
          scale={scale}
          preview={pointPreview}
          drag={pointDrag}
          onStart={(event, next) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDrag(null);
            setPointDrag({ ...next, pointerId: event.pointerId });
            setPointPreview(
              next.kind === "terrain"
                ? terrainPoints[next.index]
                : (objects.find((item) => item.id === next.id)?.points[next.index] ?? null),
            );
          }}
        />
        <text x={viewport.padding} y={viewport.padding - 28} fontSize="13" fill="#475569">
          {width} × {length} м · начало координат слева снизу
        </text>
      </svg>
    </div>
  );
}

function PointHandles({
  objects,
  terrainPoints,
  terrainEditing,
  selectedObjectId,
  plotLength,
  scale,
  preview,
  drag,
  onStart,
}: {
  objects: PlotObject[];
  terrainPoints: PlotPoint[];
  terrainEditing: boolean;
  selectedObjectId?: string | null;
  plotLength: number;
  scale: number;
  preview: PlotPoint | null;
  drag: PointDrag | null;
  onStart(event: React.PointerEvent<SVGGElement>, drag: Omit<PointDrag, "pointerId">): void;
}) {
  const selected = objects.find((object) => object.id === selectedObjectId);
  const source = terrainEditing
    ? terrainPoints.map((point, index) => ({ point, index, kind: "terrain" as const }))
    : (selected?.points ?? []).map((point, index) => ({
        point,
        index,
        kind: "object" as const,
        id: selected?.id,
      }));
  return (
    <g>
      {source.map((item) => {
        const id = item.kind === "object" ? item.id : undefined;
        const point =
          drag?.kind === item.kind &&
          drag.index === item.index &&
          (item.kind === "terrain" || drag.id === id) &&
          preview
            ? preview
            : item.point;
        return (
          <g
            key={`${item.kind}-${item.index}`}
            role="button"
            aria-label={`Точка ${item.index + 1}: X ${point.x}, Y ${point.y}`}
            className="cursor-grab touch-none"
            onPointerDown={(event) =>
              onStart(event, { kind: item.kind, id, index: item.index, z: point.z })
            }
          >
            <circle
              cx={toScreenX(point.x, scale, viewport.padding)}
              cy={toScreenY(point.y, 0, plotLength, scale, viewport.padding)}
              r="11"
              fill="white"
              stroke="#059669"
              strokeWidth="4"
            />
            <text
              x={toScreenX(point.x, scale, viewport.padding) + 15}
              y={toScreenY(point.y, 0, plotLength, scale, viewport.padding) + 4}
              fontSize="12"
              fontWeight="700"
              fill="#064e3b"
            >
              {point.x}; {point.y}
            </text>
          </g>
        );
      })}
    </g>
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

// eslint-disable-next-line max-lines-per-function
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
  function renderObject(object: PlotObject, x: number, y: number, selected: boolean) {
    const color = colors[object.type] ?? "#0f766e";
    const objectPoints = object.points ?? [];
    const points = objectPoints
      .map(
        (point) =>
          `${toScreenX(point.x, scale, viewport.padding)},${toScreenY(point.y, 0, plotLength, scale, viewport.padding)}`,
      )
      .join(" ");
    if (object.geometry === "polyline" && objectPoints.length > 1) {
      return (
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={Math.max(4, object.width * scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    if (object.geometry === "polygon" && objectPoints.length > 2) {
      return (
        <polygon
          points={points}
          fill={color}
          fillOpacity="0.32"
          stroke={selected ? "#0f172a" : color}
          strokeWidth={selected ? 4 : 2}
        />
      );
    }
    return (
      <rect
        x={x}
        y={y}
        width={object.width * scale}
        height={object.length * scale}
        rx="3"
        fill={color}
        fillOpacity="0.75"
        stroke={selected ? "#0f172a" : "white"}
        strokeWidth={selected ? 4 : 2}
      />
    );
  }

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
            {renderObject(object, x, y, selected)}
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
