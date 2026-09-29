/**
 * Match-relevance ring shown on matched-SME rows. A teal arc over a gray track,
 * with the percentage + "match" centred. Pure SVG so it scales crisply.
 */
export function LenderProgressRing({
  percent,
  size = 64,
}: {
  percent: number;
  size?: number;
}) {
  const stroke = size <= 56 ? 4 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - clamped / 100);

  return (
    <div
      className='relative shrink-0'
      style={{ width: size, height: size }}
      role='img'
      aria-label={`${clamped}% match`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className='-rotate-90'
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke='var(--color-gray-200)'
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke='var(--color-teal-charcoal)'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center text-center leading-4 text-carbon-black'>
        <span className='text-label-md font-medium'>{clamped}%</span>
        <span className='text-label-md font-medium'>match</span>
      </div>
    </div>
  );
}
