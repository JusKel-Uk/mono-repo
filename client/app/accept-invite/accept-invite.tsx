'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleAlert, CircleCheck, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { ApiError, getToken } from '@/lib/api/client';
import { acceptInvite, setCurrentOrganisation } from '@/lib/api/settings';
import { JusKelLogo } from '@/components/brand/juskel-logo';

const PRIMARY =
  'inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 text-base font-semibold text-white shadow-xs transition-opacity hover:opacity-90';

const GENERIC_ERROR =
  'This invite is invalid, expired, already used, or for a different email address.';

export function AcceptInvite() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  // State only changes in the async callbacks below (no sync setState in the
  // effect); the missing-token case is handled during render.
  const [phase, setPhase] = useState<'working' | 'success' | 'error'>(
    'working',
  );
  const [orgName, setOrgName] = useState('');
  const [message, setMessage] = useState(GENERIC_ERROR);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;

    // Not signed in → sign in first, then return here to accept.
    if (!getToken()) {
      router.replace(
        `${ROUTES.auth.login}?next=${encodeURIComponent(
          `${ROUTES.acceptInvite}?token=${token}`,
        )}`,
      );
      return;
    }

    acceptInvite(token)
      .then(async (res) => {
        // Switch into the new org (best-effort; single-org users don't need it).
        try {
          await setCurrentOrganisation(res.organisationId);
        } catch {
          /* non-fatal */
        }
        setOrgName(res.organisationName);
        setPhase('success');
      })
      .catch((e) => {
        if (e instanceof ApiError && e.message) setMessage(e.message);
        setPhase('error');
      });
  }, [token, router]);

  let content;
  if (!token || phase === 'error') {
    content = (
      <div className='flex flex-col items-center gap-5'>
        <CircleAlert className='size-14 text-destructive' />
        <div className='flex flex-col gap-2'>
          <p className='text-h4 font-semibold text-carbon-black'>
            We couldn&apos;t accept this invite
          </p>
          <p className='text-body-md text-gray-500'>
            {token ? message : 'This invite link is missing its token.'}
          </p>
        </div>
        <Link
          href={ROUTES.sme.dashboard}
          className={cn(
            PRIMARY,
            'border border-gray-300 bg-white text-carbon-black shadow-none',
          )}
        >
          Back to dashboard
        </Link>
      </div>
    );
  } else if (phase === 'success') {
    content = (
      <div className='flex flex-col items-center gap-5'>
        <CircleCheck className='size-14 text-success-600' />
        <div className='flex flex-col gap-2'>
          <p className='text-h4 font-semibold text-carbon-black'>
            You&apos;re in{orgName ? `, welcome to ${orgName}` : ''}
          </p>
          <p className='text-body-md text-gray-500'>
            Your account now has access to this organisation.
          </p>
        </div>
        <Link href={ROUTES.sme.dashboard} className={PRIMARY}>
          Go to dashboard
        </Link>
      </div>
    );
  } else {
    content = (
      <div className='flex flex-col items-center gap-3'>
        <Loader2 className='size-10 animate-spin text-primary' />
        <p className='text-body-lg text-gray-500'>Joining the team…</p>
      </div>
    );
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-mineral-white p-6'>
      <div className='flex w-full max-w-120 flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-8 text-center'>
        <JusKelLogo className='text-carbon-black' />
        {content}
      </div>
    </main>
  );
}
