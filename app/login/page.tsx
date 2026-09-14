"use client";

import { useState } from "react";
import { redirectToGoogleLogin } from "@/lib/api/auth";

// TT-01 — the single entry point to the system. No password form, no
// self-registration: every account is a Google account, matched or created
// by the API's OAuth callback.
export default function LoginPage() {
  const [redirecting, setRedirecting] = useState(false);
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const oauthError = params?.get("error");

  function handleSignIn() {
    setRedirecting(true);
    redirectToGoogleLogin();
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "radial-gradient(circle at 50% 0%, var(--color-primary-soft), var(--color-bg) 55%)" }}
    >
      <div className="card w-full max-w-sm items-center p-6 text-center sm:p-9" style={{ boxShadow: "var(--shadow-lg)" }}>
        <span
          className="mb-1 grid place-items-center font-extrabold text-white"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-active))",
            fontSize: 20,
            boxShadow: "var(--shadow-md)",
          }}
        >
          IT
        </span>
        <h1 className="mt-3">ITM Africa</h1>
        <p className="text-muted -mt-1 mb-2" style={{ fontSize: 13.5 }}>
          Task Tracking
        </p>

        {oauthError && (
          <div
            className="mb-1 w-full px-3 py-2 text-sm"
            style={{ background: "var(--st-changes-bg)", color: "var(--st-changes)", borderRadius: "var(--radius-md)" }}
            role="alert"
          >
            Sign-in failed, please try again.
          </div>
        )}

        <button type="button" className="btn btn-secondary btn-block" style={{ minHeight: 48, fontSize: 14 }} onClick={handleSignIn} disabled={redirecting}>
          <GoogleIcon />
          {redirecting ? "Redirecting to Google…" : "Sign in with Google"}
        </button>

        <p className="mt-4 text-sm text-muted">Use your ITM Africa Google account to continue</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
