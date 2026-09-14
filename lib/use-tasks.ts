import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api/tasks";
import type {
  CreateTaskRequest,
  ListTasksParams,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./api/types";

export function useTasks(params: ListTasksParams) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => api.listTasks(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => api.getTask(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskRequest) => api.createTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTaskStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskStatusInput) => api.updateTaskStatus(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskDetails(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => api.updateTaskDetails(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useResubmitTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resubmitTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteTask(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
