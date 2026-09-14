"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTask, useUpdateTaskDetails, useUpdateTaskStatus, useResubmitTask, useDeleteTask } from "@/lib/use-tasks";
import { ApprovalTag, WorkTag } from "@/components/status-badge";
import { OverdueFlag } from "@/components/overdue-flag";
import { Pencil, ArrowLeft, Trash2 } from "lucide-react";
import { formatDate, formatDateTime, formatDuration } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { DurationUnit, ProfileResponse, TaskDetail, TaskHistoryEntry, WorkStatus } from "@/lib/api/types";

const EVENT_LABELS: Record<TaskHistoryEntry["event_type"], string> = {
  created: "Created",
  resubmitted: "Resubmitted",
  sent_back: "Sent Back",
  approved: "Approved",
  status_change: "Status Changed",
  reassigned: "Reassigned",
  comment: "Comment",
};

const EVENT_COLORS: Record<TaskHistoryEntry["event_type"], string> = {
  created: "var(--st-idle)",
  resubmitted: "var(--st-pending)",
  sent_back: "var(--st-changes)",
  approved: "var(--st-approved)",
  status_change: "var(--st-progress)",
  reassigned: "var(--st-progress)",
  comment: "var(--st-idle)",
};

// TT-06 — the single source of truth for one task. Staff view only: no
// Admin action row (approve / send-back / reassign) exists in this app.
export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, error } = useTask(id);

  if (isLoading) return <DetailSkeleton />;

  if (error || !data) {
    const notFound = error instanceof ApiError && error.code === 404;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card gap-3" style={{ padding: 32 }}>
          <p style={{ color: "var(--st-changes)", margin: 0 }}>
            {notFound ? "This task doesn't exist or you don't have access to it." : "Something went wrong loading this task."}
          </p>
          <button type="button" className="btn btn-secondary w-fit" onClick={() => router.push("/tasks")}>
            <ArrowLeft size={16} strokeWidth={1.75} />
            Back to Task List
          </button>
        </div>
      </div>
    );
  }

  // Keyed on task.id: if this page is ever reused for a different id
  // without a full unmount, TaskDetailBody's local edit-form state
  // (initialized straight from props, no effect) resets along with it.
  return <TaskDetailBody key={data.task.id} task={data.task} history={data.history} user={user} />;
}

