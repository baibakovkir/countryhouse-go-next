import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import type { CreateExpense, CreatePlot, CreatePlotObject, CreateTimelineTask, Expense, Plot, TimelineTask } from "@/types/domain";

interface DataState {
  plot: Plot | null;
  expenses: Expense[];
  tasks: TimelineTask[];
  loading: boolean;
  error: string | null;
  loadPlot(): Promise<void>;
  createPlot(input: CreatePlot): Promise<void>;
  createObject(input: CreatePlotObject): Promise<void>;
  loadExpenses(): Promise<void>;
  createExpense(input: CreateExpense): Promise<void>;
  loadTasks(): Promise<void>;
  createTask(input: CreateTimelineTask): Promise<void>;
  clearError(): void;
}

const message = (error: unknown) => error instanceof Error ? error.message : "Неизвестная ошибка";

export const useDataStore = create<DataState>((set, get) => ({
  plot: null,
  expenses: [],
  tasks: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  loadPlot: async () => {
    set({ loading: true, error: null });
    try { set({ plot: await api.getPlot() }); }
    catch (error) { if (!(error instanceof ApiError && error.status === 404)) set({ error: message(error) }); }
    finally { set({ loading: false }); }
  },
  createPlot: async (input) => {
    set({ loading: true, error: null });
    try { set({ plot: await api.createPlot(input) }); }
    catch (error) { set({ error: message(error) }); throw error; }
    finally { set({ loading: false }); }
  },
  createObject: async (input) => {
    set({ loading: true, error: null });
    try { await api.createObject(input); await get().loadPlot(); }
    catch (error) { set({ error: message(error), loading: false }); throw error; }
  },
  loadExpenses: async () => {
    set({ loading: true, error: null });
    try { set({ expenses: await api.listExpenses() }); }
    catch (error) { set({ error: message(error) }); }
    finally { set({ loading: false }); }
  },
  createExpense: async (input) => {
    set({ loading: true, error: null });
    try { await api.createExpense(input); set({ expenses: await api.listExpenses() }); }
    catch (error) { set({ error: message(error) }); throw error; }
    finally { set({ loading: false }); }
  },
  loadTasks: async () => {
    set({ loading: true, error: null });
    try { set({ tasks: await api.listTasks() }); }
    catch (error) { set({ error: message(error) }); }
    finally { set({ loading: false }); }
  },
  createTask: async (input) => {
    set({ loading: true, error: null });
    try { await api.createTask(input); set({ tasks: await api.listTasks() }); }
    catch (error) { set({ error: message(error) }); throw error; }
    finally { set({ loading: false }); }
  },
}));

