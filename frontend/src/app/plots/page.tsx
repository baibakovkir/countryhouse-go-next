"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusMessage } from "@/components/StatusMessage";
import { PlotCreateForm } from "@/features/plot/PlotCreateForm";
import { PlotList } from "@/features/plot/PlotList";
import { useAuthStore } from "@/stores/auth-store";
import { useDataStore } from "@/stores/data-store";

export default function PlotsPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const { plots, loading, error, loadPlots, createPlot, updatePlot, deletePlot } = useDataStore();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated") void loadPlots();
  }, [status, router, loadPlots]);

  if (status !== "authenticated") return <p>Проверка авторизации…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Мои участки</h1>
        <p className="mt-1 text-slate-600">Создавайте и открывайте независимые планы.</p>
      </div>
      <StatusMessage error={error} loading={loading} />
      <PlotCreateForm
        loading={loading}
        onCreate={createPlot}
        onCreated={(plot) => router.push(`/plots/${plot.id}/plan`)}
      />
      <PlotList plots={plots} loading={loading} onUpdate={updatePlot} onDelete={deletePlot} />
    </div>
  );
}
