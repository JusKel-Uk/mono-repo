// Each lender portal screen renders its own chrome via <LenderShell>, so this
// segment layout is a simple pass-through (mirrors the SME segment layout).
export default function LenderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
