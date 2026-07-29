import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          Sustainability Finance Hub
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          JusKel
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Open banking and ESG data, fused into a single AI-driven scorecard —
          connecting SMEs to green finance.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={ROUTES.signup}>
            <Button size="lg">Get started</Button>
          </Link>
          <Link href={ROUTES.login}>
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>

        {/* Dev-only portal shortcuts — removed once auth routing lands */}
        <div className="mt-8 flex gap-4 text-sm text-muted-foreground">
          <Link href={ROUTES.sme.dashboard} className="underline">
            SME portal
          </Link>
          <Link href={ROUTES.lender.dashboard} className="underline">
            Lender portal
          </Link>
        </div>
      </div>
    </main>
  );
}
