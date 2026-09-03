import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-20 py-8 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <section className="space-y-6">
          <Image
            src="/logo.png"
            alt="Baibakovkir Knowledge"
            width={360}
            height={181}
            className="h-auto w-64 max-w-full"
            priority
          />
          <p className="eyebrow">сервис планировщика участка</p>
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
          className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl shadow-emerald-950/20"
          aria-label="Визуализация проекта участка"
        >
          <Image
            src="/plot-planner-hero.png"
            alt="Трёхмерный проект участка с рельефом, домом, садом и коммуникациями"
            width={1536}
            height={1024}
            className="h-full min-h-80 w-full object-cover"
            priority
          />
        </section>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["01", "Точный план", "Размеры, координаты и объекты в одной метрической системе."],
          [
            "02",
            "Рельеф и уровни",
            "Высотные отметки превращаются в наглядную поверхность участка.",
          ],
          ["03", "Проект под контролем", "Расходы, задачи и коммуникации связаны с вашим планом."],
        ].map(([number, title, text]) => (
          <article key={number} className="panel">
            <span className="text-sm font-black text-emerald-700">{number}</span>
            <h2 className="mt-8 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
