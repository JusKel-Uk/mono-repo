import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import { Banknote, ExternalLink, Landmark, Shield } from 'lucide-react';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const metadata: Metadata = { title: 'Integrations' };

const INTEGRATIONS: {
  icon: LucideIcon;
  name: string;
  provider: string;
  desc: string;
}[] = [
  {
    icon: Landmark,
    name: 'Open Banking',
    provider: 'TrueLayer · FCA regulated',
    desc: 'Securely read business current-account transactions to verify inflows, outflows, and cash runway.',
  },
  {
    icon: Banknote,
    name: 'Xero',
    provider: 'Xero Accounting',
    desc: 'Pull P&L, balance sheet and outstanding invoices directly from your Xero account.',
  },
  {
    icon: Banknote,
    name: 'QuickBooks',
    provider: 'Intuit QuickBooks Online',
    desc: 'Import financial statements and receivables from your QuickBooks company file.',
  },
];

export default function IntegrationsPage() {
  return (
    <DashboardShell
      title='Connected accounts'
      subtitle='Link your bank and accounting tools to auto-populate Banking Intelligence and Financial Intelligence.'
    >
      <div className='grid gap-4 md:grid-cols-3'>
        {INTEGRATIONS.map(({ icon: Icon, name, provider, desc }) => (
          <div
            key={name}
            className='flex flex-col gap-4 rounded-lg border border-gray-300 bg-white p-4'
          >
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span className='flex size-8 shrink-0 items-center justify-center rounded bg-gray-200'>
                  <Icon className='size-5 text-carbon-black' />
                </span>
                <div className='flex flex-col gap-0.5'>
                  <p className='text-body-md font-semibold text-carbon-black'>
                    {name}
                  </p>
                  <p className='text-label-md text-gray-500'>{provider}</p>
                </div>
              </div>
              <span className='inline-flex h-6 shrink-0 items-center rounded-full bg-gray-200 px-3 text-label-sm font-medium text-gray-700'>
                Not connected
              </span>
            </div>
            <p className='text-body-sm text-carbon-black'>{desc}</p>
            <button
              type='button'
              className='inline-flex h-7 w-fit items-center gap-2 rounded bg-primary px-5 text-label-sm font-medium text-mineral-white shadow-xs transition-opacity hover:opacity-90'
            >
              Connect
              <ExternalLink className='size-3' />
            </button>
          </div>
        ))}
      </div>

      <div className='flex gap-3 rounded-2xl border border-abyssal/50 bg-abyssal p-6 text-mineral-white'>
        <Shield className='size-6 shrink-0' />
        <div className='flex flex-col gap-1'>
          <p className='text-h6 font-semibold'>Read-only, revoke any time</p>
          <p className='text-body-md'>
            We use FCA-regulated Open Banking (TrueLayer) and OAuth for
            accounting apps. JusKel never sees your login credentials and cannot
            move your money.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
