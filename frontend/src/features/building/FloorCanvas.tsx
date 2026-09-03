"use client";

import { useRef, useState } from "react";
import type { BuildingFloor, FloorElement } from "@/types/domain";

type Drag = { id: string; pointerId: number; offsetX: number; offsetY: number };
type Position = { x: number; y: number };

// eslint-disable-next-line max-lines-per-function
export function FloorCanvas({
  floor,
  width,
  length,
  selectedId,
  onSelect,
  onMove,
}: {
  floor: BuildingFloor;
  width: number;
  length: number;
  selectedId: string | null;
  onSelect(id: string): void;
  onMove(element: FloorElement, position: Position): Promise<void>;
}) {
  const scale = Math.min(760 / width, 520 / length);
  const padding = 36;
  const viewWidth = width * scale + padding * 2;
  const viewHeight = length * scale + padding * 2;
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [preview, setPreview] = useState<(Position & { id: string }) | null>(null);
  const cursor = (event: React.PointerEvent<SVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (((event.clientX - rect.left) / rect.width) * viewWidth - padding) / scale,
      y: length - (((event.clientY - rect.top) / rect.height) * viewHeight - padding) / scale,
    };
  };
  const start = (event: React.PointerEvent<SVGGElement>, element: FloorElement) => {
    const point = cursor(event);
    if (!point) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(element.id);
    setDrag({
      id: element.id,
      pointerId: event.pointerId,
      offsetX: point.x - element.x,
      offsetY: point.y - element.y,
    });
    setPreview({ id: element.id, x: element.x, y: element.y });
  };
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const element = floor.elements.find((item) => item.id === drag.id);
    const point = cursor(event);
    if (!element || !point) return;
    const snap = (value: number) => Math.round(value * 2) / 2;
    setPreview({
      id: element.id,
      x: Math.max(0, Math.min(width - element.width, snap(point.x - drag.offsetX))),
      y: Math.max(0, Math.min(length - element.length, snap(point.y - drag.offsetY))),
    });
  };
  const finish = async (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const position = preview;
    const element = floor.elements.find((item) => item.id === drag.id);
    setDrag(null);
    setPreview(null);
    if (position && element) await onMove(element, position);
  };
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
      <svg
        ref={svgRef}
        role="img"
        aria-label={`План: ${floor.name}`}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="min-h-[420px] w-full touch-none"
        onPointerMove={move}
        onPointerUp={(event) => void finish(event)}
        onPointerCancel={(event) => void finish(event)}
      >
        <defs>
          <pattern
            id="floor-grid"
            width={scale / 2}
            height={scale / 2}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${scale / 2} 0 L 0 0 0 ${scale / 2}`}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect
          x={padding}
          y={padding}
          width={width * scale}
          height={length * scale}
          fill="url(#floor-grid)"
          stroke="#0f172a"
          strokeWidth="3"
        />
        {floor.elements.map((source) => {
          const element =
            preview?.id === source.id ? { ...source, x: preview.x, y: preview.y } : source;
          return (
            <FloorShape
              key={element.id}
              element={element}
              scale={scale}
              padding={padding}
              plotLength={length}
              selected={element.id === selectedId}
              onPointerDown={start}
            />
          );
        })}
      </svg>
    </div>
  );
}

function FloorShape({
  element,
  scale,
  padding,
  plotLength,
  selected,
  onPointerDown,
}: {
  element: FloorElement;
  scale: number;
  padding: number;
  plotLength: number;
  selected: boolean;
  onPointerDown(event: React.PointerEvent<SVGGElement>, element: FloorElement): void;
}) {
  const x = padding + element.x * scale;
  const y = padding + (plotLength - element.y - element.length) * scale;
  const color = shapeColor(element.category);
  return (
    <g
      role="button"
      aria-label={`${element.name}, X ${element.x}, Y ${element.y}`}
      className="cursor-grab active:cursor-grabbing"
      onPointerDown={(event) => onPointerDown(event, element)}
      transform={`rotate(${-element.rotation} ${x + (element.width * scale) / 2} ${y + (element.length * scale) / 2})`}
    >
      <rect
        x={x}
        y={y}
        width={element.width * scale}
        height={Math.max(8, element.length * scale)}
        rx="3"
        fill={color}
        fillOpacity={element.category === "room" ? 0.35 : 0.85}
        stroke={selected ? "#0f172a" : "white"}
        strokeWidth={selected ? 4 : 2}
      />
      <text
        x={x + 5}
        y={y + 16}
        fontSize="12"
        fontWeight="700"
        fill={element.category === "room" ? "#065f46" : "white"}
      >
        {element.name}
      </text>
      <text
        x={x + 5}
        y={y + 30}
        fontSize="10"
        fill={element.category === "room" ? "#065f46" : "white"}
      >
        {element.x}; {element.y}
      </text>
    </g>
  );
}

function shapeColor(category: FloorElement["category"]) {
  if (category === "opening") return "#0ea5e9";
  if (category === "wall") return "#334155";
  if (category === "room") return "#a7f3d0";
  return "#f59e0b";
}
