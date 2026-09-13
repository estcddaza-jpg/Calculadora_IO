export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return String(num);
  return String(Number(num.toFixed(4)));
}
