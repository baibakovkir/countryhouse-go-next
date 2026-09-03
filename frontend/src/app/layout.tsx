import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { AuthBootstrap } from "@/components/AuthBootstrap";

export const metadata: Metadata = {
  title: "Планировщик участка",
  description: "План участка, расходы и задачи",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AuthBootstrap>
          <AppNav />
          <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
        </AuthBootstrap>
      </body>
    </html>
  );
}