function TaskDetailBody({
  task,
  history,
  user,
}: {
  task: TaskDetail;
  history: TaskHistoryEntry[];
  user: ProfileResponse | null;
}) {
  const router = useRouter();
  const updateStatus = useUpdateTaskStatus(task.id);
  const updateDetails = useUpdateTaskDetails(task.id);
  const resubmit = useResubmitTask(task.id);
  const deleteTask = useDeleteTask(task.id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [durationValue, setDurationValue] = useState(task.duration_value);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(task.duration_unit);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.id === task.assignee_id;
  const isCreator = user?.id === task.created_by;
  const isAdmin = user?.role === "admin";
  const isEditableStatus = task.approval_status === "pending_approval" || task.approval_status === "needs_changes";
  const canEdit = isOwner && isEditableStatus;
  const canResubmit = isOwner && task.approval_status === "needs_changes";
  // Delete backs DELETE /tasks/:id (services/tasks.go Delete): the
  // *creator* — not necessarily the assignee — while still editable, or an
  // admin at any time.
  const canDelete = (isCreator && isEditableStatus) || isAdmin;
  const isOverdue = !!task.overdue_since && task.work_status !== "done";

  async function handleDelete() {
    await deleteTask.mutateAsync();
    router.push("/tasks");
  }

  async function handleSaveEdit() {
    await updateDetails.mutateAsync({
      title: title.trim(),
      description: description.trim() || null,
      duration_value: durationValue,
      duration_unit: durationUnit,
    });
    setEditing(false);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <button
        type="button"
        onClick={() => router.push("/tasks")}
        className="flex w-fit items-center gap-1.5 text-sm text-muted"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <ArrowLeft size={15} strokeWidth={1.75} />
        Task List
      </button>

      <div className="card gap-5" style={{ padding: 28 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {editing ? (
            <input className="input" style={{ fontSize: 20, fontWeight: 700 }} value={title} onChange={(e) => setTitle(e.target.value)} />
          ) : (
            <h1 style={{ margin: 0 }}>{task.title}</h1>
          )}
          {canEdit && !editing && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              <Pencil size={14} strokeWidth={1.75} />
              Edit
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ApprovalTag status={task.approval_status} />
          <WorkTag status={task.work_status} />
          <OverdueFlag isOverdue={isOverdue} />
        </div>

        {editing ? (
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        ) : (
          task.description && <p className="text-sm" style={{ color: "var(--color-text-muted)", margin: 0 }}>{task.description}</p>
        )}

        {task.approval_status === "needs_changes" && task.approval_note && (
          <div
            className="flex flex-col gap-1"
            style={{ background: "var(--st-changes-bg)", borderRadius: "var(--radius-md)", padding: "12px 16px", borderLeft: "3px solid var(--st-changes)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--st-changes)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Sent back — note from Admin
            </span>
            <span className="text-sm">{task.approval_note}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Duration">
            {editing ? (
              <div className="flex gap-2">
                <input type="number" min={1} className="input" style={{ width: 70 }} value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} />
                <select className="input" style={{ width: 100 }} value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            ) : (
              formatDuration(task.duration_value, task.duration_unit)
            )}
          </Field>
          <Field label={task.due_date ? "Due date" : "Status"} valueColor={isOverdue ? "var(--st-over)" : undefined}>
            {task.due_date ? formatDate(task.due_date) : "Awaiting approval"}
          </Field>
          <Field label="Work status">
            <select
              className="input"
              style={{ minHeight: 36, fontSize: 13.5 }}
              value={task.work_status}
              disabled={!(isOwner || user?.role === "admin") || updateStatus.isPending}
              onChange={(e) => updateStatus.mutate({ work_status: e.target.value as WorkStatus })}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 20 }}>
          {canResubmit && (
            <button type="button" className="btn btn-primary" disabled={resubmit.isPending} onClick={() => resubmit.mutate()}>
              {resubmit.isPending ? "Resubmitting…" : "Resubmit"}
            </button>
          )}
          {editing && (
            <>
              <button type="button" className="btn btn-primary" disabled={updateDetails.isPending} onClick={handleSaveEdit}>
                {updateDetails.isPending ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          )}
          {canDelete && !editing && (
            <button type="button" className="btn btn-danger ml-auto" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} strokeWidth={1.75} />
              Delete
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="dialog-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Delete this task?</div>
            <div className="dialog-body">
              &ldquo;{task.title}&rdquo; will be removed from your task list. This can&apos;t be undone from here.
            </div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleteTask.isPending}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleteTask.isPending}>
                {deleteTask.isPending ? "Deleting…" : "Delete task"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card gap-4" style={{ padding: 28 }}>
        <span className="card-kicker">History</span>
        <div className="flex flex-col gap-4">
          {history.map((h, i) => (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center" style={{ flex: "none" }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: EVENT_COLORS[h.event_type],
                    marginTop: 4,
                    flex: "none",
                  }}
                />
                {i < history.length - 1 && <span style={{ width: 1.5, flex: 1, background: "var(--color-border)", marginTop: 4 }} />}
              </div>
              <div className="flex flex-col gap-0.5 pb-1">
                <span className="text-sm font-semibold">
                  {EVENT_LABELS[h.event_type]} <span className="text-muted font-normal">· {h.actor_id === user?.id ? "You" : "Admin"}</span>
                </span>
                {h.note && <span className="text-sm text-muted">{h.note}</span>}
                <span className="text-xs text-muted">{formatDateTime(h.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, valueColor }: { label: string; children: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-3" style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-md)" }}>
      <span className="text-xs font-semibold text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span className="font-bold" style={{ fontSize: 16, color: valueColor }}>
        {children}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="card gap-4" style={{ padding: 28 }}>
        <div className="sk" style={{ width: "50%", height: 26 }} />
        <div className="sk" style={{ width: "30%", height: 16 }} />
        <div className="sk" style={{ width: "100%", height: 80 }} />
      </div>
    </div>
  );
}
