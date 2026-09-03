"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { StatusMessage } from "@/components/StatusMessage";
import { BuildingPlanner } from "@/features/building/BuildingPlanner";
import { BuildingSetupForm } from "@/features/building/BuildingSetupForm";
import { usePlotPage } from "@/features/plot/use-plot-page";
import { useBuildingStore } from "@/stores/building-store";
import { useDataStore } from "@/stores/data-store";
import type { CreateBuildingFloor, SaveBuildingConfig } from "@/types/domain";

export default function BuildingPage() {
  const { plotId, buildingId } = useParams<{ plotId: string; buildingId: string }>();
  const data = useDataStore();
  const store = useBuildingStore();
  const loadBuilding = store.load;
  const clearBuilding = store.clear;
  const status = usePlotPage(plotId, data.loadPlot);
  useEffect(() => {
    clearBuilding();
    if (status === "authenticated") void loadBuilding(plotId, buildingId);
  }, [status, plotId, buildingId, loadBuilding, clearBuilding]);
  const object = data.plot?.objects.find((item) => item.id === buildingId);
  if (status !== "authenticated" || !data.plot || !object)
    return <StatusMessage loading error={data.error} />;
  const setup = async (config: SaveBuildingConfig, floors: CreateBuildingFloor[]) => {
    await store.save(plotId, buildingId, config);
    for (const floor of floors) await store.addFloor(plotId, buildingId, floor);
  };
  return (
    <div className="space-y-5">
      <Link href={`/plots/${plotId}/plan`} className="nav-link inline-flex bg-white">
        ← К плану участка
      </Link>
      <StatusMessage loading={store.loading} error={store.error} />
      {store.building ? (
        <BuildingPlanner
          building={store.building}
          object={object}
          loading={store.loading}
          onAdd={(floorId, input) => store.addElement(plotId, buildingId, floorId, input)}
          onMove={(floorId, element, input) =>
            store.updateElement(plotId, buildingId, floorId, element.id, input)
          }
          onDelete={(floorId, elementId) =>
            store.deleteElement(plotId, buildingId, floorId, elementId)
          }
        />
      ) : (
        <BuildingSetupForm current={null} loading={store.loading} onSave={setup} />
      )}
    </div>
  );
}
