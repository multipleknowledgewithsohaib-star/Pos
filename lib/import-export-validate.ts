import { getImportConfig } from './import-export-config';
import type { ImportEntity, ImportPreview, ImportRow, ImportValidationResult } from './import-export-types';
import { mapRowByHeader } from './import-export-xlsx';

function isEmpty(value: unknown) {
  return value === undefined || value === null || String(value).trim() === '';
}

function parseNumber(value: unknown, label: string, errors: string[]) {
  if (isEmpty(value)) {
    errors.push(`${label} is required.`);
    return null;
  }

  const parsed = Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} must be a number.`);
    return null;
  }

  return parsed;
}

function validateProductsRow(row: ImportRow): string[] {
  const errors: string[] = [];
  if (isEmpty(row.productName)) errors.push('Product Name is required.');
  if (isEmpty(row.category)) errors.push('Category is required.');
  const purchase = parseNumber(row.purchasePrice, 'Purchase Price', errors);
  const sale = parseNumber(row.salePrice, 'Sale Price', errors);
  const stock = parseNumber(row.stock, 'Stock', errors);
  if (purchase !== null && purchase < 0) errors.push('Purchase Price cannot be negative.');
  if (sale !== null && sale < 0) errors.push('Sale Price cannot be negative.');
  if (stock !== null && stock < 0) errors.push('Stock cannot be negative.');
  return errors;
}

function validateCustomersRow(row: ImportRow): string[] {
  const errors: string[] = [];
  if (isEmpty(row.name)) errors.push('Name is required.');
  if (isEmpty(row.phone)) errors.push('Phone is required.');
  return errors;
}

function validateSuppliersRow(row: ImportRow): string[] {
  const errors: string[] = [];
  if (isEmpty(row.name)) errors.push('Supplier Name is required.');
  if (isEmpty(row.phone)) errors.push('Phone is required.');
  return errors;
}

function validateOpeningStockRow(row: ImportRow): string[] {
  const errors: string[] = [];
  if (isEmpty(row.productName)) errors.push('Product Name is required.');
  if (isEmpty(row.batchNo)) errors.push('Batch No is required.');
  const quantity = parseNumber(row.quantity, 'Quantity', errors);
  parseNumber(row.purchasePrice, 'Purchase Price', errors);
  if (isEmpty(row.expiryDate)) errors.push('Expiry Date is required.');
  if (quantity !== null && quantity <= 0) errors.push('Quantity must be greater than zero.');
  return errors;
}

function validateRow(entity: ImportEntity, row: ImportRow): string[] {
  switch (entity) {
    case 'products':
      return validateProductsRow(row);
    case 'customers':
      return validateCustomersRow(row);
    case 'suppliers':
      return validateSuppliersRow(row);
    case 'opening-stock':
      return validateOpeningStockRow(row);
    default:
      return ['Unknown import type.'];
  }
}

export function buildImportPreview(entity: ImportEntity, rawRows: Record<string, string>[]): ImportPreview {
  const config = getImportConfig(entity);
  const valid: ImportValidationResult[] = [];
  const invalid: ImportValidationResult[] = [];

  rawRows.forEach((rawRow, index) => {
    const mapped = mapRowByHeader(rawRow, config.columns) as ImportRow;
    const errors = validateRow(entity, mapped);
    const result: ImportValidationResult = {
      row: index + 2,
      data: mapped,
      valid: errors.length === 0,
      errors,
    };

    if (result.valid) {
      valid.push(result);
    } else {
      invalid.push(result);
    }
  });

  return {
    total: rawRows.length,
    valid,
    invalid,
  };
}
