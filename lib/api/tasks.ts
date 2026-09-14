import { apiFetch } from "./client";
import type {
  CreateTaskRequest,
  ListTasksParams,
  ListTasksResult,
  TaskDetailResult,
  TaskResponse,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./types";

export function listTasks(params: ListTasksParams) {
  return apiFetch<ListTasksResult>("/tasks", { query: params });
}

export function getTask(id: string) {
  return apiFetch<TaskDetailResult>(`/tasks/${id}`);
}

export function createTask(input: CreateTaskRequest) {
  return apiFetch<TaskResponse>("/tasks/create", { method: "POST", body: input });
}

export function updateTaskDetails(id: string, input: UpdateTaskInput) {
  return apiFetch<TaskDetailResult["task"]>(`/tasks/${id}`, { method: "PATCH", body: input });
}

export function updateTaskStatus(id: string, input: UpdateTaskStatusInput) {
  return apiFetch<TaskDetailResult["task"]>(`/tasks/${id}/status`, { method: "PATCH", body: input });
}

export function resubmitTask(id: string) {
  return apiFetch<{ submit: string }>(`/tasks/${id}/resubmit`, { method: "POST" });
}

export function deleteTask(id: string) {
  return apiFetch<{ delete: string }>(`/tasks/${id}`, { method: "DELETE" });
}
