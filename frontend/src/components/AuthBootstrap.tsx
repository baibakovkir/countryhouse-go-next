"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { status, initialize } = useAuthStore();
  useEffect(() => {
    if (status === "unknown") void initialize();
  }, [status, initialize]);
  return children;
}
