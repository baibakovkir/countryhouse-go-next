import { create } from "zustand";

interface EditorState {
  selectedObjectId: string | null;
  zoom: number;
  gridStep: number;
  select(id: string | null): void;
  setZoom(value: number): void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedObjectId: null,
  zoom: 1,
  gridStep: 1,
  select: (selectedObjectId) => set({ selectedObjectId }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.5, zoom)) }),
}));
