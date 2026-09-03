"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/Button";
export function AppNav() {
  const router = useRouter();
  const { user, status, logout } = useAuthStore();
  const clear = useDataStore((state) => state.clear);
  async function signOut() {
    await logout();
    clear();
    router.replace("/login");
  }
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href={user ? "/plots" : "/login"} className="text-lg font-bold">
          Планировщик участка
        </Link>
        {status === "authenticated" && (
          <div className="flex items-center gap-3 text-sm">
            <Link className="nav-link" href="/plots">
              Участки
            </Link>
            <span className="hidden text-slate-500 sm:inline">{user?.email}</span>
            <Button type="button" variant="ghost" onClick={() => void signOut()}>
              Выйти
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
