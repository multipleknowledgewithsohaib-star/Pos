import { createDraftLineItem, roundMoney, summarizePurchaseLineItem, type PurchaseLineItem, type PurchasePaymentMethod, type PurchaseReturnReason } from './purchase-data';

export type ParsedPurchaseOcr = {
  rawText: string;
  supplierName: string;
  orderNo: string;
  invoiceReference: string;
  orderDate: string;
  shipmentDate: string;
  expectedDate: string;
  paymentMethod: PurchasePaymentMethod;
  notes: string;
  items: PurchaseLineItem[];
  confidence: number;
  warnings: string[];
  expiriesDetected: number;
  batchesDetected: number;
};

const paymentMethods: PurchasePaymentMethod[] = [
  'Cash',
  'Credit',
  'Bank Transfer',
  'Card',
  'Mobile Wallet',
];

const returnReasons: PurchaseReturnReason[] = [
  'Damaged',
  'Expired',
  'Wrong Item',
  'Short Supply',
  'Overstock',
  'Price Issue',
];

export function parsePurchaseOcrText(rawText: string): ParsedPurchaseOcr {
  const text = normalizeText(rawText);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const warnings: string[] = [];

  const supplierName =
    extractLabelValue(lines, /(?:supplier(?: name)?|vendor|distributor|from)\s*[:\-]\s*(.+)/i) ??
    inferSupplierName(lines) ??
    '';
  const invoiceReference =
    extractPremierInvoiceNumber(text) ??
    extractLabelValue(lines, /(?:inv(?:oice)?\.?\s*(?:ref(?:erence)?|no\.?|number)|bill\s*(?:no\.?|number))\s*[:#\-]?\s*([a-z0-9-]+)/i) ??
    inferInvoiceNumber(text) ??
    '';
  const orderNo =
    extractLabelValue(lines, /(?:order\s*(?:no\.?|number)|po\s*(?:no\.?|number)?|purchase\s*(?:order)?\s*(?:no\.?|number)?)\s*[:#\-]?\s*([a-z0-9-]+)/i) ??
    inferOrderNumber(text) ??
    invoiceReference;
  const orderDate =
    extractDateValue(lines, ['order date', 'invoice date', 'inv. date', 'inv date', 'bill date']) ??
    inferDateFromText(text)[0] ??
    '';
  const shipmentDate =
    extractDateValue(lines, ['shipment date', 'ship date', 'dispatch date', 'delivery date', 'receive date', 'eta']) ??
    inferDateFromText(text)[1] ??
    orderDate ??
    '';
  const expectedDate =
    extractDateValue(lines, ['expected date', 'delivery date', 'receive date', 'eta']) ??
    inferDateFromText(text)[1] ??
    '';
  const paymentMethod = extractPaymentMethod(lines, text);
  const notes = extractNotes(lines);

  const items = extractItems(lines);
  if (!items.length) {
    warnings.push('No medicine lines were detected.');
  }
  if (!supplierName) {
    warnings.push('Supplier name was not detected.');
  }
  if (!orderNo) {
    warnings.push('Order number was not detected.');
  }
  if (!invoiceReference) {
    warnings.push('Invoice reference was not detected.');
  }
  if (!shipmentDate) {
    warnings.push('Shipment date was not detected.');
  }

  const today = new Date().toISOString().slice(0, 10);
  let expiriesDetected = 0;
  let batchesDetected = 0;

  for (const item of items) {
    if (item.expiryDate) {
      expiriesDetected += 1;
      if (item.expiryDate < today) {
        warnings.push(`Warning: Item "${item.medicine}" has an EXPIRED date (${item.expiryDate}).`);
      }
    }
    if (item.batchNo) {
      batchesDetected += 1;
    }
  }

  const confidence = buildConfidence({
    supplierName,
    orderNo,
    invoiceReference,
    orderDate,
    shipmentDate,
    expectedDate,
    paymentMethod,
    notes,
    items,
    expiriesDetected,
  });

  return {
    rawText: text,
    supplierName,
    orderNo,
    invoiceReference,
    orderDate,
    shipmentDate,
    expectedDate,
    paymentMethod,
    notes,
    items,
    confidence,
    warnings,
    expiriesDetected,
    batchesDetected,
  };
}

export function normalizeText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[\u2018\u2019\u0060]/g, "'")
    .replace(/[|]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function formatConfidence(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function extractLabelValue(lines: string[], pattern: RegExp) {
  for (const line of lines) {
    const match = line.match(pattern);
    if (!match) {
      continue;
    }

    const value = match[2] ?? match[1] ?? '';
    if (value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function inferSupplierName(lines: string[]) {
  const premier = lines.find((line) => /premier sales/i.test(line));
  if (premier) {
    const match = premier.match(/premier sales(?:\s*\((?:private|pvt)\)\s*)?(?:limited|ltd)?/i);
    return (match?.[0] ?? 'Premier Sales (Private) Limited').replace(/\s+/g, ' ').trim();
  }

  const company = lines.find((line) => {
    if (looksLikeFooterLine(line) || looksLikeItemLine(line) || looksLikeManufacturerGroup(line)) {
      return false;
    }
    return /(?:\(private\)|\(pvt\.?\)|\blimited\b|\bltd\b|\blaboratories\b)/i.test(line);
  });
  if (company) {
    return company.replace(/\s+/g, ' ').trim();
  }

  const firstLine = lines[0] ?? '';
  if (looksLikeHeaderLine(firstLine) || looksLikeItemLine(firstLine) || /^s\.\s*(rep|man)/i.test(firstLine)) {
    return null;
  }

  return firstLine || null;
}

function extractPremierInvoiceNumber(text: string) {
  const match = text.match(/\binv(?:oice)?\.?\s*no\.?\s*[:#]?\s*(\d{3,})/i);
  return match?.[1] ?? null;
}

function inferOrderNumber(text: string) {
  const match = text.match(/\b(?:po|order|invoice)[-#\s]*([a-z0-9-]{3,})\b/i);
  if (match?.[1]) {
    return `PO-${match[1].replace(/[^a-z0-9-]/gi, '').toUpperCase()}`;
  }

  const direct = text.match(/\bPO-\d{3,}\b/i);
  return direct?.[0] ?? null;
}

function inferInvoiceNumber(text: string) {
  const premier = extractPremierInvoiceNumber(text);
  if (premier) {
    return premier;
  }

  const match = text.match(/\b(?:invoice\s*(?:ref(?:erence)?|no\.?|number)|bill\s*(?:no\.?|number))\s*[:#\-]?\s*([a-z0-9-]{3,})\b/i);
  if (match?.[1] && !/^invoice$/i.test(match[1])) {
    return match[1].toUpperCase();
  }

  const direct = text.match(/\bINV-\d{3,}\b/i);
  return direct?.[0] ?? null;
}

function extractDateValue(lines: string[], labels: string[]) {
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!labels.some((label) => lower.includes(label))) {
      continue;
    }

    const parsed = findDateInText(line);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function inferDateFromText(text: string) {
  const matches: string[] = [];
  const datePattern = /(?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(?:\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/g;
  for (const match of text.matchAll(datePattern)) {
    const raw = match[0];
    const iso = parseDateString(raw);
    if (iso && !matches.includes(iso)) {
      matches.push(iso);
    }
  }

  return matches;
}

function findDateInText(text: string) {
  const match = text.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/);
  return match ? parseDateString(match[0]) : null;
}

/**
 * Enhanced Date parser supporting standard dates & pharma month/year expiry formats
 */
export function parseDateString(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return buildIsoDate(year, month, day);
  }

  // DD/MM/YYYY or DD/MM/YY
  const slashMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (slashMatch) {
    let part1 = Number(slashMatch[1]);
    let part2 = Number(slashMatch[2]);
    const year = normalizeYear(Number(slashMatch[3]));

    // If part1 > 12 and part2 <= 12, part1 is day, part2 is month
    // If part1 <= 12 and part2 > 12, part1 is month, part2 is day
    let day = part1;
    let month = part2;
    if (part1 <= 12 && part2 > 12) {
      month = part1;
      day = part2;
    }
    return buildIsoDate(year, month, day);
  }

  // DD Month YYYY (e.g., 15 Dec 2026, 15-Dec-2026)
  const textMatch = trimmed.match(/^(\d{1,2})[\s\/-]+([A-Za-z]{3,9})[\s\/-]+(\d{2,4})$/);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const month = monthIndexFor(textMatch[2]);
    const year = normalizeYear(Number(textMatch[3]));
    if (month >= 0) {
      return buildIsoDate(year, month + 1, day);
    }
  }

  // Month YYYY (e.g., Dec 2026, Dec-26, Dec/2026) -> end of month
  const monthYearTextMatch = trimmed.match(/^([A-Za-z]{3,9})[\s\/-]+(\d{2,4})$/);
  if (monthYearTextMatch) {
    const month = monthIndexFor(monthYearTextMatch[1]);
    const year = normalizeYear(Number(monthYearTextMatch[2]));
    if (month >= 0) {
      const monthNum = month + 1;
      const lastDay = getDaysInMonth(year, monthNum);
      return buildIsoDate(year, monthNum, lastDay);
    }
  }

  // MM/YYYY or MM/YY or MM-YYYY or MM-YY (e.g., 12/26, 05/2027, 08-28) -> end of month
  const monthYearMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{2,4})$/);
  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const rawYear = Number(monthYearMatch[2]);
    if (month >= 1 && month <= 12) {
      const year = normalizeYear(rawYear);
      const lastDay = getDaysInMonth(year, month);
      return buildIsoDate(year, month, lastDay);
    }
  }

  // YYYY-MM or YYYY/MM (e.g. 2026/12, 2027-05) -> end of month
  const yearMonthMatch = trimmed.match(/^(\d{4})[\/.-](\d{1,2})$/);
  if (yearMonthMatch) {
    const year = Number(yearMonthMatch[1]);
    const month = Number(yearMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      const lastDay = getDaysInMonth(year, month);
      return buildIsoDate(year, month, lastDay);
    }
  }

  return null;
}

/**
 * Returns total days in given year and month (handles leap years)
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildIsoDate(year: number, month: number, day: number) {
  const safeMonth = Math.min(12, Math.max(1, month));
  const maxDay = getDaysInMonth(year, safeMonth);
  const safeDay = Math.min(maxDay, Math.max(1, day));
  const formattedMonth = String(safeMonth).padStart(2, '0');
  const formattedDay = String(safeDay).padStart(2, '0');
  return `${year}-${formattedMonth}-${formattedDay}`;
}

function normalizeYear(year: number) {
  if (year < 100) {
    // 2-digit year: 20-99 -> 2020-2099, 00-19 -> 2000-2019
    return 2000 + year;
  }
  return year;
}

function monthIndexFor(value: string) {
  const month = value.toLowerCase().slice(0, 3);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return months.indexOf(month);
}

/**
 * Extracts and parses pharmaceutical Expiry Date from a line or token sequence
 */
export function extractExpiryDate(line: string): string {
  if (!line) return '';

  // 1. Check explicit labeled expiry prefixes: EXP, EXPIRY, EXP DATE, EXP.DT, EX, E.D, BEST BEFORE, USE BY, BB
  const labelMatch = line.match(/(?:exp(?:iry)?(?:\s*date|\s*dt|\s*\.|\s*:|\s*#)?|use\s*by|best\s*before|valid\s*(?:till|thru)|bb|e\.d|ex|e)\s*[:#\-\.]?\s*([0-9a-zA-Z\/\.\-]+)/i);
  if (labelMatch?.[1]) {
    const parsed = parseDateString(labelMatch[1]);
    if (parsed) return parsed;
  }

  // 2. Check for month/year pattern (MM/YYYY or MM/YY e.g. 12/26, 05/2027) adjacent to batch or standalone
  const myMatch = line.match(/\b(0?[1-9]|1[0-2])[\/.-](\d{2}|\d{4})\b/);
  if (myMatch?.[0]) {
    const parsed = parseDateString(myMatch[0]);
    if (parsed) return parsed;
  }

  // 3. Check for month name pattern (e.g. DEC-2026, DEC/26, 15-DEC-2026)
  const monthNameMatch = line.match(/\b(?:(?:\d{1,2}[\s\/-]+)?[A-Za-z]{3,9}[\s\/-]+(?:\d{2}|\d{4}))\b/);
  if (monthNameMatch?.[0]) {
    const parsed = parseDateString(monthNameMatch[0]);
    if (parsed) return parsed;
  }

  // 4. Standard full date fallback if labeled with expiry keywords anywhere
  if (/(?:exp|expiry|valid|use|before)/i.test(line)) {
    const fallback = findDateInText(line);
    if (fallback) return fallback;
  }

  return '';
}

/**
 * Extracts manufacturing date (MFG) from line
 */
export function extractMfgDate(line: string): string {
  if (!line) return '';
  const match = line.match(/(?:mfg|mfd|manufactur(?:ed|ing)?)(?:\s*date|\s*dt|\s*\.|\s*:|\s*#)?\s*[:#\-\.]?\s*([0-9a-zA-Z\/\.\-]+)/i);
  if (match?.[1]) {
    const parsed = parseDateString(match[1]);
    if (parsed) return parsed;
  }
  return '';
}

function extractPaymentMethod(lines: string[], text: string): PurchasePaymentMethod {
  const labeled = lines.find((line) => /payment\s*method/i.test(line));
  const source = labeled ?? text;
  const normalized = source.toLowerCase();

  for (const method of paymentMethods) {
    if (normalized.includes(method.toLowerCase())) {
      return method;
    }
  }

  if (normalized.includes('cash')) {
    return 'Cash';
  }
  if (normalized.includes('credit')) {
    return 'Credit';
  }
  if (normalized.includes('bank')) {
    return 'Bank Transfer';
  }
  if (normalized.includes('card')) {
    return 'Card';
  }
  if (/credit\s*memo/i.test(source)) {
    return 'Credit';
  }
  if (/cash\s*memo/i.test(source)) {
    return 'Cash';
  }

  return 'Credit';
}

function extractNotes(lines: string[]) {
  const noteLine = lines.find((line) => /^(notes?|remarks?|memo)\b/i.test(line));
  if (noteLine) {
    return noteLine.replace(/^(notes?|remarks?|memo)\s*[:\-]?\s*/i, '').trim();
  }

  const commentLine = lines.find((line) =>
    /deliver|urgent|before|after|note/i.test(line) && !looksLikeItemLine(line),
  );
  return commentLine ?? '';
}

function extractItems(lines: string[]): PurchaseLineItem[] {
  const items: PurchaseLineItem[] = [];
  let runningIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (looksLikeFooterLine(line) || looksLikeManufacturerGroup(line) || looksLikeHeaderLine(line)) {
      continue;
    }

    const premierItem = parsePremierInvoiceLine(line, runningIndex);
    if (premierItem) {
      items.push(premierItem);
      runningIndex += 1;
      continue;
    }
    
    // Lookahead for 2-line item structure (line 1: medicine + numbers, line 2: batch + exp)
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const combined = isSubItemLine(nextLine) ? `${line} ${nextLine}` : line;

    const item = parseItemLine(combined, runningIndex);
    if (item) {
      items.push(item);
      runningIndex += 1;
      if (isSubItemLine(nextLine)) {
        i++; // skip nextLine since it was merged
      }
      continue;
    }

    const singleItem = parseItemLine(line, runningIndex);
    if (singleItem) {
      items.push(singleItem);
      runningIndex += 1;
    }
  }

  return items;
}

function looksLikeFooterLine(line: string) {
  return /(?:total amount|grand total|advance tax|rupees|page \d+|warranty|drugs warranty|head office|product\(s\) are advance)/i.test(line);
}

function looksLikeManufacturerGroup(line: string) {
  return /^\d{4,6}\s+[A-Z0-9].*(?:ltd|limited|laboratories|pharmaceuticals|pvt)/i.test(line)
    && !/\b(?:tab|cap|syrup|mg|ml)\b/i.test(line);
}

export function parsePremierInvoiceLine(line: string, index: number): PurchaseLineItem | null {
  const cleaned = line.replace(/\s+/g, ' ').trim();
  const serialMatch = cleaned.match(/^(\d{1,3})\s+(\d{3,8})\s+\*?\s*(.+)$/);
  if (!serialMatch) {
    return null;
  }

  const itemCode = serialMatch[2];
  const rest = serialMatch[3].replace(/^\*\s*/, '');
  const batchExp = rest.match(/\s+([A-Z0-9][A-Z0-9-]{1,})\s*\/\s*(\d{1,2}[-./]\d{2,4})\b/i);
  if (!batchExp || batchExp.index === undefined) {
    return null;
  }

  const beforeBatch = rest.slice(0, batchExp.index).trim();
  const qtyMatch = beforeBatch.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+(\d+)$/);
  if (!qtyMatch) {
    return null;
  }

  const name = cleanupItemName(qtyMatch[1]).replace(/^\*\s*/, '');
  if (!name || name.length < 3) {
    return null;
  }

  const mrp = Number(qtyMatch[2]) || 0;
  const tp = Number(qtyMatch[3]) || 0;
  const qty = Number(qtyMatch[4]) || 0;
  const bonusQty = Number(qtyMatch[5]) || 0;
  const batchNo = batchExp[1].toUpperCase();
  const expiryDate = parseDateString(batchExp[2]) ?? extractExpiryDate(batchExp[2]);
  const packMatch = name.match(/(\d+\s*S|\d+\s*(?:TAB|CAP|ML))\s*$/i);

  return createDraftLineItem(`ocr-item-${index}`, {
    itemCode,
    medicine: name,
    pack: packMatch?.[1]?.replace(/\s+/g, '') ?? '',
    qty,
    bonusQty,
    purchasePrice: roundMoney(tp),
    mrpValue: roundMoney(mrp),
    tpValue: roundMoney(tp),
    batchNo,
    expiryDate: expiryDate || undefined,
  });
}

function isSubItemLine(line: string): boolean {
  if (!line) return false;
  // Sub lines typically contain only batch, expiry, barcode, or small notes
  return /(?:batch|bno|b\.no|exp|expiry|mfg|mfd)\b/i.test(line) && !looksLikeItemLine(line);
}

function parseItemLine(line: string, index: number): PurchaseLineItem | null {
  if (!looksLikeItemLine(line)) {
    return null;
  }

  // 1. Extract Batch, Expiry, and Mfg dates first
  const batchNo = extractBatchNumber(line);
  const expiryDate = extractExpiryDate(line);
  const mfgDate = extractMfgDate(line);

  // 2. Remove extracted batch/expiry fragments from line to prevent numeric interference
  let cleaned = line
    .replace(/(?:batch(?:\s*no\.?)?|batch#|bno|b\s*no\.?)\s*[:#-]?\s*[a-z0-9-]+/gi, ' ')
    .replace(/(?:exp(?:iry)?(?:\s*date|\s*dt|\s*\.|\s*:|\s*#)?|use\s*by|best\s*before|valid\s*(?:till|thru)|bb|e\.d|ex|e)\s*[:#\-\.]?\s*[0-9a-zA-Z\/\.\-]+/gi, ' ')
    .replace(/(?:mfg|mfd|manufactur(?:ed|ing)?)(?:\s*date|\s*dt|\s*\.|\s*:|\s*#)?\s*[:#\-\.]?\s*[0-9a-zA-Z\/\.\-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Also remove standalone month/year if it matched expiry
  if (expiryDate) {
    cleaned = cleaned.replace(/\b(0?[1-9]|1[0-2])[\/.-](\d{2}|\d{4})\b/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const patterns = [
    // Name + Pack + Qty + Price + Disc + Total
    { regex: /^(.*?)\s+((?:\d+(?:'s|s)|\d+\s*(?:pc|pcs|pack|packs?|tab|tabs|cap|caps|bottle|box|amp|vial|strip|strips)))\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/i, packIndex: 2, qtyIndex: 3, priceIndex: 4, discountIndex: 5, totalIndex: 6 },
    // Name + Pack + Qty + Price + Total
    { regex: /^(.*?)\s+((?:\d+(?:'s|s)|\d+\s*(?:pc|pcs|pack|packs?|tab|tabs|cap|caps|bottle|box|amp|vial|strip|strips)))\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/i, packIndex: 2, qtyIndex: 3, priceIndex: 4, totalIndex: 5 },
    // Name + Qty + Price + Disc + Total
    { regex: /^(.*?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/i, qtyIndex: 2, priceIndex: 3, discountIndex: 4, totalIndex: 5 },
    // Name + Qty + Price + Total
    { regex: /^(.*?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/i, qtyIndex: 2, priceIndex: 3, totalIndex: 4 },
    // Name + Qty + Price
    { regex: /^(.*?)\s+(\d+)\s+(\d+(?:\.\d+)?)$/i, qtyIndex: 2, priceIndex: 3 },
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern.regex);
    if (!match) {
      continue;
    }

    const name = cleanupItemName(match[1] ?? '');
    if (!name || name.length < 2) {
      continue;
    }

    const pack = cleanupPack(pattern.packIndex ? match[pattern.packIndex] ?? '' : '');
    const qty = Number(match[pattern.qtyIndex] ?? '') || 1;
    const price = Number(match[pattern.priceIndex] ?? '') || 0;
    const discount = pattern.discountIndex ? Number(match[pattern.discountIndex] ?? '') || 0 : 0;
    const total = pattern.totalIndex ? Number(match[pattern.totalIndex] ?? '') : qty * price;
    const fallbackDiscount = Number.isFinite(total) && total < qty * price ? roundMoney(qty * price - total) : discount;
    const itemCode = extractItemCode(line, name);

    return createDraftLineItem(`ocr-item-${index}`, {
      itemCode,
      medicine: name,
      pack,
      qty,
      purchasePrice: roundMoney(price),
      discount: roundMoney(fallbackDiscount),
      batchNo: batchNo || undefined,
      mfgDate: mfgDate || undefined,
      expiryDate: expiryDate || undefined,
    });
  }

  // Key-Value fallback: e.g. "Item: Panadol Qty: 10 Price: 20"
  const kvName = line.match(/(?:item|medicine|product|name)\s*[:\-]\s*([^,;|\n]+)/i);
  const kvQty = line.match(/(?:qty|quantity)\s*[:\-]\s*(\d+)/i);
  const kvPrice = line.match(/(?:price|rate|cost|tp)\s*[:\-]\s*(\d+(?:\.\d+)?)/i);

  if (kvName?.[1] && (kvQty?.[1] || kvPrice?.[1])) {
    const name = cleanupItemName(kvName[1]);
    const qty = Number(kvQty?.[1] ?? 1) || 1;
    const price = Number(kvPrice?.[1] ?? 0) || 0;
    return createDraftLineItem(`ocr-item-${index}`, {
      itemCode: extractItemCode(line, name),
      medicine: name,
      pack: '',
      qty,
      purchasePrice: roundMoney(price),
      discount: 0,
      batchNo: batchNo || undefined,
      mfgDate: mfgDate || undefined,
      expiryDate: expiryDate || undefined,
    });
  }

  return null;
}

function extractItemCode(line: string, name: string) {
  const sanitized = line.replace(/\s+/g, ' ').trim();
  const firstToken = sanitized.split(' ')[0] ?? '';
  if (!firstToken) {
    return '';
  }

  if (/^(?:[a-z]{1,6}\d{2,}|[a-z0-9]+(?:-[a-z0-9]+)+|item\d+|sku\d+)$/i.test(firstToken) && !name.toLowerCase().startsWith(firstToken.toLowerCase())) {
    return firstToken.toUpperCase();
  }

  return '';
}

function extractBatchNumber(line: string) {
  const direct = line.match(/\b(?:batch(?:\s*no\.?)?|batch#|bno|b\s*no\.?)\s*[:#-]?\s*([a-z0-9-]+)/i);
  if (direct?.[1]) {
    return direct[1].toUpperCase();
  }

  const standalone = line.match(/\b[Bb]-?[a-zA-Z0-9]{3,}\b/);
  return standalone?.[0]?.toUpperCase() ?? '';
}

function cleanupItemName(value: string) {
  return value
    .replace(/^\d+[\.\)\-]\s*/, '') // Remove leading list index e.g. "1. " or "2) "
    .replace(/\s+(?:qty|quantity|price|discount|total|batch|exp)\b.*$/i, '')
    .trim();
}

function cleanupPack(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function looksLikeHeaderLine(line: string) {
  return /(?:item\s*name|medicine|description|pack|qty|quantity|purchase price|rate|discount|total|batch|exp date|expiry)/i.test(line) &&
    !/\d{2,}/.test(line);
}

function looksLikeItemLine(line: string) {
  // Line has digits and looks like a pharma product / medicine line
  return /\d/.test(line) && /(?:mg|mcg|ml|tab|cap|pack|pcs?|s\b|b-\d+|po-\d+|exp|batch|bottle|amp|vial|drop|syrup|gel|cream|susp)/i.test(line);
}

function buildConfidence(input: {
  supplierName: string;
  orderNo: string;
  invoiceReference: string;
  orderDate: string;
  shipmentDate: string;
  expectedDate: string;
  paymentMethod: PurchasePaymentMethod;
  notes: string;
  items: PurchaseLineItem[];
  expiriesDetected: number;
}) {
  let score = 0.15;
  if (input.supplierName) score += 0.15;
  if (input.orderNo) score += 0.10;
  if (input.invoiceReference) score += 0.10;
  if (input.orderDate) score += 0.10;
  if (input.shipmentDate) score += 0.05;
  if (input.paymentMethod) score += 0.05;
  if (input.notes) score += 0.05;
  if (input.items.length) score += Math.min(0.25, input.items.length * 0.06);
  if (input.expiriesDetected > 0) score += 0.15; // Bonus confidence for detected expiry dates
  return Math.max(0, Math.min(1, score));
}

export function summarizeReturnReason(reason: PurchaseReturnReason) {
  return returnReasons.includes(reason) ? reason : 'Damaged';
}

export function itemLineTotal(item: PurchaseLineItem) {
  return summarizePurchaseLineItem(item).netAmount;
}

export type StructuredPurchaseOcr = {
  rawText?: string;
  supplierName?: string;
  orderNo?: string;
  invoiceReference?: string;
  orderDate?: string;
  shipmentDate?: string;
  expectedDate?: string;
  paymentMethod?: PurchasePaymentMethod | string;
  notes?: string;
  items?: Array<{
    itemCode?: string;
    medicine?: string;
    pack?: string;
    qty?: number;
    bonusQty?: number;
    purchasePrice?: number;
    mrpValue?: number;
    batchNo?: string;
    expiryDate?: string;
  }>;
};

export function parsedPurchaseFromStructured(input: StructuredPurchaseOcr, fallbackText = ''): ParsedPurchaseOcr {
  const text = normalizeText(input.rawText || fallbackText);
  const fromText = parsePurchaseOcrText(text || fallbackText);
  const items = (input.items ?? [])
    .map((item, index) => {
      const medicine = (item.medicine ?? '').trim();
      if (!medicine) {
        return null;
      }
      return createDraftLineItem(`ocr-ai-${index + 1}`, {
        itemCode: item.itemCode?.trim() ?? '',
        medicine,
        pack: item.pack?.trim() ?? '',
        qty: Number(item.qty) || 0,
        bonusQty: Number(item.bonusQty) || 0,
        purchasePrice: roundMoney(Number(item.purchasePrice) || 0),
        mrpValue: roundMoney(Number(item.mrpValue) || 0),
        tpValue: roundMoney(Number(item.purchasePrice) || 0),
        batchNo: item.batchNo?.trim() || undefined,
        expiryDate: item.expiryDate ? parseDateString(item.expiryDate) || item.expiryDate : undefined,
      });
    })
    .filter((item): item is PurchaseLineItem => Boolean(item));

  const mergedItems = items.length ? items : fromText.items;
  const supplierName = input.supplierName?.trim() || fromText.supplierName;
  const invoiceReference = input.invoiceReference?.trim() || fromText.invoiceReference;
  const orderNo = input.orderNo?.trim() || fromText.orderNo || invoiceReference;
  const orderDate = input.orderDate ? parseDateString(input.orderDate) || input.orderDate : fromText.orderDate;
  const shipmentDate = input.shipmentDate ? parseDateString(input.shipmentDate) || input.shipmentDate : fromText.shipmentDate || orderDate;
  const expectedDate = input.expectedDate ? parseDateString(input.expectedDate) || input.expectedDate : fromText.expectedDate;
  const paymentMethod = extractPaymentMethod([], String(input.paymentMethod || fromText.paymentMethod));
  const notes = input.notes?.trim() || fromText.notes;
  const expiriesDetected = mergedItems.filter((item) => item.expiryDate).length;
  const batchesDetected = mergedItems.filter((item) => item.batchNo).length;
  const warnings = [...fromText.warnings];
  if (!supplierName) warnings.push('Supplier name was not detected.');
  if (!invoiceReference) warnings.push('Invoice reference was not detected.');
  if (!mergedItems.length) warnings.push('No medicine lines were detected.');

  return {
    rawText: text || fromText.rawText,
    supplierName,
    orderNo,
    invoiceReference,
    orderDate,
    shipmentDate,
    expectedDate,
    paymentMethod,
    notes,
    items: mergedItems,
    confidence: Math.max(fromText.confidence, items.length ? 0.92 : 0.55),
    warnings: Array.from(new Set(warnings)),
    expiriesDetected,
    batchesDetected,
  };
}
