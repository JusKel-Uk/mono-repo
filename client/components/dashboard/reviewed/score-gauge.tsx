/* eslint-disable @next/next/no-img-element -- static local SVG gauge layers */
/**
 * Overall Sustainability Finance Score gauge.
 * Composed from the exact Figma-exported vector layers (public/dashboard/gauge/*)
 * so it is pixel-accurate; the numeric value + tier are rendered as text on top.
 * Base meter geometry is a 200×100 region centred in a 296px column (per Figma).
 */
const L = '/dashboard/gauge';

export function ScoreGauge() {
  return (
    <div className='relative h-[120px] w-full' data-name='Meter Base'>
      {/* arc track */}
      <div className='absolute left-1/2 top-1/2 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2'>
        <div className='absolute inset-[-6%_-2.99%]'>
          <img alt='' src={`${L}/bg.svg`} className='block size-full max-w-none' />
        </div>
      </div>
      {/* five coloured marker bands */}
      <div className='absolute left-1/2 top-1/2 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2'>
        <div className='absolute inset-[-3%_-1.48%]'>
          <img alt='' src={`${L}/m0.svg`} className='block size-full max-w-none' />
        </div>
      </div>
      <div className='absolute left-1/2 top-1/2 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2'>
        <div className='absolute inset-[-3%_0_-3%_-1.48%]'>
          <img alt='' src={`${L}/m1.svg`} className='block size-full max-w-none' />
        </div>
      </div>
      <div className='absolute left-1/2 top-1/2 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2'>
        <div className='absolute inset-[-3%_0_-3%_-1.48%]'>
          <img alt='' src={`${L}/m2.svg`} className='block size-full max-w-none' />
        </div>
      </div>
      <div className='absolute left-1/2 top-1/2 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2'>
        <div className='absolute inset-[0_0_-3%_-1.48%]'>
          <img alt='' src={`${L}/m3.svg`} className='block size-full max-w-none' />
        </div>
      </div>
      <div className='absolute left-1/2 top-1/2 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2'>
        <div className='absolute inset-[0_0_-3%_-1.48%]'>
          <img alt='' src={`${L}/m4.svg`} className='block size-full max-w-none' />
        </div>
      </div>
      {/* value pin */}
      <div className='absolute bottom-[4px] left-[calc(50%+0.72px)] h-[34.05px] w-[33.435px] -translate-x-1/2'>
        <img alt='' src={`${L}/pin.svg`} className='absolute inset-0 block size-full max-w-none' />
      </div>
    </div>
  );
}
