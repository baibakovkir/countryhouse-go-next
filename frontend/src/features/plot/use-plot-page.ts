"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function usePlotPage(
  plotId: string,
  loadPlot: (plotId: string) => Promise<void>,
  loadSection?: (plotId: string) => Promise<void>,
) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated") {
      void loadPlot(plotId);
      if (loadSection) void loadSection(plotId);
    }
  }, [status, router, plotId, loadPlot, loadSection]);
  return status;
}
