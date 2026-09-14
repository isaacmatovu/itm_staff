"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTasks, useResubmitTask } from "@/lib/use-tasks";
import { TaskRow } from "@/components/task-row";
import { isOverdue } from "@/components/overdue-flag";
import { Circle, Clock, CheckCircle2, AlertCircle, Plus, Inbox, type LucideIcon } from "lucide-react";
import type { TaskListItem } from "@/lib/api/types";

// TT-03 — the personal landing page every user sees on login. This app is
// staff-only, so there's no company-wide Admin card here at all — just the
// caller's own tasks.
export default function DashboardPage() {
  const { user } = useAuth();
  // No staff-scoped summary endpoint exists (GET /admin/summary is
  // admin-only), so counts are derived client-side from the caller's own
  // task list. page_size is generous to keep that accurate for a normal
  // workload; a dedicated summary endpoint would be a cleaner fix later.
  const { data, isLoading } = useTasks({ page: 1, page_size: 100 });

  const tasks = data?.data ?? [];
  const needsChanges = tasks.filter((t) => t.approval_status === "needs_changes");
  const counts = {
    not_started: tasks.filter((t) => t.work_status === "not_started").length,
    in_progress: tasks.filter((t) => t.work_status === "in_progress").length,
    done: tasks.filter((t) => t.work_status === "done").length,
    overdue: tasks.filter((t) => isOverdue(t.overdue_since, t.work_status)).length,
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="card-kicker">Welcome back</div>
          <h1>{user?.display_name ? `Hi, ${user.display_name.split(" ")[0]}` : "My Tasks"}</h1>
        </div>
        <Link href="/tasks/new" className="btn btn-primary">
          <Plus size={17} strokeWidth={2} />
          Create Task
        </Link>
      </div>

      {isLoading ? (
        <StatSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Not Started" value={counts.not_started} color="var(--st-idle)" bg="var(--st-idle-bg)" icon={Circle} />
          <StatCard label="In Progress" value={counts.in_progress} color="var(--st-progress)" bg="var(--st-progress-bg)" icon={Clock} />
          <StatCard label="Done" value={counts.done} color="var(--st-approved)" bg="var(--st-approved-bg)" icon={CheckCircle2} />
          <StatCard label="Overdue" value={counts.overdue} color="var(--st-over)" bg="var(--st-over-bg)" icon={AlertCircle} />
        </div>
      )}

      {needsChanges.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="card-kicker" style={{ color: "var(--st-changes)" }}>
            Needs Changes
          </div>
          {needsChanges.map((task) => (
            <NeedsChangesRow key={task.id} task={task} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="card-kicker">My Tasks</div>
        {isLoading ? (
          <ListSkeleton />
        ) : tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
  icon: IconComponent,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: LucideIcon;
}) {
  return (
    <div className="card gap-3.5">
      <span className="icon-chip" style={{ background: bg, color }}>
        <IconComponent size={19} strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-extrabold" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        <span className="text-sm text-muted">{label}</span>
      </div>
    </div>
  );
}

function NeedsChangesRow({ task }: { task: TaskListItem }) {
  const resubmit = useResubmitTask(task.id);
  return (
    <div
      className="card flex-wrap items-center justify-between gap-3"
      style={{ flexDirection: "row", background: "var(--st-changes-bg)", border: "none", padding: "14px 18px" }}
    >
      <Link href={`/tasks/${task.id}`} className="font-semibold" style={{ color: "var(--st-changes)" }}>
        {task.title}
      </Link>
      <div className="flex items-center gap-2">
        <Link href={`/tasks/${task.id}`} className="btn btn-secondary btn-sm">
          View note
        </Link>
        <button type="button" className="btn btn-primary btn-sm" disabled={resubmit.isPending} onClick={() => resubmit.mutate()}>
          {resubmit.isPending ? "Resubmitting…" : "Resubmit"}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card items-center gap-3 text-center" style={{ padding: "48px 24px" }}>
      <span className="icon-chip" style={{ width: 52, height: 52, background: "var(--color-primary-soft)", color: "var(--color-primary)" }}>
        <Inbox size={24} strokeWidth={1.75} />
      </span>
      <div className="card-title">No tasks yet</div>
      <p className="card-body -mt-2">Create your first task to get started.</p>
      <Link href="/tasks/new" className="btn btn-primary">
        <Plus size={16} strokeWidth={2} />
        Create your first task
      </Link>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card gap-3.5">
          <div className="sk" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div className="sk" style={{ width: 60, height: 30 }} />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card">
          <div className="sk" style={{ width: "60%", height: 16 }} />
        </div>
      ))}
    </div>
  );
}
