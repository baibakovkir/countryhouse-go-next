import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 py-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
      <section className="space-y-6">
        <p className="eyebrow">baibakovkir</p>
        <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
          Соберите участок в понятный план.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-slate-600">
          Сервис планировщика участка помогает спроектировать территорию по координатам и уровням:
          учесть уклоны, террасы, высоты зданий и подземные коммуникации, а затем вести расходы и
          задачи проекта.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="ui-link-button">
            Создать участок
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Войти
          </Link>
        </div>
      </section>
      <section
        className="panel relative overflow-hidden bg-slate-950 p-4 sm:p-7"
        aria-label="Пример координатного плана"
      >
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative aspect-square rounded-xl border border-emerald-300/20 bg-slate-900 p-5">
          <div className="grid h-full grid-cols-8 grid-rows-8 border border-emerald-300/25">
            {Array.from({ length: 64 }, (_, index) => (
              <span key={index} className="border border-emerald-300/10" />
            ))}
            <div className="col-start-2 col-span-3 row-start-2 row-span-2 rounded-lg bg-emerald-500/80" />
            <div className="col-start-6 row-start-5 size-10 self-center justify-self-center rounded-full bg-lime-300" />
            <div className="col-start-3 col-span-2 row-start-6 h-5 self-center rounded bg-amber-500/80" />
          </div>
          <div className="mt-4 flex justify-between text-xs text-emerald-200">
            <span>X (м)</span>
            <span>Y (м)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
