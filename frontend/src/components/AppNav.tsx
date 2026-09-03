"use client";
import Link from "next/link";
import Image from "next/image";
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
        <Link
          href={user ? "/plots" : "/"}
          className="flex items-center gap-3"
          aria-label="baibakovkir — сервис планировщика участка"
        >
          <Image
            src="/brand-mark.svg"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-xl"
            priority
          />
          <span>
            <span className="block text-lg font-bold tracking-tight">baibakovkir</span>
            <span className="hidden text-[10px] font-medium tracking-wide text-slate-500 sm:block">
              сервис планировщика участка
            </span>
          </span>
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
