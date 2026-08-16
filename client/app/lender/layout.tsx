import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const nav = [{ label: "Portfolio", href: ROUTES.lender.dashboard }];

export default function LenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link href={ROUTES.home} className="font-semibold tracking-tight">
          JusKel <span className="text-muted-foreground">/ Lender</span>
        </Link>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
