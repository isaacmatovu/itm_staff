import type { DurationUnit } from "./api/types";

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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
