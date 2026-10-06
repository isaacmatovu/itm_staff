"use client";

import { useRouter } from "next/navigation";
import { StatusBadges } from "./status-badge";
import { OverdueFlag, isOverdue } from "./overdue-flag";
import { useUpdateTaskStatus } from "@/lib/use-tasks";
import { formatDate } from "@/lib/format";
import type { TaskListItem, WorkStatus } from "@/lib/api/types";

const WORK_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function TaskRow({ task }: { task: TaskListItem }) {
  const router = useRouter();
  const updateStatus = useUpdateTaskStatus(task.id);
  const overdue = isOverdue(task.overdue_since, task.work_status);

  return (
    <div
      className="card card-hover task-row justify-between gap-3 sm:gap-4"
      style={{ cursor: "pointer", padding: "16px 18px" }}
      onClick={() => router.push(`/tasks/${task.id}`)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate font-semibold" style={{ fontSize: 14.5 }}>
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadges
            approvalStatus={task.approval_status}
            workStatus={task.work_status}
          />
          <OverdueFlag isOverdue={overdue} />
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 sm:shrink-0 sm:flex-nowrap sm:justify-end sm:gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="text-sm text-muted sm:min-w-25"
          style={{ textAlign: "right", whiteSpace: "nowrap" }}
        >
          {task.due_date ? formatDate(task.due_date) : "Awaiting approval"}
        </span>
        <select
          className="input input-status-select"
          style={{ minHeight: 36, fontSize: 13, padding: "6px 10px" }}
          value={task.work_status}
          disabled={updateStatus.isPending}
          onChange={(e) =>
            updateStatus.mutate({ work_status: e.target.value as WorkStatus })
          }
        >
          {WORK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
