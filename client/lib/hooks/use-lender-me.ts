import { useQuery } from '@tanstack/react-query';

import { lenderGetMe } from '@/lib/api/lender-auth';

/** The signed-in lender + their organisation (GET /lender/me). */
export function useLenderMe() {
  return useQuery({
    queryKey: ['lender-me'],
    queryFn: lenderGetMe,
    retry: false,
    staleTime: 60_000,
  });
}
