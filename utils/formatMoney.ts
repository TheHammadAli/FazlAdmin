/** Wallet amounts are stored as integers in minor currency units (paisa). Always divide by
 *  100 for display — never render a `*Minor` field directly. */
export function formatMoneyMinor(amountMinor: number | undefined | null): string {
  const value = ((amountMinor ?? 0) / 100).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs ${value}`;
}
