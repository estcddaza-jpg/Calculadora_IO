export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
  return String(Number(num.toFixed(4)));
}
