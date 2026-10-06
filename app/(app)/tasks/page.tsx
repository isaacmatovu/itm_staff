"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTasks } from "@/lib/use-tasks";
import { TaskRow } from "@/components/task-row";
import { Plus, Search, Inbox } from "lucide-react";
import type { ApprovalStatus, WorkStatus } from "@/lib/api/types";

const PAGE_SIZE = 20;

type SortKey = "title" | "due_date" | "work_status";

// TT-04 — a filterable, searchable working list of the caller's own tasks,
// distinct from the summarised dashboard. Sorting is applied client-side
// to the current page — the API has no sort param.
export default function TaskListPage() {
  const [page, setPage] = useState(1);
  const [workStatus, setWorkStatus] = useState<WorkStatus | "">("");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | "">("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due_date");

  const { data, isLoading } = useTasks({
    page,
    page_size: PAGE_SIZE,
    work_status: workStatus || undefined,
    approval_status: approvalStatus || undefined,
    search: search || undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const sorted = useMemo(() => {
    const tasks = data?.data ?? [];
    const copy = [...tasks];
    copy.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "work_status")
        return a.work_status.localeCompare(b.work_status);
      // due_date: nulls (awaiting approval) sort last
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    return copy;
  }, [data, sortKey]);

  function clearFilters() {
    setWorkStatus("");
    setApprovalStatus("");
    setSearch("");
    setPage(1);
  }

  const hasFilters = workStatus || approvalStatus || search;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="card-kicker">/tasks</div>
          <h1>Task List</h1>
        </div>
        <Link href="/tasks/new" className="btn btn-primary">
          <Plus size={17} strokeWidth={2} />
          Create Task
        </Link>
      </div>

      <div
        className="card flex-wrap items-center gap-3"
        style={{ flexDirection: "row", padding: "14px 16px" }}
      >
        <div className="relative min-w-35 flex-1 sm:min-w-50">
          <Search
            size={16}
            strokeWidth={1.75}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Search by title…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input"
          style={{ maxWidth: 170, flex: "none" }}
          value={workStatus}
          onChange={(e) => {
            setWorkStatus(e.target.value as WorkStatus | "");
            setPage(1);
          }}
        >
          <option value="">All work statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          className="input"
          style={{ maxWidth: 180, flex: "none" }}
          value={approvalStatus}
          onChange={(e) => {
            setApprovalStatus(e.target.value as ApprovalStatus | "");
            setPage(1);
          }}
        >
          <option value="">All approval statuses</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="needs_changes">Needs Changes</option>
          <option value="approved">Approved</option>
        </select>
        <select
          className="input"
          style={{ maxWidth: 150, flex: "none" }}
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="due_date">Sort: Due date</option>
          <option value="title">Sort: Title</option>
          <option value="work_status">Sort: Status</option>
        </select>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState hasFilters={!!hasFilters} onClear={clearFilters} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-sm text-muted">
            Page {page} of {totalPages} · {data?.total ?? 0} tasks
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div
      className="card items-center gap-3 text-center"
      style={{ padding: "48px 24px" }}
    >
      <span
        className="icon-chip"
        style={{
          width: 52,
          height: 52,
          background: "var(--color-surface-2)",
          color: "var(--color-text-muted)",
        }}
      >
        <Inbox size={24} strokeWidth={1.75} />
      </span>
      <div className="card-title">
        {hasFilters ? "No tasks match these filters" : "No tasks yet"}
      </div>
      {hasFilters && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClear}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card">
          <div className="sk" style={{ width: "60%", height: 16 }} />
        </div>
      ))}
    </div>
  );
}
