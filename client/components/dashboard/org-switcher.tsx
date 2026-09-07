'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { getMe } from '@/lib/api/auth';
import {
  getOrganisations,
  setCurrentOrganisation,
  OrganisationRole,
  type OrganisationSummary,
} from '@/lib/api/settings';

// Shared with the Settings page + Team tab so the cache is one source of truth.
const ORG_KEY = ['settings', 'organisations'] as const;
const ME_KEY = ['settings', 'me'] as const;

const ROLE_LABEL: Record<OrganisationRole, string> = {
  [OrganisationRole.Owner]: 'Owner',
  [OrganisationRole.Admin]: 'Admin',
  [OrganisationRole.Contributor]: 'Contributor',
  [OrganisationRole.Viewer]: 'Viewer',
};

/**
 * Organisation switcher for the dashboard sidebar's context block. Shows the
 * active org + the signed-in user's role in it; when the user belongs to more
 * than one org it becomes a dropdown that switches the active workspace.
 */
export function OrgSwitcher() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: orgs } = useQuery({ queryKey: ORG_KEY, queryFn: getOrganisations });
  const { data: me } = useQuery({ queryKey: ME_KEY, queryFn: getMe });

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = orgs?.find((o) => o.isCurrent) ?? orgs?.[0];
  const multi = (orgs?.length ?? 0) > 1;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const switchOrg = useMutation({
    // Best-effort server switch — optimistically flips `isCurrent` so org-scoped
    // views (Team, Privacy) re-derive immediately. (The dev extra org has no
    // server record, so the PUT is allowed to fail.)
    mutationFn: (orgId: string) => setCurrentOrganisation(orgId).catch(() => {}),
    onMutate: (orgId) => {
      qc.setQueryData<OrganisationSummary[]>(ORG_KEY, (prev) =>
        prev?.map((o) => ({ ...o, isCurrent: o.id === orgId })),
      );
    },
  });

  const pick = (o: OrganisationSummary) => {
    setOpen(false);
    if (o.isCurrent) return;
    switchOrg.mutate(o.id);
    // Land on the dashboard so the app reflects the newly active org's context.
    router.push(ROUTES.sme.dashboard);
  };

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => multi && setOpen((v) => !v)}
        disabled={!multi}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg text-left transition-opacity',
          multi ? 'hover:opacity-80' : 'cursor-default',
        )}
      >
        <Building2 className='size-4.5 shrink-0 text-gray-600' />
        <span className='flex-1 truncate text-body-sm font-medium text-gray-600'>
          {current?.name ?? '—'}
        </span>
        {multi && (
          <ChevronsUpDown className='size-4 shrink-0 text-gray-400' />
        )}
      </button>

      <div className='mt-3 flex items-center gap-2'>
        <span className='flex h-7 shrink-0 items-center rounded-full bg-gray-200 px-3 text-label-md font-semibold text-gray-600'>
          {current ? ROLE_LABEL[current.role].toUpperCase() : '—'}
        </span>
        <span className='truncate text-body-sm text-gray-600'>
          {me?.jobTitle || 'SME team member'}
        </span>
      </div>

      {open && multi && orgs && (
        <div className='absolute inset-x-0 top-[calc(100%+8px)] z-20 flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-lg'>
          {orgs.map((o) => (
            <button
              key={o.id}
              type='button'
              onClick={() => pick(o)}
              className='flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted'
            >
              <Building2 className='size-4 shrink-0 text-gray-500' />
              <span className='flex-1 truncate text-body-sm font-medium text-carbon-black'>
                {o.name}
              </span>
              <span className='shrink-0 text-label-sm text-gray-500'>
                {ROLE_LABEL[o.role]}
              </span>
              {o.isCurrent && (
                <Check className='size-4 shrink-0 text-primary' />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
