import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="text-sm text-muted-foreground">
        SME registration lands in the onboarding milestone (M1).
      </p>
    </div>
  );
}
