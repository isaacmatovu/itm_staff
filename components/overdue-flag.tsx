import { AlertCircle } from "lucide-react";

// Per the agreed scope, overdue is a quiet, always-visible signal — never
// a popup, toast, or badge counter designed to create urgency. This is the
// one consistent inline treatment used everywhere a task can be overdue.
export function OverdueFlag({ isOverdue }: { isOverdue: boolean }) {
  if (!isOverdue) return null;

  return (
    <span className="chip" style={{ color: "var(--st-over)", background: "var(--st-over-bg)" }}>
      <AlertCircle size={13} strokeWidth={2} />
      Overdue
    </span>
  );
}

// Every task-bearing endpoint (list and detail alike) now returns the
// worker's own authoritative overdue_since flag (MarkTasksOverdue) — this
// just applies the one extra rule the UI adds on top: done tasks never
// read as overdue, even if overdue_since was set before they were finished.
export function isOverdue(overdueSince: string | null, workStatus: string): boolean {
  return !!overdueSince && workStatus !== "done";
}
