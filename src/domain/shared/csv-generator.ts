export function escapeCsvField(field: string): string {
  if (field.includes('"')) {
    field = field.replace(/"/g, '""');
  }
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field}"`;
  }
  return field;
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const escapedHeaders = headers.map(escapeCsvField);
  const headerLine = escapedHeaders.join(',');

  const rowLines = rows.map((row) =>
    row.map(escapeCsvField).join(',')
  );

  return [headerLine, ...rowLines].join('\n');
}
