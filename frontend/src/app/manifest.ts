import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "baibakovkir — сервис планировщика участка",
    short_name: "baibakovkir",
    description: "План участка, объекты, расходы и задачи в одном сервисе.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#047857",
    icons: [
      { src: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
