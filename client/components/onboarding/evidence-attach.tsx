'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

import { ApiError, type BlobResponse } from '@/lib/api/client';

/** File types the backend accepts for evidence (PDF, DOC/DOCX, PNG, JPEG). */
const ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

type Attached = { evidenceId: string; fileName: string };
/** `url` is the in-session object-URL for a just-picked file; rehydrated files
 *  from the server have none and preview via `onView` instead. */
type AttachedLocal = Attached & { url?: string };

/**
 * Attach / remove a single evidence file. The upload + delete calls are passed
 * in so this works for any evidence endpoint (sustainability, funding, …).
 *
 * View pulls the file from the private download endpoint (`onView`) — an
 * authenticated blob, so it works for files the server holds, not just the
 * in-session pick. Falls back to the local object-URL when no `onView` given.
 *
 * NOTE: the attached state is still session-local — we don't yet rehydrate
 * previously-uploaded evidence from the profile GET on reload.
 */
export function EvidenceAttach({
  attachLabel,
  hint,
  onUpload,
  onRemove,
  onView,
  initial,
}: {
  attachLabel: string;
  hint: string;
  onUpload: (file: File) => Promise<Attached>;
  onRemove: (evidenceId: string) => Promise<void>;
  /** Fetch the file (authenticated) for inline preview. */
  onView?: (evidenceId: string) => Promise<BlobResponse>;
  /** A file already on the server (from the profile GET) to show on load. */
  initial?: Attached;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [attached, setAttached] = useState<AttachedLocal | null>(null);

  // Seed from server-held evidence once it arrives (profile GET is async).
  // Guarded so a fresh pick or a removal isn't clobbered by a late load.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !initial) return;
    seeded.current = true;
    setAttached({ evidenceId: initial.evidenceId, fileName: initial.fileName });
  }, [initial]);

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

  const handleView = async () => {
    if (!attached) return;
    // No backend viewer wired → open the in-session copy if we have one.
    if (!onView) {
      if (attached.url) window.open(attached.url, '_blank', 'noopener');
      return;
    }
    // Open the tab synchronously (inside the click) so it isn't popup-blocked,
    // then point it at the fetched blob once the authenticated download lands.
    const tab = window.open('', '_blank');
    setViewing(true);
    try {
      const { blob } = await onView(attached.evidenceId);
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.open(url, '_blank', 'noopener');
      // Give the new tab time to render before reclaiming the URL.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      tab?.close();
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Could not open the file. Please try again.',
      );
    } finally {
      setViewing(false);
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
          <button
            type='button'
            onClick={handleView}
            disabled={viewing}
            title='View file'
            className='inline-flex items-center gap-2 hover:underline disabled:opacity-60 cursor-pointer'
          >
            <Paperclip className='size-3' />
            <span className='max-w-40 truncate'>{attached.fileName}</span>
            {viewing ? (
              <Loader2 className='size-3.5 shrink-0 animate-spin' />
            ) : (
              <Eye className='size-3.5 shrink-0' />
            )}
          </button>
          <button
            type='button'
            onClick={handleRemove}
            disabled={busy}
            aria-label='Remove file'
            className='text-gray-500 hover:text-carbon-black disabled:opacity-60 cursor-pointer'
          >
            <X className='size-3.5' />
          </button>
        </span>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className='inline-flex h-7 items-center gap-2 rounded-lg bg-primary px-5 text-label-sm font-medium text-gray-200 shadow-xs transition-opacity hover:opacity-90 disabled:opacity-70 cursor-pointer'
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
        className='text-label-sm font-normal text-gray-700 underline hover:no-underline cursor-pointer'
      >
        Or add a justification
      </button>
      <span className='ml-auto text-label-sm font-normal text-gray-700'>
        {hint}
      </span>
    </div>
  );
}
