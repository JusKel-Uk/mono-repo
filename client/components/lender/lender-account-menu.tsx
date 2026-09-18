'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import { lenderSignOut } from '@/lib/api/lender-auth';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import { Button } from '@/components/ui/button';

/** Signed-in lender identity + sign-out, shown in the portal header. */
export function LenderAccountMenu() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useLenderMe();

  const signOut = () => {
    lenderSignOut();
    qc.clear();
    router.push(ROUTES.lender.login);
  };

  return (
    <div className='flex items-center gap-4'>
      {!isLoading && data && (
        <div className='hidden text-right leading-tight sm:block'>
          <p className='text-sm font-medium text-foreground'>
            {data.firstName} {data.lastName}
          </p>
          <p className='text-xs text-muted-foreground'>
            {data.organisation.name}
          </p>
        </div>
      )}
      <Button
        variant='outline'
        size='sm'
        onClick={signOut}
        className='rounded-lg'
      >
        Sign out
      </Button>
    </div>
  );
}
