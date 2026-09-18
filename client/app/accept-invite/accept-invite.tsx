'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

type Phase = 'idle' | 'working' | 'success' | 'error' | 'needsAuth';

export function AcceptInvite() {
  const params = useSearchParams();
  const queryToken = params.get('token');

  // A token in the URL (from a clickable link) auto-accepts; otherwise the user
  // pastes the token from their invitation email.
  const [phase, setPhase] = useState<Phase>(queryToken ? 'working' : 'idle');
  const [tokenInput, setTokenInput] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [orgName, setOrgName] = useState('');
  const [message, setMessage] = useState(GENERIC_ERROR);
  const ran = useRef(false);

  const runAccept = useCallback((rawToken: string) => {
    const token = rawToken.trim();
    if (!token) return;

    // Accepting requires being signed in as the invited email. If there's no
    // session, offer sign-in OR create-account — the invitee may not have a
    // JusKel account yet. Either path returns here (with the token) to accept.
    if (!getToken()) {
      setPendingToken(token);
      setPhase('needsAuth');
      return;
    }

    setPhase('working');
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
        setMessage(e instanceof ApiError && e.message ? e.message : GENERIC_ERROR);
        setPhase('error');
      });
  }, []);

  // Auto-accept when a token arrives in the URL.
  useEffect(() => {
    if (ran.current || !queryToken) return;
    ran.current = true;
    runAccept(queryToken);
  }, [queryToken, runAccept]);

  let content;
  if (phase === 'success') {
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
  } else if (phase === 'working') {
    content = (
      <div className='flex flex-col items-center gap-3'>
        <Loader2 className='size-10 animate-spin text-primary' />
        <p className='text-body-lg text-gray-500'>Joining the team…</p>
      </div>
    );
  } else if (phase === 'error') {
    content = (
      <div className='flex flex-col items-center gap-5'>
        <CircleAlert className='size-14 text-destructive' />
        <div className='flex flex-col gap-2'>
          <p className='text-h4 font-semibold text-carbon-black'>
            We couldn&apos;t accept this invite
          </p>
          <p className='text-body-md text-gray-500'>{message}</p>
        </div>
        <button
          type='button'
          onClick={() => setPhase('idle')}
          className={PRIMARY}
        >
          Try another token
        </button>
        <Link
          href={ROUTES.sme.dashboard}
          className='text-body-sm text-gray-500 underline'
        >
          Back to dashboard
        </Link>
      </div>
    );
  } else if (phase === 'needsAuth') {
    // No session — the invitee signs in or creates an account, then returns
    // here (token preserved via ?next) to accept.
    const returnTo = encodeURIComponent(
      `${ROUTES.acceptInvite}?token=${pendingToken}`,
    );
    content = (
      <div className='flex w-full flex-col items-center gap-5'>
        <div className='flex flex-col gap-2'>
          <p className='text-h4 font-semibold text-carbon-black'>
            Sign in to accept your invitation
          </p>
          <p className='text-body-md text-gray-500'>
            Use the email address your invitation was sent to. New to JusKel?
            Create an account and you&apos;ll come straight back here to accept.
          </p>
        </div>
        <div className='flex w-full flex-col gap-3'>
          <Link
            href={`${ROUTES.auth.login}?next=${returnTo}`}
            className={cn(PRIMARY, 'w-full')}
          >
            Sign in
          </Link>
          <Link
            href={`${ROUTES.auth.signup}?next=${returnTo}`}
            className={cn(
              PRIMARY,
              'w-full border border-gray-300 bg-white text-carbon-black shadow-none hover:bg-muted hover:opacity-100',
            )}
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  } else {
    // idle — paste the token from the email.
    content = (
      <div className='flex w-full flex-col items-center gap-5'>
        <div className='flex flex-col gap-2'>
          <p className='text-h4 font-semibold text-carbon-black'>
            Accept your team invitation
          </p>
          <p className='text-body-md text-gray-500'>
            Paste the token from your invitation email to join the organisation.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAccept(tokenInput);
          }}
          className='flex w-full flex-col gap-4 text-left'
        >
          <div className='flex flex-col gap-2'>
            <label
              htmlFor='invite-token'
              className='text-body-sm font-medium text-carbon-black'
            >
              Invitation token
            </label>
            <input
              id='invite-token'
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder='Paste your invitation token'
              autoComplete='off'
              autoCapitalize='off'
              spellCheck={false}
              className='h-12 w-full rounded-lg border border-gray-300 px-3 font-mono text-body-sm text-carbon-black outline-none placeholder:font-sans placeholder:text-gray-400 focus:border-primary'
            />
          </div>
          <button
            type='submit'
            disabled={!tokenInput.trim()}
            className={cn(
              PRIMARY,
              'w-full',
              !tokenInput.trim() && 'pointer-events-none opacity-50',
            )}
          >
            Accept invitation
          </button>
        </form>
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
