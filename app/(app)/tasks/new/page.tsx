"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCreateTask } from "@/lib/use-tasks";
import { ApiError } from "@/lib/api/client";
import type { DurationUnit } from "@/lib/api/types";

// TT-05 — staff can only create tasks for themselves (assignee is locked to
// "self", per spec — the assignee picker is an Admin-only affordance this
// app doesn't have), so every task created here starts pending_approval.
export default function CreateTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationValue, setDurationValue] = useState(2);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [touched, setTouched] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; duration?: string }>({});

  useEffect(() => {
    if (!touched) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [touched]);

  function markTouched() {
    if (!touched) setTouched(true);
  }

  function handleCancel() {
    if (touched) setShowDiscard(true);
    else router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!durationValue || durationValue <= 0) nextErrors.duration = "Duration must be greater than zero.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user) return;

    try {
      const task = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        assignee_id: user.id,
        duration_value: durationValue,
        duration_unit: durationUnit,
      });
      router.push(`/tasks/${task.id}`);
    } catch {
      // surfaced via createTask.error below
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <div className="card-kicker">/tasks/new</div>
        <h1>Create Task</h1>
      </div>

      <form onSubmit={handleSubmit} onChange={markTouched} className="card flex-col gap-5">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Draft Q3 partner report" />
          {errors.title && <ErrorText>{errors.title}</ErrorText>}
        </div>

        <div className="field">
          <label htmlFor="description">Description (optional)</label>
          <textarea id="description" className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Add any useful context…" />
        </div>

        <div className="field">
          <label htmlFor="duration">Duration</label>
          <div className="flex flex-wrap gap-2">
            <input
              id="duration"
              type="number"
              min={1}
              className="input"
              style={{ width: 90 }}
              value={durationValue}
              onChange={(e) => setDurationValue(Number(e.target.value))}
            />
            <select className="input min-w-0 flex-1" style={{ maxWidth: 140 }} value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
          {errors.duration && <ErrorText>{errors.duration}</ErrorText>}
          <p className="mt-2 text-xs text-muted">This is an estimate, not a fixed date — the due date is set once this is approved.</p>
        </div>

        {createTask.isError && (
          <div className="chip w-fit" style={{ color: "var(--st-changes)", background: "var(--st-changes-bg)" }}>
            {createTask.error instanceof ApiError ? createTask.error.message : "Something went wrong."}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--color-border)", marginTop: 4, paddingTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={createTask.isPending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={createTask.isPending}>
            {createTask.isPending ? "Submitting…" : "Submit for Approval"}
          </button>
        </div>
      </form>

      {showDiscard && (
        <div className="dialog-backdrop" onClick={() => setShowDiscard(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Discard changes?</div>
            <div className="dialog-body">You&apos;ve made changes to this task that haven&apos;t been submitted.</div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDiscard(false)}>
                Keep editing
              </button>
              <button type="button" className="btn btn-danger" onClick={() => router.push("/")}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs" style={{ color: "var(--st-changes)" }}>
      {children}
    </p>
  );
}
