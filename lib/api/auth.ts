import { apiFetch, apiFetchRaw } from "./client";
import type { ProfileResponse, TotpSetupResponse } from "./types";

// Not a fetch — a full navigation to a different origin (the Go API, not
// an internal Next.js route), which issues its own 302 to Google. Has to
// be a real browser navigation, not router.push/redirect.
export function redirectToGoogleLogin() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- external origin, not an internal route
  window.location.href = `/api/v1/auth/google/login?return_to=${encodeURIComponent(window.location.origin)}`;
}

export function getProfile() {
  return apiFetch<ProfileResponse>("/profile");
}

export function totpSetup() {
  return apiFetchRaw<TotpSetupResponse>("/auth/2fa/setup", { method: "POST" });
}

// Unlike setup, verify's success body IS wrapped in {success,data} on the
// Go side (utils.SuccessResponse) — only /auth/2fa/setup returns raw JSON.
export function totpVerify(code: string) {
  return apiFetch<{ user: string }>("/auth/2fa/verify", {
    method: "POST",
    body: { code },
  });
}

export function logout() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "";
const HANDOFF_KEY = "g_handoff";
// Matches the backend's handoff_state lifetime (5 minutes).
export const HANDOFF_WINDOW_MS = 5 * 60_000;

export type Handoff = { verifier: string; challenge: string };

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Async (SHA-256), so call it BEFORE the click. Awaiting inside the click
// handler can make browsers block window.open (the user gesture is lost).
export async function prepareHandoff(): Promise<Handoff> {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  return { verifier, challenge: b64url(digest) };
}

// Opens the API's own origin (outside the PWA's scope), so it opens in the
// browser where the user's Google accounts live. No return_to on purpose.
export function openGoogleLogin(h: Handoff) {
  try {
    localStorage.setItem(
      HANDOFF_KEY,
      JSON.stringify({ verifier: h.verifier, ts: Date.now() }),
    );
  } catch {}
  window.open(
    `${API_ORIGIN}/api/v1/auth/google/login?handoff=${h.challenge}`,
    "_blank",
  );
}

export function pendingHandoff(): { verifier: string; ts: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(HANDOFF_KEY) ?? "null");
    if (v?.verifier && Date.now() - v.ts < HANDOFF_WINDOW_MS) return v;
  } catch {}
  return null;
}

export function clearHandoff() {
  try {
    localStorage.removeItem(HANDOFF_KEY);
  } catch {}
}

// Same-origin call through the rewrite, so the pre-session cookie is set on
// the app's own domain. Returns the next path, or null while still pending.
export async function claimGoogleLogin(
  verifier: string,
): Promise<string | null> {
  const res = await fetch("/api/v1/auth/google/claim", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verifier }),
  });
  if (res.status === 200) return ((await res.json()) as { next: string }).next;
  return null; // 202 pending, or an error: keep polling until the window ends
}
