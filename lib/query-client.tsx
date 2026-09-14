"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "./api/client";

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: (failureCount, error) => {
              // 401s are handled by apiFetch's own refresh-and-retry; a 401
              // that still reaches here means the session is really gone —
              // don't keep hammering the API for it.
              if (error instanceof ApiError && (error.code === 401 || error.code === 403 || error.code === 404)) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
