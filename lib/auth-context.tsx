"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getProfile, logout } from "./api/auth";
import type { ProfileResponse } from "./api/types";

interface AuthState {
  user: ProfileResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Routes reachable without a session. Everything else waits on the profile
// check below and bounces to /login if it 401s.
const PUBLIC_ROUTES = ["/login", "/verify-2fa"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  async function load() {
    try {
      const profile = await getProfile();
      setUser(profile);
      if (isPublicRoute) router.replace("/");
    } catch {
      setUser(null);
      if (!isPublicRoute) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Session bootstrap: fetch-on-mount, setState happens in load()'s own
    // .then/catch after the await, not synchronously in the effect body —
    // the standard "sync client auth state with the server on load" case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // Only re-check on route changes between public/private — not on every
    // pathname change, or every task-detail navigation would re-fetch it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every /tasks endpoint this app calls is deliberately role-agnostic on
  // the backend ("always my tasks, no role branch" — services/tasks.go) so
  // that admin-itm's own personal-tasks dashboard can reuse it. That means
  // this app can't lean on the API to keep admin accounts out; it has to
  // gate on role itself once it knows who's signed in. This is a UI-only
  // gate — it never revokes the session, so an admin who's also open in
  // admin-itm in another tab isn't affected.
  const accessDenied = !!user && user.role !== "staff";

  if (!loading && !isPublicRoute && accessDenied) {
    return <AccessDenied email={user!.email} />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh: load }}>
      {loading && !isPublicRoute ? <FullPageSkeleton /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AccessDenied({ email }: { email: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="card w-full max-w-sm gap-4 text-center" style={{ padding: "36px 32px", boxShadow: "var(--shadow-lg)" }}>
        <div>
          <h1>This app is for staff accounts</h1>
          <p className="text-sm text-muted">
            {email} is an admin account. Use the ITM Admin app to manage approvals, users, and the company overview.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-block" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

function FullPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--color-bg)" }}>
      <div className="sk" style={{ width: 120, height: 14 }} />
    </div>
  );
}
