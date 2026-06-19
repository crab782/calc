export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthKey(date: Date | string): string {
  return formatMonth(date);
}

export function parseDate(str: string): Date {
  return new Date(str);
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}
