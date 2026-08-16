import type { Metadata } from "next";

export const metadata: Metadata = { title: "SME Dashboard" };

export default function SmeDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Funding Readiness</h1>
      <p className="mt-2 text-muted-foreground">
        Scorecard, funding match, and readiness views land across milestones
        M4–M11.
      </p>
    </div>
  );
}
