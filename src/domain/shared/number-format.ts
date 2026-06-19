export const EPSILON = 1e-9;

export function isZero(value: number): boolean {
  return Math.abs(value) < EPSILON;
}

export function formatNumber(value: number, decimals?: number): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function safeAdd(...values: number[]): number {
  return values.reduce((sum, val) => {
    const [_intPart, fracPart] = String(val).split('.');
    const precision = fracPart ? fracPart.length : 0;
    const factor = Math.pow(10, precision);
    return (sum * factor + val * factor) / factor;
  }, 0);
}

export function safeSubtract(a: number, b: number): number {
  const [_intA, fracA] = String(a).split('.');
  const [_intB, fracB] = String(b).split('.');
  const precision = Math.max(fracA?.length || 0, fracB?.length || 0);
  const factor = Math.pow(10, precision);
  return (a * factor - b * factor) / factor;
}
