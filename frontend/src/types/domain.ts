export type PlotObjectType = "building" | "garden_bed" | "tree";

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
  createdAt: string;
}

export interface Plot {
  id: string;
  width: number;
  length: number;
  objects: PlotObject[];
  createdAt: string;
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
}

export interface TimelineTask {
  id: string;
  title: string;
  dueDate: string;
  plannedBudget: string | null;
  currency: string;
  description: string;
  createdAt: string;
}

export type CreatePlot = Pick<Plot, "width" | "length">;
export type CreatePlotObject = Omit<PlotObject, "id" | "createdAt">;
export type CreateExpense = Omit<Expense, "id" | "createdAt">;
export type CreateTimelineTask = Omit<TimelineTask, "id" | "createdAt">;

