import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <Link
        href={ROUTES.home}
        className="mb-8 text-lg font-semibold tracking-tight"
      >
        JusKel
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
