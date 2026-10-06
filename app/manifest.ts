import type { MetadataRoute } from "next";

// Web app manifest — served at /manifest.webmanifest and linked from every
// page automatically. Colors mirror the light-theme tokens in globals.css
// (--color-bg / --color-surface); icons live in public/ and are generated
// to match the "IT" mark in components/nav-shell.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ITM Task Tracking",
    short_name: "ITM Tasks",
    description: "ITM Africa internal task tracking — staff",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f8fc",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Create Task", url: "/tasks/new", icons: [{ src: "/icon-192x192.png", sizes: "192x192" }] },
      { name: "Task List", url: "/tasks", icons: [{ src: "/icon-192x192.png", sizes: "192x192" }] },
    ],
  };
}
