import { PlotNav } from "@/components/PlotNav";

interface PlotPageHeaderProps {
  plotId: string;
  title: string;
  description: string;
}

export function PlotPageHeader({ plotId, title, description }: PlotPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-slate-600">{description}</p>
      </div>
      <PlotNav plotId={plotId} />
    </div>
  );
}
