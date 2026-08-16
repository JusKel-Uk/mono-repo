import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lender Portfolio" };

export default function LenderDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
      <p className="mt-2 text-muted-foreground">
        Applicant pipeline, SME score read-view, rule builder, and offers land
        across milestones M3–M12.
      </p>
    </div>
  );
}
