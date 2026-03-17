export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatHtsCode(code: string): string {
  const clean = code.replace(/\D/g, "");
  if (clean.length >= 10) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 10)}`;
  }
  if (clean.length >= 6) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6)}`;
  }
  return code;
}

export function formatWeight(kg: number): string {
  return `${kg.toLocaleString()} kg`;
}
