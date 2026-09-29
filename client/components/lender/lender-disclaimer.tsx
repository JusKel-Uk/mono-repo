import { AlertOctagon } from 'lucide-react';

/** The regulatory footer shown at the bottom of every lender portal screen. */
export function LenderDisclaimer() {
  return (
    <div className='flex items-start gap-3 rounded-2xl border border-mineral-white bg-abyssal px-6 py-6'>
      <AlertOctagon className='size-6 shrink-0 text-mineral-white' />
      <p className='text-body-md text-mineral-white'>
        JusKel outputs are informational and directional only. They are not
        lending advice, underwriting, or credit approval, and do not replace your
        own due diligence.
      </p>
    </div>
  );
}
