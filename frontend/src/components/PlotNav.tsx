import Link from "next/link";
export function PlotNav({ plotId }: { plotId: string }) { return <nav className="flex flex-wrap gap-2 text-sm"><Link className="nav-link bg-white" href={`/plots/${plotId}/plan`}>План</Link><Link className="nav-link bg-white" href={`/plots/${plotId}/expenses`}>Расходы</Link><Link className="nav-link bg-white" href={`/plots/${plotId}/timeline`}>Работы</Link></nav>; }
