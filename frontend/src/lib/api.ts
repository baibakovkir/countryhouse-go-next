import type {
  CreateExpense,
  CreatePlot,
  CreatePlotObject,
  CreateTimelineTask,
  Expense,
  Plot,
  PlotObject,
  TimelineTask,
} from "@/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface ErrorEnvelope {
  error?: { message?: string };
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorEnvelope;
    throw new ApiError(response.status, payload.error?.message ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const api = {
  getPlot: () => request<Plot>("/api/v1/plot"),
  createPlot: (input: CreatePlot) => post<Plot>("/api/v1/plot", input),
  createObject: (input: CreatePlotObject) => post<PlotObject>("/api/v1/plot/objects", input),
  listExpenses: () => request<Expense[]>("/api/v1/expenses"),
  createExpense: (input: CreateExpense) => post<Expense>("/api/v1/expenses", input),
  listTasks: () => request<TimelineTask[]>("/api/v1/timeline/tasks"),
  createTask: (input: CreateTimelineTask) => post<TimelineTask>("/api/v1/timeline/tasks", input),
};

