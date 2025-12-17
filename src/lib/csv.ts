import { parse } from 'csv-parse/sync';

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  column: (name: string) => string[];
}

export function parseCSV(content: string): ParsedCSV {
  const records: string[][] = parse(content, {
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = records[0];
  const rows = records.slice(1);

  return {
    headers,
    rows,
    column: (name: string) => {
      const index = headers.indexOf(name);
      if (index === -1) {
        throw new Error(`Column "${name}" not found in CSV`);
      }
      return rows.map(row => row[index]);
    },
  };
}

export function getTargetColumn(csv: ParsedCSV): string[] {
  // Try common target column names
  const targetNames = ['target', 'label', 'y', 'prediction', 'pred', 'class', 'clicked', 'probability', 'prob', 'score'];

  for (const name of targetNames) {
    const lowerHeaders = csv.headers.map(h => h.toLowerCase());
    const index = lowerHeaders.indexOf(name.toLowerCase());
    if (index !== -1) {
      return csv.rows.map(row => row[index]);
    }
  }

  // Default to last column
  const lastIndex = csv.headers.length - 1;
  return csv.rows.map(row => row[lastIndex]);
}

// CSV를 객체 배열로 변환 (커스텀 채점용)
export function csvToObjects(csv: ParsedCSV): Record<string, string>[] {
  return csv.rows.map(row => {
    const obj: Record<string, string> = {};
    csv.headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
