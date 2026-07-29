/**
 * Minimal class-name joiner (zero-dependency).
 * Swap for `clsx` + `tailwind-merge` if/when we add those deps.
 */
export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}
