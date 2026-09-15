import * as XLSX from 'xlsx';
import type { ImportExportColumn } from './import-export-config';

export function downloadWorkbook(
  fileName: string,
  sheetName: string,
  rows: Record<string, string | number>[],
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

export function downloadTemplate(
  fileName: string,
  columns: ImportExportColumn[],
  sampleRows: Record<string, string | number>[],
) {
  const headers = columns.map((column) => column.header);
  const rows = sampleRows.length
    ? sampleRows
    : [
        Object.fromEntries(
          columns.map((column) => [column.header, column.required ? `(required)` : '']),
        ),
      ];

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, fileName);
}

export function parseWorkbookFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          reject(new Error('Could not read file.'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          resolve([]);
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        });

        const rows = rawRows
          .map((row) => normalizeRow(row))
          .filter((row) => Object.values(row).some((value) => String(value).trim()));

        resolve(rows);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse Excel file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRow(row: Record<string, unknown>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const header = String(key).trim();
    if (!header) {
      continue;
    }

    if (value instanceof Date) {
      normalized[header] = value.toISOString().slice(0, 10);
      continue;
    }

    normalized[header] = String(value ?? '').trim();
  }
  return normalized;
}

export function mapRowByHeader(
  row: Record<string, string>,
  columns: ImportExportColumn[],
): Record<string, string> {
  const mapped: Record<string, string> = {};
  const headerLookup = new Map(columns.map((column) => [column.header.toLowerCase(), column.key]));

  for (const [header, value] of Object.entries(row)) {
    const key = headerLookup.get(header.toLowerCase());
    if (key) {
      mapped[key] = value;
    }
  }

  return mapped;
}
