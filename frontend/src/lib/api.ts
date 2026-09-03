import type {
  AuthInput,
  CreateExpense,
  CreatePlot,
  CreatePlotObject,
  CreateTimelineTask,
  Expense,
  Plot,
  PlotObject,
  TimelineTask,
  UpdateExpense,
  UpdatePlot,
  UpdatePlotObject,
  UpdateTimelineTask,
  User,
  BuildingConfig,
  CreateBuildingFloor,
  BuildingFloor,
  FloorElement,
  SaveBuildingConfig,
  SaveFloorElement,
} from "@/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: Record<string, string> };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details: Record<string, string> = {},
  ) {
    super(message);
  }
}
export const errorDetails = (error: unknown): Record<string, string> =>
  error instanceof ApiError ? error.details : {};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorEnvelope;
    throw new ApiError(
      response.status,
      payload.error?.message ?? "Request failed",
      payload.error?.code,
      payload.error?.details,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
const send = <T>(method: "POST" | "PUT" | "PATCH", path: string, body: unknown) =>
  request<T>(path, { method, body: JSON.stringify(body) });
const remove = (path: string) => request<void>(path, { method: "DELETE" });
const base = (plotId: string) => `/api/v1/plots/${plotId}`;

export const api = {
  register: (input: AuthInput) => send<User>("POST", "/api/v1/auth/register", input),
  login: (input: AuthInput) => send<User>("POST", "/api/v1/auth/login", input),
  logout: () => send<void>("POST", "/api/v1/auth/logout", {}),
  me: () => request<User>("/api/v1/auth/me"),
  listPlots: () => request<Plot[]>("/api/v1/plots/"),
  createPlot: (input: CreatePlot) => send<Plot>("POST", "/api/v1/plots/", input),
  getPlot: (id: string) => request<Plot>(`${base(id)}/`),
  updatePlot: (id: string, input: UpdatePlot) => send<Plot>("PATCH", `${base(id)}/`, input),
  deletePlot: (id: string) => remove(`${base(id)}/`),
  createObject: (plotId: string, input: CreatePlotObject) =>
    send<PlotObject>("POST", `${base(plotId)}/objects/`, input),
  updateObject: (plotId: string, id: string, input: UpdatePlotObject) =>
    send<PlotObject>("PATCH", `${base(plotId)}/objects/${id}/`, input),
  deleteObject: (plotId: string, id: string) => remove(`${base(plotId)}/objects/${id}/`),
  listExpenses: (plotId: string) => request<Expense[]>(`${base(plotId)}/expenses/`),
  createExpense: (plotId: string, input: CreateExpense) =>
    send<Expense>("POST", `${base(plotId)}/expenses/`, input),
  updateExpense: (plotId: string, id: string, input: UpdateExpense) =>
    send<Expense>("PATCH", `${base(plotId)}/expenses/${id}/`, input),
  deleteExpense: (plotId: string, id: string) => remove(`${base(plotId)}/expenses/${id}/`),
  listTasks: (plotId: string) => request<TimelineTask[]>(`${base(plotId)}/timeline/tasks/`),
  createTask: (plotId: string, input: CreateTimelineTask) =>
    send<TimelineTask>("POST", `${base(plotId)}/timeline/tasks/`, input),
  updateTask: (plotId: string, id: string, input: UpdateTimelineTask) =>
    send<TimelineTask>("PATCH", `${base(plotId)}/timeline/tasks/${id}/`, input),
  deleteTask: (plotId: string, id: string) => remove(`${base(plotId)}/timeline/tasks/${id}/`),
  getBuilding: (plotId: string, objectId: string) =>
    request<BuildingConfig>(`${base(plotId)}/buildings/${objectId}/`),
  saveBuilding: (plotId: string, objectId: string, input: SaveBuildingConfig) =>
    send<BuildingConfig>("PUT", `${base(plotId)}/buildings/${objectId}/`, input),
  addBuildingFloor: (plotId: string, objectId: string, input: CreateBuildingFloor) =>
    send<BuildingFloor>("POST", `${base(plotId)}/buildings/${objectId}/floors`, input),
  updateBuildingFloor: (
    plotId: string,
    objectId: string,
    floorId: string,
    input: CreateBuildingFloor,
  ) =>
    send<BuildingFloor>("PATCH", `${base(plotId)}/buildings/${objectId}/floors/${floorId}`, input),
  deleteBuildingFloor: (plotId: string, objectId: string, floorId: string) =>
    remove(`${base(plotId)}/buildings/${objectId}/floors/${floorId}`),
  addFloorElement: (plotId: string, objectId: string, floorId: string, input: SaveFloorElement) =>
    send<FloorElement>(
      "POST",
      `${base(plotId)}/buildings/${objectId}/floors/${floorId}/elements`,
      input,
    ),
  updateFloorElement: (
    plotId: string,
    objectId: string,
    floorId: string,
    elementId: string,
    input: SaveFloorElement,
  ) =>
    send<FloorElement>(
      "PATCH",
      `${base(plotId)}/buildings/${objectId}/floors/${floorId}/elements/${elementId}`,
      input,
    ),
  deleteFloorElement: (plotId: string, objectId: string, floorId: string, elementId: string) =>
    remove(`${base(plotId)}/buildings/${objectId}/floors/${floorId}/elements/${elementId}`),
};
