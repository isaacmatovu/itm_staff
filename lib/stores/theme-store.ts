import { create } from "zustand";

type Theme = "light" | "dark";
const STORAGE_KEY = "itm-theme";

interface ThemeState {
  theme: Theme;
  /** True once the store has synced itself from the DOM attribute the
   *  inline script in app/layout.tsx already stamped pre-paint. Reading
   *  it before then would report the SSR default ("light") even when a
   *  dark choice is persisted — see syncFromDom(). */
  hydrated: boolean;
  toggle: () => void;
  syncFromDom: () => void;
}

/** The app's one piece of genuinely global client UI state. Persistence is
 * a plain localStorage.setItem, not zustand's `persist` middleware: that
 * middleware hydrates synchronously from localStorage at store-creation
 * time on the client, which runs before the DOM attribute set by
 * app/layout.tsx's inline script is necessarily read, and would fight with
 * the SSR-rendered default. syncFromDom() below is the same legitimate
 * one-time read instead. */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  hydrated: false,
  toggle: () => {
    const next: Theme = get().theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in a private/blocked context — the toggle
      // still works for this page load, it just won't persist.
    }
    set({ theme: next });
  },
  syncFromDom: () => {
    const theme: Theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    set({ theme, hydrated: true });
  },
}));
