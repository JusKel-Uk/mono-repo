'use client';

import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CARD = 'rounded-2xl border border-gray-200 bg-white';
const COLS =
  'grid grid-cols-[1.7fr_0.9fr_1fr_0.9fr_1.3fr_0.6fr] items-center gap-4';

/* ---- static placeholder data (backend later) ---- */

const STATS = [
  { label: 'PENDING REVIEW', value: '0' },
  { label: 'ACCEPTED', value: '4' },
  { label: 'REJECTED', value: '1' },
  { label: 'TOTAL', value: '5' },
];

const DOC_TYPES = ['Financial', 'Environmental', 'Social', 'Governance'];

type Status = 'Accepted' | 'Rejected' | 'Pending';
type Reliability = 'High' | 'Medium' | 'Low';

const DOCUMENTS: {
  name: string;
  size: string;
  type: string;
  uploaded: string;
  status: Status;
  reliability: Reliability;
}[] = [
  {
    name: 'FY25 Statutory Accounts.pdf',
    size: '2.1 MB',
    type: 'Financial',
    uploaded: 'July 27, 2026',
    status: 'Accepted',
    reliability: 'High',
  },
  {
    name: 'Energy bills 2026 (bundle).zip',
    size: '5.8 MB',
    type: 'Environmental',
    uploaded: 'July 27, 2026',
    status: 'Accepted',
    reliability: 'High',
  },
  {
    name: 'Living Wage certificate.pdf',
    size: '480 KB',
    type: 'Social',
    uploaded: 'June 15, 2026',
    status: 'Accepted',
    reliability: 'Medium',
  },
  {
    name: 'Energy Usage Report.pdf',
    size: '1.5 MB',
    type: 'Financial',
    uploaded: 'July 27, 2026',
    status: 'Rejected',
    reliability: 'Low',
  },
];

const STATUS_CLS: Record<Status, string> = {
  Accepted: 'bg-success-50 text-success-600',
  Rejected: 'bg-error-50 text-error-600',
  Pending: 'bg-warning-50 text-warning-600',
};

const DOT: Record<Reliability, string> = {
  High: 'bg-success-600',
  Medium: 'bg-warning-600',
  Low: 'bg-error-600',
};

export function EvidenceReviewed() {
  const [file, setFile] = useState<string | null>(null);
  const [docType, setDocType] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const browse = () => inputRef.current?.click();

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f.name);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f.name);
  };

  const save = () => {
    toast.success('Document saved', {
      description: `${file} has been added to your evidence.`,
    });
    setFile(null);
    setDocType('');
  };

  return (
    <DashboardShell
      title='Documents & evidence'
      subtitle='Upload the evidence behind your ESG claims, for example, your certificates, policies, bills, and reports.'
      action={
        <button
          type='button'
          onClick={browse}
          className='inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 text-body-md font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90'
        >
          <Upload className='size-5' />
          Upload document
        </button>
      }
    >
      <input
        ref={inputRef}
        type='file'
        accept='.pdf,.docx,.jpg,.jpeg,.png,.zip'
        className='hidden'
        onChange={onInput}
      />

      {/* Mobile upload button (the header action is desktop-only). */}
      <div>
        <button
          type='button'
          onClick={browse}
          className='inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-body-md font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90 lg:hidden'
        >
          <Upload className='size-5' />
          Upload document
        </button>
      </div>

      {/* Dropzone → upload form once a file is selected */}
      {file ? (
        <div className={cn(CARD, 'p-6')}>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-5 lg:flex-row lg:items-start'>
              <div className='flex flex-col gap-2 lg:w-80'>
                <label className='text-body-sm font-medium text-carbon-black'>
                  Document type <span className='text-error-600'>*</span>
                </label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className='h-12 w-full'>
                    <SelectValue placeholder='Select document type' />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-1 items-center gap-3 self-stretch rounded-lg bg-primary px-5 py-4 text-mineral-white lg:mt-7'>
                <CheckCircle2 className='size-5 shrink-0' />
                <span className='truncate text-body-md'>{file}</span>
              </div>
            </div>
            <button
              type='button'
              onClick={save}
              disabled={!docType}
              className='inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-lg bg-primary px-6 text-body-md font-semibold text-mineral-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:self-end'
            >
              Save document
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            CARD,
            'flex flex-col items-center gap-5 px-6 py-12 text-center',
          )}
        >
          <Upload className='size-8 text-carbon-black' strokeWidth={1.5} />
          <div className='flex flex-col gap-1'>
            <p className='text-h6 font-semibold text-carbon-black lg:text-h5'>
              Drop files here to upload
            </p>
            <p className='max-w-100 text-body-sm text-gray-500'>
              PDF, DOCX, JPG, PNG · up to 25 MB · encrypted and stored according
              to GDPR guidelines.
            </p>
          </div>
          <button
            type='button'
            onClick={browse}
            className='inline-flex h-11 items-center rounded-lg bg-primary px-5 text-body-sm font-semibold text-mineral-white transition-opacity hover:opacity-90'
          >
            Or upload files
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {STATS.map((s) => (
          <div key={s.label} className={cn(CARD, 'flex flex-col gap-3 p-5')}>
            <p className='text-label-md font-semibold text-gray-500'>
              {s.label}
            </p>
            <p className='text-h2 font-semibold text-carbon-black lg:text-[44px] lg:leading-14'>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Documents table */}
      <div className={cn(CARD, 'overflow-hidden')}>
        <div className='overflow-x-auto'>
          <div className='min-w-180'>
            <div className={cn(COLS, 'px-6 py-3 text-label-md text-gray-500')}>
              <span>DOCUMENT</span>
              <span>TYPE</span>
              <span>UPLOADED</span>
              <span>STATUS</span>
              <span>EVIDENCE RELIABILITY</span>
              <span className='text-right'>ACTIONS</span>
            </div>
            {DOCUMENTS.map((d) => (
              <div
                key={d.name}
                className={cn(COLS, 'border-t border-gray-200 px-6 py-4')}
              >
                <div className='flex items-center gap-3'>
                  <FileText className='size-5 shrink-0 text-gray-500' />
                  <div className='flex flex-col'>
                    <span className='text-body-sm font-medium text-carbon-black'>
                      {d.name}
                    </span>
                    <span className='text-label-md text-gray-500'>
                      {d.size}
                    </span>
                  </div>
                </div>
                <div>
                  <span className='inline-flex items-center rounded-full bg-primary px-3 py-1 text-label-md font-medium text-mineral-white'>
                    {d.type}
                  </span>
                </div>
                <span className='text-body-sm text-carbon-black'>
                  {d.uploaded}
                </span>
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-label-md font-medium',
                      STATUS_CLS[d.status],
                    )}
                  >
                    {d.status}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      DOT[d.reliability],
                    )}
                  />
                  <span className='text-body-sm text-carbon-black'>
                    {d.reliability}
                  </span>
                </div>
                <div className='flex justify-end'>
                  <button
                    type='button'
                    aria-label={`Download ${d.name}`}
                    className='rounded-lg p-1 text-carbon-black hover:bg-muted'
                  >
                    <Download className='size-5' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy footer */}
      <div className='flex items-center gap-3 rounded-2xl bg-abyssal p-5 text-mineral-white'>
        <ShieldCheck className='size-5 shrink-0 text-gray-300' />
        <p className='text-body-sm lg:text-body-md'>
          Your information and documents are protected and will not be shared
          with participating lenders or other external parties without your
          explicit authorisation.
        </p>
      </div>
    </DashboardShell>
  );
}
