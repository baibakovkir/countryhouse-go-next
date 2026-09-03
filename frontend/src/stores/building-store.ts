import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  BuildingConfig,
  CreateBuildingFloor,
  SaveBuildingConfig,
  SaveFloorElement,
} from "@/types/domain";

interface BuildingState {
  building: BuildingConfig | null;
  loading: boolean;
  error: string | null;
  load(plotId: string, objectId: string): Promise<void>;
  save(plotId: string, objectId: string, input: SaveBuildingConfig): Promise<void>;
  addFloor(plotId: string, objectId: string, input: CreateBuildingFloor): Promise<void>;
  addElement(
    plotId: string,
    objectId: string,
    floorId: string,
    input: SaveFloorElement,
  ): Promise<void>;
  updateElement(
    plotId: string,
    objectId: string,
    floorId: string,
    elementId: string,
    input: SaveFloorElement,
  ): Promise<void>;
  deleteElement(
    plotId: string,
    objectId: string,
    floorId: string,
    elementId: string,
  ): Promise<void>;
  clear(): void;
}

const message = (error: unknown) => (error instanceof Error ? error.message : "Неизвестная ошибка");

export const useBuildingStore = create<BuildingState>((set) => {
  async function action(work: () => Promise<void>) {
    set({ loading: true, error: null });
    try {
      await work();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        useAuthStore.setState({ user: null, status: "unauthenticated" });
      set({ error: message(error) });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
  const reload = (plotId: string, objectId: string) =>
    api.getBuilding(plotId, objectId).then((building) => set({ building }));
  return {
    building: null,
    loading: false,
    error: null,
    load: (plotId, objectId) =>
      action(async () => {
        try {
          await reload(plotId, objectId);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) set({ building: null });
          else throw error;
        }
      }),
    save: (plotId, objectId, input) =>
      action(async () => set({ building: await api.saveBuilding(plotId, objectId, input) })),
    addFloor: (plotId, objectId, input) =>
      action(async () => {
        await api.addBuildingFloor(plotId, objectId, input);
        await reload(plotId, objectId);
      }),
    addElement: (plotId, objectId, floorId, input) =>
      action(async () => {
        await api.addFloorElement(plotId, objectId, floorId, input);
        await reload(plotId, objectId);
      }),
    updateElement: (plotId, objectId, floorId, elementId, input) =>
      action(async () => {
        await api.updateFloorElement(plotId, objectId, floorId, elementId, input);
        await reload(plotId, objectId);
      }),
    deleteElement: (plotId, objectId, floorId, elementId) =>
      action(async () => {
        await api.deleteFloorElement(plotId, objectId, floorId, elementId);
        await reload(plotId, objectId);
      }),
    clear: () => set({ building: null, error: null, loading: false }),
  };
});
