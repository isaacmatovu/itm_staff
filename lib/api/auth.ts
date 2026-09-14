import { apiFetch, apiFetchRaw, API_URL } from "./client";
import type { ProfileResponse, TotpSetupResponse } from "./types";

// Not a fetch — a full navigation to a different origin (the Go API, not
// an internal Next.js route), which issues its own 302 to Google. Has to
// be a real browser navigation, not router.push/redirect.
export function redirectToGoogleLogin() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- external origin, not an internal route
  window.location.href = `${API_URL}/auth/google/login`;
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
