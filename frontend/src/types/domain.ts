export type PlotObjectType =
  "building" | "garden_bed" | "tree" | "terrace" | "stairs" | "utility" | "custom";
export type PlotObjectGeometry = "footprint" | "polyline" | "polygon";
export interface PlotPoint {
  x: number;
  y: number;
  z: number;
}

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
