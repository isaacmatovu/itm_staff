"use client";

import { useEffect } from "react";

// Registers public/sw.js. Production only: in `next dev` a service worker
// caching /_next/static would fight hot reload and serve stale chunks.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("Service worker registration failed:", err));
  }, []);

  return null;
}
