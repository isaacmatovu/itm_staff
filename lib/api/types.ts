// Mirrors the Go DTOs verbatim (internal/models/models.go in the
// task-tracker backend). Field names and nullability are kept exact —
// don't "clean up" a name here without checking the backend struct first.

export type WorkStatus = "not_started" | "in_progress" | "done";
export type ApprovalStatus = "pending_approval" | "needs_changes" | "approved";
export type DurationUnit = "days" | "weeks";
export type TaskHistoryEventType =
  | "created"
  | "resubmitted"
  | "sent_back"
  | "approved"
  | "status_change"
  | "reassigned"
  | "comment";

export interface ProfileResponse {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: "staff" | "admin";
  totp_enabled: boolean;
}

// GET /tasks row shape (ListTasksForUserRow) — narrower than TaskDetail.
export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  due_date: string | null;
  // The worker's own authoritative overdue signal (MarkTasksOverdue) — same
  // field TaskDetail exposes, included here so list views don't have to
  // re-derive "overdue" from due_date themselves.
  overdue_since: string | null;
  created_at: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// GET /tasks envelope — handlers.listEnvelope, not the generic
// PaginatedResponse<T> (different field names: page/page_size/total, no
// nested "metadata").
export interface ListTasksResult {
  data: TaskListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  assignee_id: string;
  duration_value: number;
  duration_unit: DurationUnit;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  approval_note: string | null;
  due_date: string | null;
  approved_at: string | null;
  approved_by: string | null;
  overdue_since: string | null;
  last_overdue_alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  event_type: TaskHistoryEventType;
  actor_id: string;
  note: string | null;
  created_at: string;
}

export interface TaskDetailResult {
  task: TaskDetail;
  history: TaskHistoryEntry[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  assignee_id: string;
  duration_value: number;
  duration_unit: DurationUnit;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  assignee_id: string;
  duration_value: number;
  duration_unit: DurationUnit;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  due_date: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  duration_value?: number;
  duration_unit?: DurationUnit;
}

export interface UpdateTaskStatusInput {
  work_status: WorkStatus;
}

export interface ListTasksParams {
  page?: number;
  page_size?: number;
  work_status?: WorkStatus;
  approval_status?: ApprovalStatus;
  due_after?: string;
  due_before?: string;
  search?: string;
  // TS requires an explicit index signature to pass this as a fetch query
  // object (see lib/api/client.ts's RequestOptions.query) — every named
  // field above already satisfies it.
  [key: string]: string | number | undefined;
}

// The two 2FA endpoints return raw bodies (not the {success,data} envelope).
export interface TotpSetupResponse {
  qr_code_data_url: string;
  secret: string;
}
