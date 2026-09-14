"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { totpSetup, totpVerify } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck } from "lucide-react";

type Phase = "loading" | "enroll" | "enter" | "verifying" | "locked";

// TT-02 — guards every single login, no exceptions. First-time users see a
// QR-enrollment step ahead of the everyday code-entry screen; the two are
// deliberately distinct visual sub-states so they're never confused.
//
// useSearchParams() opts this whole tree out of static rendering unless
// it's wrapped in Suspense — the actual page below is the Suspense child.
export default function VerifyTwoFactorPage() {
  return (
    <Suspense>
      <VerifyTwoFactorInner />
    </Suspense>
  );
}

function VerifyTwoFactorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const isStepUp = searchParams.get("reason") === "new_device";

  const [phase, setPhase] = useState<Phase>("loading");
  const [qr, setQr] = useState<{ qr_code_data_url: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // There's no pre-session "am I enrolled" endpoint — /auth/2fa/setup itself
  // doubles as the probe: it succeeds (issuing a fresh QR) only when the
  // account has no secret yet, and 400s with a fixed message otherwise.
  useEffect(() => {
    totpSetup()
      .then((res) => {
        setQr(res);
        setPhase("enroll");
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.code === 400) {
          setPhase("enter");
        } else if (err instanceof ApiError && err.code === 403) {
          router.replace("/login");
        } else {
          setPhase("enter");
        }
      });
  }, [router]);

  useEffect(() => {
    if (phase === "enter" || phase === "enroll") inputRef.current?.focus();
  }, [phase]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setPhase("verifying");
    setError(null);
    try {
      await totpVerify(code);
      await refresh();
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.code === 429) {
        setPhase("locked");
        setError("Too many attempts. Try again in 15 minutes.");
      } else {
        setPhase(qr ? "enroll" : "enter");
        setError(
          err instanceof ApiError && err.message.includes("new device")
            ? "New device detected — check your email to confirm before logging in."
            : "Incorrect code, please try again.",
        );
        setCode("");
      }
    }
  }

  if (phase === "loading") {
    return (
      <Shell>
        <div className="sk" style={{ width: 200, height: 16 }} />
      </Shell>
    );
  }

  return (
    <Shell>
      <span
        className="grid place-items-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "var(--color-primary-soft)",
          color: "var(--color-primary)",
        }}
      >
        <ShieldCheck size={24} strokeWidth={1.75} />
      </span>

      <div>
        <h1>{isStepUp ? "Verify this device" : "Two-Factor Verification"}</h1>
        <p className="text-sm text-muted">
          {isStepUp
            ? "We noticed a new device — please verify again."
            : phase === "enroll"
              ? "Scan this with Google Authenticator (or equivalent)."
              : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      {phase === "enroll" && qr && (
        <div
          className="flex flex-wrap items-center gap-4 p-4"
          style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-lg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.qr_code_data_url}
            alt="TOTP enrollment QR code"
            width={110}
            height={110}
            style={{ borderRadius: "var(--radius-md)", background: "#fff", padding: 6 }}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Can&apos;t scan? Enter manually:</span>
            <code
              className="text-xs"
              style={{ padding: "8px 10px", background: "var(--color-surface)", borderRadius: "var(--radius-sm)", wordBreak: "break-all" }}
            >
              {qr.secret}
            </code>
          </div>
        </div>
      )}

      {phase === "locked" ? (
        <div className="chip w-fit" style={{ color: "var(--st-changes)", background: "var(--st-changes-bg)", fontSize: 13, padding: "8px 14px" }}>
          {error}
        </div>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            className="input text-xl tracking-[0.35em] sm:text-2xl sm:tracking-[0.5em]"
            style={{ textAlign: "center", paddingLeft: 16 }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoComplete="one-time-code"
            aria-label="6-digit verification code"
          />
          {error && (
            <div className="text-sm" style={{ color: "var(--st-changes)" }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" style={{ minHeight: 46 }} disabled={code.length !== 6 || phase === "verifying"}>
            {phase === "verifying" ? "Verifying…" : "Verify"}
          </button>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "radial-gradient(circle at 50% 0%, var(--color-primary-soft), var(--color-bg) 55%)" }}
    >
      <div className="card w-full max-w-sm gap-5 p-6 sm:p-9" style={{ boxShadow: "var(--shadow-lg)" }}>
        {children}
      </div>
    </div>
  );
}
