import { create } from "zustand";

interface EditorState {
  selectedObjectId: string | null;
  viewMode: "2d" | "3d";
  zoom: number;
  gridStep: number;
  select(id: string | null): void;
  setViewMode(value: "2d" | "3d"): void;
  setZoom(value: number): void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedObjectId: null,
  viewMode: "2d",
  zoom: 1,
  gridStep: 1,
  select: (selectedObjectId) => set({ selectedObjectId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.5, zoom)) }),
}));
