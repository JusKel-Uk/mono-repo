'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api/client';

/** File types the backend accepts for evidence (PDF, DOC/DOCX, PNG, JPEG). */
const ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

type Attached = { evidenceId: string; fileName: string };
/** Adds a local object-URL so the just-picked file can be previewed in-session. */
type AttachedLocal = Attached & { url: string };

/**
 * Attach / remove a single evidence file. The upload + delete calls are passed
 * in so this works for any evidence endpoint (sustainability, funding, …).
 *
 * NOTE: the attached state is session-local — the backend has no list/GET for
 * evidence, so a file uploaded before a reload won't show as attached again.
 */
export function EvidenceAttach({
  attachLabel,
  hint,
  onUpload,
  onRemove,
}: {
  attachLabel: string;
  hint: string;
  onUpload: (file: File) => Promise<Attached>;
  onRemove: (evidenceId: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [attached, setAttached] = useState<AttachedLocal | null>(null);

  // Revoke the object URL when it's replaced or the component unmounts.
  useEffect(() => {
    const url = attached?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [attached?.url]);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    try {
      const res = await onUpload(file);
      setAttached({ ...res, url: URL.createObjectURL(file) });
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Could not upload the file. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!attached) return;
    setBusy(true);
    try {
      await onRemove(attached.evidenceId);
      setAttached(null);
    } catch {
      toast.error('Could not remove the file. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT}
        className='hidden'
        onChange={handlePick}
      />

      {attached ? (
        <span className='inline-flex h-7 items-center gap-2 rounded-lg bg-muted px-3 text-label-sm font-medium text-gray-700'>
          <a
            href={attached.url}
            target='_blank'
            rel='noopener noreferrer'
            title='View file'
            className='inline-flex items-center gap-2 hover:underline'
          >
            <Paperclip className='size-3' />
            <span className='max-w-40 truncate'>{attached.fileName}</span>
            <Eye className='size-3.5 shrink-0' />
          </a>
          <button
            type='button'
            onClick={handleRemove}
            disabled={busy}
            aria-label='Remove file'
            className='text-gray-500 hover:text-carbon-black disabled:opacity-60'
          >
            <X className='size-3.5' />
          </button>
        </span>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className='inline-flex h-7 items-center gap-2 rounded-lg bg-primary px-5 text-label-sm font-medium text-gray-200 shadow-xs transition-opacity hover:opacity-90 disabled:opacity-70'
        >
          {busy ? (
            <Loader2 className='size-3 animate-spin' />
          ) : (
            <Paperclip className='size-3' />
          )}
          {attachLabel}
        </button>
      )}

      {/* Justification has no backend yet — kept as a non-functional link. */}
      <button
        type='button'
        className='text-label-sm font-normal text-gray-700 underline hover:no-underline'
      >
        Or add a justification
      </button>
      <span className='ml-auto text-label-sm font-normal text-gray-700'>
        {hint}
      </span>
    </div>
  );
}
