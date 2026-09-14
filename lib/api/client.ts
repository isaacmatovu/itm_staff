// Thin fetch wrapper around the Go API. Every authenticated call rides on
// httpOnly cookies (itm_session / itm_refresh) — credentials: 'include' on
// every request, cookie handling itself is entirely the browser's job.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  code: number;
  details?: unknown;

  constructor(code: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: number; message: string; details?: unknown };
}

let refreshInFlight: Promise<boolean> | null = null;

// Every authenticated route (tasks, profile) answers in the
// {success, data | error} envelope (utils.SuccessResponse / ErrorResponse
// on the Go side). The 2FA endpoints are the one exception — see rawFetch.
async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok || !body || body.success === false) {
    const err = body?.error;
    throw new ApiError(err?.code ?? res.status, err?.message ?? "Request failed", err?.details);
  }

  return body.data as T;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

// Wrapped {success,data} response, with one silent refresh-and-retry on 401.
export async function apiFetch<T>(path: string, options: RequestOptions = {}, _retried = false): Promise<T> {
  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, options, true);
  }

  return unwrap<T>(res);
}

// Raw (unwrapped) response — the 2FA setup/verify endpoints return their
// body directly on success, but still use the {success:false,error} shape
// on failure, so errors still need the same handling as unwrap() gives.
export async function apiFetchRaw<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || (body && body.success === false)) {
    const err = body?.error;
    throw new ApiError(err?.code ?? res.status, err?.message ?? "Request failed", err?.details);
  }

  return body as T;
}

export { API_URL };
