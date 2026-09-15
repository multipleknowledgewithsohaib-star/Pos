export type ImportEntity = 'products' | 'customers' | 'suppliers' | 'opening-stock';

export type ExportEntity = 'products' | 'customers' | 'sales' | 'inventory';

export type ImportRow = Record<string, string | number>;

export type ImportValidationResult = {
  row: number;
  data: ImportRow;
  valid: boolean;
  errors: string[];
};

export type ImportPreview = {
  total: number;
  valid: ImportValidationResult[];
  invalid: ImportValidationResult[];
};

export type ImportApplyResult = {
  imported: number;
  skipped: number;
  errors: string[];
};
