import Link from "next/link";

export function AppNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/plot" className="text-lg font-bold text-slate-900">Мой участок</Link>
        <nav className="flex gap-2 text-sm font-medium">
          <Link className="nav-link" href="/plot">Участок</Link>
          <Link className="nav-link" href="/expenses">Расходы</Link>
          <Link className="nav-link" href="/timeline">План</Link>
        </nav>
      </div>
    </header>
  );
}

