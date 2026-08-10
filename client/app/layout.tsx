import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "JusKel — Sustainability Finance Hub",
    template: "%s · JusKel",
  },
  description:
    "JusKel fuses open banking and ESG data into a single AI-driven scorecard, connecting SMEs to green finance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        // Browser extensions (e.g. ColorZilla's cz-shortcut-listen) inject
        // attributes onto <body> before hydration; ignore those mismatches.
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
