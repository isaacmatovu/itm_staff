"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/lib/stores/theme-store";

/** Persisted light/dark toggle, backed by the zustand theme store. Mirrors
 * the inline script in app/layout.tsx that applies the stored choice before
 * first paint, so there's no flash of the wrong theme. */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const toggle = useThemeStore((s) => s.toggle);
  const syncFromDom = useThemeStore((s) => s.syncFromDom);

  useEffect(() => {
    // Syncing the store FROM the DOM attribute the inline script in
    // app/layout.tsx already set before hydration — there's no render-time
    // way to read it without a server/client mismatch (document doesn't
    // exist during SSR), so this one-time read is the legitimate exception
    // to "don't setState synchronously in an effect."
    syncFromDom();
  }, [syncFromDom]);

  const isDark = hydrated && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-icon flex items-center justify-center text-muted"
      style={{ border: "none", background: "transparent" }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle color theme"
    >
      {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
    </button>
  );
}
