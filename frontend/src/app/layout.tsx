import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = { title: "Планировщик участка", description: "План участка, расходы и задачи" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><AppNav /><main className="mx-auto max-w-7xl p-5">{children}</main></body></html>;
}

