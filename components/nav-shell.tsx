"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/lib/api/auth";
import { LayoutGrid, ClipboardList, Plus, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

// Staff-only navigation, per the design spec's role-based nav rule: staff
// see My Tasks / Task List / Create Task and nothing else — no Admin
// section exists in this app at all. Icon choices match the sibling
// admin-itm app's sidebar (LayoutGrid/ClipboardList/Plus) for a shared
// visual vocabulary across the two apps.
const NAV_ITEMS = [
  { href: "/", label: "My Tasks", icon: LayoutGrid },
  { href: "/tasks", label: "Task List", icon: ClipboardList },
  { href: "/tasks/new", label: "Create Task", icon: Plus },
];

// Mobile-first shell: below `md` there's no room for a persistent sidebar,
// so navigation lives behind a hamburger in a slim top bar and slides in
// as a drawer over the content. From `md` up, the drawer/top-bar are
// replaced by the classic persistent sidebar — same NavContent either way.
export function NavShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on every navigation. This runs from the same user
  // gesture that changed the route (a Link click inside NavContent), not
  // as a derived-state sync — see NavContent's onNavigate.
  function closeDrawer() {
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--color-bg)" }}>
      {/* Mobile top bar — hidden from md up, where the persistent sidebar takes over. */}
      <header
        className="flex items-center justify-between gap-3 px-4 py-3 md:hidden"
        style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, zIndex: 30 }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="btn-icon flex items-center justify-center"
          style={{ border: "none", background: "transparent", marginLeft: -8 }}
          aria-label="Open navigation menu"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span
            className="grid place-items-center font-extrabold text-white"
            style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-active))", fontSize: 12 }}
          >
            IT
          </span>
          <span className="font-bold" style={{ fontSize: 14 }}>
            ITM Africa
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden">
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: "fixed", inset: 0, background: "color-mix(in srgb, #0a0d16 55%, transparent)", zIndex: 40 }}
          />
          <nav
            className="flex flex-col gap-8 p-5"
            style={{
              position: "fixed",
              inset: "0 auto 0 0",
              width: "min(84vw, 288px)",
              zIndex: 41,
              background: "var(--color-bg)",
              boxShadow: "var(--shadow-lg)",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between">
              <BrandMark />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn-icon flex items-center justify-center text-muted"
                style={{ border: "none", background: "transparent" }}
                aria-label="Close navigation menu"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <NavContent pathname={pathname} onNavigate={closeDrawer} />
          </nav>
        </div>
      )}

      {/* Persistent desktop sidebar — from md up only. */}
      <nav
        className="hidden flex-col gap-8 p-5 md:flex"
        style={{ width: 248, flex: "none", borderRight: "1px solid var(--color-border)" }}
      >
        <BrandMark />
        <NavContent pathname={pathname} />
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:py-8 md:pr-8 md:pl-8" style={{ minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span
        className="grid place-items-center font-extrabold text-white"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-active))",
          fontSize: 14,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        IT
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-bold" style={{ fontSize: 14.5 }}>
          ITM Africa
        </span>
        <span className="text-xs text-muted">Task Tracking</span>
      </div>
    </Link>
  );
}

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  const { user } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <>
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3.5 py-2.5 font-medium transition-colors"
              style={{
                borderRadius: "var(--radius-full)",
                fontSize: 14,
                background: active ? "var(--color-primary-soft)" : "transparent",
                color: active ? "var(--color-primary-soft-text)" : "var(--color-text-muted)",
              }}
            >
              <ItemIcon size={19} strokeWidth={active ? 2.1 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div
        className="mt-auto flex items-center gap-2.5 p-3"
        style={{ borderRadius: "var(--radius-lg)", background: "var(--color-surface)", boxShadow: "var(--shadow-xs)" }}
      >
        <span
          className="grid place-items-center font-semibold text-white"
          style={{
            width: 34,
            height: 34,
            flex: "none",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-active))",
            fontSize: 12.5,
          }}
        >
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium" style={{ fontSize: 13.5 }}>
            {user?.display_name}
          </span>
          <span className="truncate text-xs text-muted">{user?.email}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-icon flex items-center justify-center text-muted"
          style={{ border: "none", background: "transparent" }}
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={17} strokeWidth={1.75} />
        </button>
      </div>

      {/* Theme toggle lives in the mobile top bar too, but stays here for
          desktop where that bar doesn't render. */}
      <div className="hidden items-center justify-between px-1 md:flex">
        <span className="text-xs text-muted">Theme</span>
        <ThemeToggle />
      </div>
    </>
  );
}
