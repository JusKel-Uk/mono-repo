'use client';

import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid refetch storms during SSR hydration.
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // Server: always a fresh client per request.
  if (isServer) return makeQueryClient();
  // Browser: reuse a singleton so state survives re-renders / Suspense.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
