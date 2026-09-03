export type PlotObjectType =
  "building" | "garden_bed" | "tree" | "terrace" | "stairs" | "utility" | "custom";
export type PlotObjectGeometry = "footprint" | "polyline" | "polygon";
export interface PlotPoint {
  x: number;
  y: number;
  z: number;
}
export type BuildingKind = "house" | "garage" | "bathhouse" | "outbuilding" | "custom";
export type RoofType = "gable" | "hip" | "flat" | "shed";
export type WallMaterial = "wood" | "brick" | "block" | "siding" | "custom";
export type FloorElementCategory =
  "room" | "wall" | "opening" | "furniture" | "equipment" | "utility" | "custom";
export interface FloorElement {
  id: string;
  floorId: string;
  catalogKey: string;
  category: FloorElementCategory;
  name: string;
  x: number;
  y: number;
  width: number;
  length: number;
  height: number;
  rotation: number;
  geometry: PlotObjectGeometry;
  points: PlotPoint[];
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
export interface BuildingFloor {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  height: number;
  elements: FloorElement[];
  createdAt: string;
  updatedAt: string;
}
export interface BuildingConfig {
  plotObjectId: string;
  kind: BuildingKind;
  roofType: RoofType;
  wallMaterial: WallMaterial;
  properties: Record<string, unknown>;
  floors: BuildingFloor[];
  createdAt: string;
  updatedAt: string;
}
export type SaveBuildingConfig = Pick<
  BuildingConfig,
  "kind" | "roofType" | "wallMaterial" | "properties"
>;
export type CreateBuildingFloor = Pick<BuildingFloor, "level" | "name" | "height">;
export type SaveFloorElement = Omit<FloorElement, "id" | "floorId" | "createdAt" | "updatedAt">;

export interface User {
  id: string;
  email: string;
  createdAt: string;
}
export interface PlotObject {
  id: string;
  type: PlotObjectType;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  length: number;
  height: number;
  geometry: PlotObjectGeometry;
  points: PlotPoint[];
  properties: Record<string, unknown>;
  building?: {
    kind: BuildingKind;
    roofType: RoofType;
    wallMaterial: WallMaterial;
    floorCount: number;
    totalHeight: number;
  };
  createdAt: string;
  updatedAt: string;
}
export interface Plot {
  id: string;
  name: string;
  width: number;
  length: number;
  terrainPoints: PlotPoint[];
  objects: PlotObject[];
  createdAt: string;
  updatedAt: string;
}
export interface Expense {
  id: string;
  plotObjectId: string | null;
  category: string;
  amount: string;
  currency: string;
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
export interface TimelineTask {
  id: string;
  title: string;
  dueDate: string;
  plannedBudget: string | null;
  currency: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthInput {
  email: string;
  password: string;
}
export type CreatePlot = Pick<Plot, "name" | "width" | "length">;
export type UpdatePlot = Partial<Pick<Plot, "name" | "width" | "length" | "terrainPoints">>;
export type CreatePlotObject = Omit<PlotObject, "id" | "createdAt" | "updatedAt">;
export type UpdatePlotObject = Partial<CreatePlotObject>;
export type CreateExpense = Omit<Expense, "id" | "createdAt" | "updatedAt">;
export type UpdateExpense = Partial<CreateExpense>;
export type CreateTimelineTask = Omit<TimelineTask, "id" | "createdAt" | "updatedAt">;
export type UpdateTimelineTask = Partial<CreateTimelineTask>;
