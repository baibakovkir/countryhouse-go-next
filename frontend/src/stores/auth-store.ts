import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import type { AuthInput, User } from "@/types/domain";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";
interface AuthState { user: User | null; status: AuthStatus; loading: boolean; error: string | null; initialize(): Promise<void>; login(input: AuthInput): Promise<void>; register(input: AuthInput): Promise<void>; logout(): Promise<void>; clearError(): void }
const message = (error: unknown) => error instanceof Error ? error.message : "Неизвестная ошибка";
export const useAuthStore = create<AuthState>((set) => ({
  user: null, status: "unknown", loading: false, error: null, clearError: () => set({ error: null }),
  initialize: async () => { try { set({ user: await api.me(), status: "authenticated" }); } catch (error) { if (error instanceof ApiError && error.status === 401) set({ user: null, status: "unauthenticated" }); else set({ error: message(error), status: "unauthenticated" }); } },
  login: async (input) => { set({ loading: true, error: null }); try { set({ user: await api.login(input), status: "authenticated" }); } catch (error) { set({ error: message(error) }); throw error; } finally { set({ loading: false }); } },
  register: async (input) => { set({ loading: true, error: null }); try { set({ user: await api.register(input), status: "authenticated" }); } catch (error) { set({ error: message(error) }); throw error; } finally { set({ loading: false }); } },
  logout: async () => { set({ loading: true }); try { await api.logout(); } finally { set({ user: null, status: "unauthenticated", loading: false }); } },
}));
