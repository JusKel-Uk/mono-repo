import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Log in</h1>
      <p className="text-sm text-muted-foreground">
        Auth flow lands in the onboarding milestone (M1).
      </p>
    </div>
  );
}
