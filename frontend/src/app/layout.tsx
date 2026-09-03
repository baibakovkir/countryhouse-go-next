import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { AuthBootstrap } from "@/components/AuthBootstrap";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "baibakovkir — планировщик участка", template: "%s · baibakovkir" },
  description:
    "Спланируйте участок, разместите объекты по координатам и держите расходы и задачи в одном месте.",
  applicationName: "baibakovkir",
  keywords: ["планировщик участка", "план участка", "ландшафтное планирование"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "baibakovkir",
    title: "baibakovkir — сервис планировщика участка",
    description: "План, объекты, расходы и задачи участка в одном сервисе.",
  },
  twitter: {
    card: "summary_large_image",
    title: "baibakovkir — сервис планировщика участка",
    description: "Планируйте участок в координатах и управляйте проектом.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32" },
    ],
    apple: "/favicons/apple-touch-icon.png",
  },
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
