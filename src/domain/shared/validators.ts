export function isValidAmount(amount: number): boolean {
  return (
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= 0
  );
}

export function isValidDateString(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime());
}

export function isValidNote(note: string): boolean {
  return typeof note === 'string' && note.length > 0;
}
