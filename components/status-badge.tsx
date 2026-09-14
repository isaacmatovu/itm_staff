import type { ApprovalStatus, WorkStatus } from "@/lib/api/types";

const APPROVAL: Record<ApprovalStatus, { label: string; fg: string; bg: string }> = {
  pending_approval: { label: "Pending Approval", fg: "var(--st-pending)", bg: "var(--st-pending-bg)" },
  needs_changes: { label: "Needs Changes", fg: "var(--st-changes)", bg: "var(--st-changes-bg)" },
  approved: { label: "Approved", fg: "var(--st-approved)", bg: "var(--st-approved-bg)" },
};

const WORK: Record<WorkStatus, { label: string; fg: string; bg: string }> = {
  not_started: { label: "Not Started", fg: "var(--st-idle)", bg: "var(--st-idle-bg)" },
  in_progress: { label: "In Progress", fg: "var(--st-progress)", bg: "var(--st-progress-bg)" },
  done: { label: "Done", fg: "var(--st-approved)", bg: "var(--st-approved-bg)" },
};

function Chip({ fg, bg, label }: { fg: string; bg: string; label: string }) {
  return (
    <span className="chip" style={{ color: fg, background: bg }}>
      <span className="chip-dot" />
      {label}
    </span>
  );
}

// The two status tracks are independent and must never merge into one
// chip — always render both, side by side, everywhere a task appears.
export function StatusBadges({
  approvalStatus,
  workStatus,
}: {
  approvalStatus: ApprovalStatus;
  workStatus: WorkStatus;
}) {
  const a = APPROVAL[approvalStatus];
  const w = WORK[workStatus];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Chip {...a} />
      <Chip {...w} />
    </span>
  );
}

export function ApprovalTag({ status }: { status: ApprovalStatus }) {
  return <Chip {...APPROVAL[status]} />;
}

export function WorkTag({ status }: { status: WorkStatus }) {
  return <Chip {...WORK[status]} />;
}
