import type { DurationUnit } from "./api/types";

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(value: number, unit: DurationUnit): string {
  const noun = unit === "days" ? "day" : "week";
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

/** Time-of-day aware greeting for TT-03's "Good morning, {firstName}". */
export function greeting(displayName: string | undefined): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = displayName?.split(" ")[0] ?? displayName;
  return `Good ${part}, ${firstName}`;
}

/** "Today, 4 September 2026" style long date for the TT-03 greeting row. */
export function longDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
