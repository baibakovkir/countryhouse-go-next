"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FloorCanvas } from "@/features/building/FloorCanvas";
import { ElementInspector } from "@/features/building/ElementInspector";
import { buildingKindLabel } from "@/features/building/BuildingSetupForm";
import { catalogFor, type CatalogItem } from "@/features/building/catalog";
import type { BuildingConfig, FloorElement, PlotObject, SaveFloorElement } from "@/types/domain";

// eslint-disable-next-line max-lines-per-function
export function BuildingPlanner({
  building,
  object,
  loading,
  onAdd,
  onMove,
  onDelete,
}: {
  building: BuildingConfig;
  object: PlotObject;
  loading: boolean;
  onAdd(floorId: string, input: SaveFloorElement): Promise<void>;
  onMove(floorId: string, element: FloorElement, input: SaveFloorElement): Promise<void>;
  onDelete(floorId: string, elementId: string): Promise<void>;
}) {
  const [floorId, setFloorId] = useState(building.floors[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const floor = building.floors.find((item) => item.id === floorId) ?? building.floors[0];
  if (!floor) return <div className="panel">Добавьте хотя бы один этаж.</div>;
  const selected = floor.elements.find((item) => item.id === selectedId) ?? null;
  const add = async (item: CatalogItem) => {
    const input: SaveFloorElement = {
      catalogKey: item.key,
      category: item.category,
      name: item.label,
      x: 0.25,
      y: 0.25,
      width: Math.min(item.width, object.width - 0.25),
      length: Math.min(item.length, object.length - 0.25),
      height: item.height,
      rotation: 0,
      geometry: "footprint",
      points: [],
      properties: {},
    };
    await onAdd(floor.id, input);
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{buildingKindLabel(building.kind)}</p>
          <h1 className="text-3xl font-bold">{object.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Этажи">
          {building.floors.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={item.id === floor.id ? "primary" : "secondary"}
              onClick={() => {
                setFloorId(item.id);
                setSelectedId(null);
              }}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <FloorCanvas
          floor={floor}
          width={object.width}
          length={object.length}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={(element, position) =>
            onMove(floor.id, element, {
              catalogKey: element.catalogKey,
              category: element.category,
              name: element.name,
              x: position.x,
              y: position.y,
              width: element.width,
              length: element.length,
              height: element.height,
              rotation: element.rotation,
              geometry: element.geometry,
              points: element.points,
              properties: element.properties,
            })
          }
        />
        <aside className="panel h-fit space-y-4">
          <div>
            <h2 className="text-xl font-bold">Добавить на этаж</h2>
            <p className="text-sm text-slate-600">
              Выберите элемент — он появится в левом нижнем углу, после чего задайте его точное
              положение.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {catalogFor(building.kind).map((item) => (
              <Button
                key={item.key}
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => void add(item)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {selectedId && (
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Элемент выбран. Перетащите его на плане; координаты привязываются к сетке 0,5 м.
            </p>
          )}
          {selected && (
            <ElementInspector
              element={selected}
              loading={loading}
              onSave={(input) => onMove(floor.id, selected, input)}
              onDelete={async () => {
                await onDelete(floor.id, selected.id);
                setSelectedId(null);
              }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
