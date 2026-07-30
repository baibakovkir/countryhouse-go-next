import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  CreateExpense,
  CreatePlot,
  CreatePlotObject,
  CreateTimelineTask,
  Expense,
  Plot,
  TimelineTask,
  UpdateExpense,
  UpdatePlot,
  UpdatePlotObject,
  UpdateTimelineTask,
} from "@/types/domain";
interface DataState {
  plots: Plot[];
  plot: Plot | null;
  expenses: Expense[];
  tasks: TimelineTask[];
  loading: boolean;
  error: string | null;
  loadPlots(): Promise<void>;
  createPlot(input: CreatePlot): Promise<Plot>;
  updatePlot(id: string, input: UpdatePlot): Promise<void>;
  deletePlot(id: string): Promise<void>;
  loadPlot(id: string): Promise<void>;
  createObject(plotId: string, input: CreatePlotObject): Promise<void>;
  updateObject(plotId: string, id: string, input: UpdatePlotObject): Promise<void>;
  deleteObject(plotId: string, id: string): Promise<void>;
  loadExpenses(plotId: string): Promise<void>;
  createExpense(plotId: string, input: CreateExpense): Promise<void>;
  updateExpense(plotId: string, id: string, input: UpdateExpense): Promise<void>;
  deleteExpense(plotId: string, id: string): Promise<void>;
  loadTasks(plotId: string): Promise<void>;
  createTask(plotId: string, input: CreateTimelineTask): Promise<void>;
  updateTask(plotId: string, id: string, input: UpdateTimelineTask): Promise<void>;
  deleteTask(plotId: string, id: string): Promise<void>;
  clear(): void;
}
const message = (error: unknown) => (error instanceof Error ? error.message : "Неизвестная ошибка");
async function action(set: (state: Partial<DataState>) => void, work: () => Promise<void>) {
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
type StoreSet = (state: Partial<DataState>) => void;
type StoreGet = () => DataState;

const initialState = {
  plots: [],
  plot: null,
  expenses: [],
  tasks: [],
  loading: false,
  error: null,
} satisfies Pick<DataState, "plots" | "plot" | "expenses" | "tasks" | "loading" | "error">;

function plotActions(set: StoreSet, get: StoreGet) {
  return {
    loadPlots: () => action(set, async () => set({ plots: await api.listPlots() })),
    createPlot: async (input) => {
      let created!: Plot;
      await action(set, async () => {
        created = await api.createPlot(input);
        set({ plots: [...get().plots, created] });
      });
      return created;
    },
    updatePlot: (id, input) =>
      action(set, async () => {
        const updated = await api.updatePlot(id, input);
        set({
          plot: get().plot?.id === id ? updated : get().plot,
          plots: get().plots.map((item) => (item.id === id ? updated : item)),
        });
      }),
    deletePlot: (id) =>
      action(set, async () => {
        await api.deletePlot(id);
        set({
          plots: get().plots.filter((item) => item.id !== id),
          plot: get().plot?.id === id ? null : get().plot,
        });
      }),
    loadPlot: (id) => action(set, async () => set({ plot: await api.getPlot(id) })),
  } satisfies Pick<
    DataState,
    "loadPlots" | "createPlot" | "updatePlot" | "deletePlot" | "loadPlot"
  >;
}

function objectActions(set: StoreSet) {
  return {
    createObject: (plotId, input) =>
      action(set, async () => {
        await api.createObject(plotId, input);
        set({ plot: await api.getPlot(plotId) });
      }),
    updateObject: (plotId, id, input) =>
      action(set, async () => {
        await api.updateObject(plotId, id, input);
        set({ plot: await api.getPlot(plotId) });
      }),
    deleteObject: (plotId, id) =>
      action(set, async () => {
        await api.deleteObject(plotId, id);
        set({ plot: await api.getPlot(plotId) });
      }),
  } satisfies Pick<DataState, "createObject" | "updateObject" | "deleteObject">;
}

function expenseActions(set: StoreSet) {
  return {
    loadExpenses: (plotId) =>
      action(set, async () => set({ expenses: await api.listExpenses(plotId) })),
    createExpense: (plotId, input) =>
      action(set, async () => {
        await api.createExpense(plotId, input);
        set({ expenses: await api.listExpenses(plotId) });
      }),
    updateExpense: (plotId, id, input) =>
      action(set, async () => {
        await api.updateExpense(plotId, id, input);
        set({ expenses: await api.listExpenses(plotId) });
      }),
    deleteExpense: (plotId, id) =>
      action(set, async () => {
        await api.deleteExpense(plotId, id);
        set({ expenses: await api.listExpenses(plotId) });
      }),
  } satisfies Pick<DataState, "loadExpenses" | "createExpense" | "updateExpense" | "deleteExpense">;
}

function taskActions(set: StoreSet) {
  return {
    loadTasks: (plotId) => action(set, async () => set({ tasks: await api.listTasks(plotId) })),
    createTask: (plotId, input) =>
      action(set, async () => {
        await api.createTask(plotId, input);
        set({ tasks: await api.listTasks(plotId) });
      }),
    updateTask: (plotId, id, input) =>
      action(set, async () => {
        await api.updateTask(plotId, id, input);
        set({ tasks: await api.listTasks(plotId) });
      }),
    deleteTask: (plotId, id) =>
      action(set, async () => {
        await api.deleteTask(plotId, id);
        set({ tasks: await api.listTasks(plotId) });
      }),
  } satisfies Pick<DataState, "loadTasks" | "createTask" | "updateTask" | "deleteTask">;
}

export const useDataStore = create<DataState>((set, get) => ({
  ...initialState,
  ...plotActions(set, get),
  ...objectActions(set),
  ...expenseActions(set),
  ...taskActions(set),
  clear: () => set({ plots: [], plot: null, expenses: [], tasks: [], error: null }),
}));
