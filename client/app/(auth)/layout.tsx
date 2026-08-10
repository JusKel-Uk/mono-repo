import { JusKelLogo } from '@/components/brand/juskel-logo';
import { AuthRibbons } from '@/components/brand/auth-ribbons';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className='relative min-h-screen overflow-hidden bg-muted'>
      {/* Decorative brand ribbons — desktop only, animated via GSAP */}
      <AuthRibbons />

      {/* Logo — top-left page corner (desktop) */}
      <JusKelLogo className='absolute left-12 top-12 z-10 hidden text-carbon-black xl:block' />

      {/* Content: full-width form on mobile, centered card on desktop */}
      <div className='relative z-10 flex min-h-screen flex-col px-6 py-10 xl:items-center xl:px-0 xl:py-12'>
        <div className='mx-auto w-full max-w-110 xl:max-w-216.25 xl:rounded-2xl xl:border xl:border-border xl:bg-muted xl:p-12 xl:shadow-[0px_0.5px_0.5px_0px_rgba(0,0,0,0.2)]'>
          {/* Logo — top of content (mobile) */}
          <JusKelLogo className='mb-14 text-carbon-black xl:hidden' />
          {children}
        </div>
      </div>
    </main>
  );
}
