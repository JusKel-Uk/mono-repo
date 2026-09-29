'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  Inbox,
  Pencil,
  Plus,
  Search,
  Trash2,
  Unlink,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { LenderShell } from '@/components/lender/lender-shell';
import { LenderBadge } from '@/components/lender/lender-badge';
import { LenderDisclaimer } from '@/components/lender/lender-disclaimer';

/* ---------------------------------------------------------------- demo data */
// No funding-products backend yet — mirrors the Figma "populated" reference.

export type Product = {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'draft';
  amount: string;
  criteria: string;
  updated: string;
};

const NO_PRODUCTS: Product[] = [];

export const PRODUCTS: Product[] = [
  {
    id: 'clean-growth-financing',
    name: 'Clean Growth Financing',
    type: 'Green Loan',
    status: 'active',
    amount: '£25,000 – £250,000',
    criteria:
      'All sectors · Preferred SME stage (Early (0–2 years trading)) · Readiness (Ready) · SFS score (61 and above)',
    updated: 'Updated August 12, 2026, 15:45',
  },
  {
    id: 'energy-efficiency-asset-finance',
    name: 'Energy Efficiency Asset Finance',
    type: 'Asset Finance',
    status: 'active',
    amount: '£10,000 – £250,000',
    criteria:
      'All sectors · Preferred SME stage (not selected) · Readiness (not selected) · SFS score (not selected)',
    updated: 'Updated August 15, 2026, 13:09',
  },
  {
    id: 'sme-working-capital-facility',
    name: 'SME Working Capital Facility',
    type: 'Revolving Credit',
    status: 'draft',
    amount: '£25,000 – £150,000',
    criteria:
      'Retail, Food & drink, Professional services · Preferred SME stage (Growing (3–5 years trading)) · Readiness (Ready) · SFS score (81 and above)',
    updated: 'Updated August 15, 2026, 12:59',
  },
];

/* ------------------------------------------------------------- primitives */

function IconAction({
  label,
  href,
  danger,
  children,
}: {
  label: string;
  href?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const cls = `rounded-md p-0.5 ${danger ? 'text-error-600 hover:text-error-700' : 'text-gray-500 hover:text-carbon-black'}`;
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type='button' aria-label={label} className={cls}>
      {children}
    </button>
  );
}

function ProductCard({ product }: { product: Product }) {
  const editHref = `${ROUTES.lender.fundingProducts}/${product.id}`;
  return (
    <div className='flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-7'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 flex-col gap-2'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-h4 font-semibold text-carbon-black'>
              {product.name}
            </span>
            <LenderBadge tone='type'>{product.type}</LenderBadge>
            {product.status === 'active' ? (
              <LenderBadge tone='active'>ACTIVE</LenderBadge>
            ) : (
              <LenderBadge tone='neutral'>DRAFT</LenderBadge>
            )}
          </div>
          <p className='text-body-lg text-gray-500'>{product.amount}</p>
          <p className='text-body-md text-gray-500'>{product.criteria}</p>
          <p className='text-body-md text-gray-500'>{product.updated}</p>
        </div>
        <div className='flex shrink-0 items-center gap-4'>
          <IconAction label={`Edit ${product.name}`} href={editHref}>
            <Pencil className='size-6' />
          </IconAction>
          {product.status === 'draft' && (
            <IconAction label={`Delete ${product.name}`} danger>
              <Trash2 className='size-6' />
            </IconAction>
          )}
        </div>
      </div>
      {product.status === 'active' && (
        <button
          type='button'
          className='inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-body-sm font-semibold text-mineral-white shadow-xs'
        >
          <Unlink className='size-5' />
          Deactivate product
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className='flex flex-col items-center gap-5 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center'>
      <Inbox className='size-12 text-gray-500' />
      <div className='flex max-w-137 flex-col gap-2'>
        <p className='text-h3 font-semibold text-carbon-black'>
          No funding products yet
        </p>
        <p className='text-body-lg text-gray-500'>
          Add a funding product to define what you fund and which SMEs you want
          to be matched with. You can save a product as a draft before
          activating it.
        </p>
      </div>
      <Link
        href={`${ROUTES.lender.fundingProducts}/new`}
        className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
      >
        <Plus className='size-5' />
        Add a funding product
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------- view */

/**
 * Funding products list. Search + status filter run client-side over demo data
 * (no products endpoint yet). Append `?state=empty` to preview the empty state.
 */
export function LenderFundingProductsView() {
  const params = useSearchParams();
  const mounted = useMounted();
  const userType = useLenderOnboardingStore((s) => s.userType);
  const empty = params.get('state') === 'empty' || (mounted && userType === 'new');
  const source = empty ? NO_PRODUCTS : PRODUCTS;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'draft'>('all');

  const filtered = useMemo(
    () =>
      source.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          p.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [source, query, status],
  );

  return (
    <LenderShell
      title='Funding products'
      subtitle='Define what you fund. Matching runs only against active products.'
      action={
        <Link
          href={`${ROUTES.lender.fundingProducts}/new`}
          className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
        >
          <Plus className='size-5' />
          Add product
        </Link>
      }
    >
      {source.length === 0 ? (
        <EmptyState />
      ) : (
        <div className='flex flex-col gap-6'>
          {/* Toolbar */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='relative flex-1'>
              <Search className='pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-gray-500' />
              <input
                type='search'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search product'
                aria-label='Search product'
                className='h-14 w-full rounded-xl border border-gray-300 bg-white pl-13 pr-4 text-body-md text-carbon-black placeholder:text-gray-500 focus:border-teal-charcoal focus:outline-none'
              />
            </div>
            <div className='relative sm:w-80'>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'all' | 'active' | 'draft')
                }
                aria-label='Filter by status'
                className='h-14 w-full appearance-none rounded-xl border border-gray-300 bg-primary px-4 pr-11 text-body-md text-mineral-white focus:outline-none'
              >
                <option value='all'>All statuses</option>
                <option value='active'>Active</option>
                <option value='draft'>Draft</option>
              </select>
              <ChevronDown className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-mineral-white' />
            </div>
          </div>

          {/* Product list */}
          {filtered.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-body-md text-gray-500'>
              No products match your search.
            </p>
          ) : (
            <div className='flex flex-col gap-3'>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <LenderDisclaimer />
        </div>
      )}
    </LenderShell>
  );
}
