/** @typedef {{ name: string; phone: string; address: string; email?: string; customerId?: number; note?: string }} PosCustomer */
/** @typedef {{ id: number; sku?: string; medicineName: string; genericName: string; category: string; unit: string; stock: number; lowStock: number; purchasePrice?: number; price: number; description?: string; status: 'In Stock' | 'Low Stock' | 'Out of Stock'; active: boolean; seedIssue?: string }} Medicine */
/** @typedef {{ id: number; name: string; barcode: string; category: string; unit: string; price: number; stock: number }} PosMedicine */

/** Large demo batch — inventory-focused, still ~80–90% valid overall. */
export const DEMO_COUNTS = {
  customers: 7500,
  wrongCustomers: 1250,
  products: 14000,
  wrongProducts: 2500,
  invoices: 45000,
  wrongInvoices: 5000,
};

/** Inventory stress target for backend stock records. */
export const DEMO_INVENTORY_COUNTS = {
  stockEntries: 130000,
  wrongStockEntries: 8000,
};

/** Next milestone after this pass. */
export const DEMO_MILESTONE_TARGETS = {
  customers: 10000,
  products: 18000,
  invoices: 60000,
};

const CUSTOMER_FIRST_NAMES = [
  'Ali',
  'Ayaan',
  'Hamza',
  'Hammad',
  'Sameer',
  'Taimoor',
  'Zain',
  'Maha',
  'Eshal',
  'Hira',
  'Kinza',
  'Aiman',
  'Minal',
  'Rida',
  'Tooba',
  'Yumna',
];

const CUSTOMER_LAST_NAMES = [
  'Ahmed',
  'Khan',
  'Malik',
  'Raza',
  'Sheikh',
  'Siddiqui',
  'Farooq',
  'Iqbal',
  'Javed',
  'Qureshi',
  'Tariq',
  'Yousaf',
];

const CUSTOMER_ADDRESSES = [
  'Gulshan-e-Iqbal, Karachi',
  'DHA Phase 5, Karachi',
  'Johar Town, Lahore',
  'Model Town, Lahore',
  'F-8 Markaz, Islamabad',
  'Satellite Town, Rawalpindi',
  'Madina Town, Faisalabad',
  'Cantt, Multan',
  'Latifabad, Hyderabad',
  'Hayatabad, Peshawar',
];

const CUSTOMER_NOTES = [
  'Regular customer',
  'Monthly medicines',
  'Family account',
  'Blood pressure care',
  'Diabetic care',
];

const MEDICINE_STEMS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Metformin',
  'Omeprazole',
  'Cetirizine',
  'Amlodipine',
  'Losartan',
  'Azithromycin',
  'Salbutamol',
  'Atorvastatin',
  'Levothyroxine',
  'Prednisolone',
  'Diclofenac',
  'Montelukast',
  'Pantoprazole',
  'Clarithromycin',
  'Insulin',
  'Vitamin D3',
  'Calcium',
];

const MEDICINE_FORMS = [
  { suffix: 'Tablet', unit: 'Tablet', category: 'Pain Relief' },
  { suffix: 'Capsule', unit: 'Capsule', category: 'Antibiotic' },
  { suffix: 'Syrup', unit: 'Bottle', category: 'Cough & Cold' },
  { suffix: 'Suspension', unit: 'Bottle', category: 'Fever' },
  { suffix: 'Drops', unit: 'Bottle', category: 'Allergy' },
  { suffix: 'Injection', unit: 'Vial', category: 'General' },
  { suffix: 'Cream', unit: 'Tube', category: 'Dermatology' },
  { suffix: 'Inhaler', unit: 'Inhaler', category: 'Respiratory' },
];

const BRAND_PREFIXES = ['Medi', 'Pharma', 'Care', 'Life', 'Health', 'Prime', 'Nova', 'Safe', 'Quick', 'City'];

/**
 * @param {PosCustomer[]} baseCustomers
 * @returns {PosCustomer[]}
 */
export function buildDemoCustomers(baseCustomers = []) {
  const walkIn = {
    name: 'Walk-in Customer',
    phone: 'N/A',
    address: 'N/A',
    note: 'Walk-in',
  };

  const validTarget = DEMO_COUNTS.customers - DEMO_COUNTS.wrongCustomers;
  const merged = [walkIn];
  const seen = new Set([customerKey(walkIn)]);

  for (const customer of baseCustomers) {
    if (!customer?.name?.trim()) {
      continue;
    }

    const key = customerKey(customer);
    if (seen.has(key)) {
      continue;
    }

    merged.push({
      name: customer.name.trim(),
      phone: customer.phone?.trim() || 'N/A',
      address: customer.address?.trim() || 'N/A',
      email: customer.email?.trim() || undefined,
      customerId: customer.customerId,
      note: customer.note?.trim() || undefined,
    });
    seen.add(key);
  }

  let index = 1;
  while (merged.length < validTarget) {
    const firstName = CUSTOMER_FIRST_NAMES[(index - 1) % CUSTOMER_FIRST_NAMES.length];
    const lastName =
      CUSTOMER_LAST_NAMES[Math.floor((index - 1) / CUSTOMER_FIRST_NAMES.length) % CUSTOMER_LAST_NAMES.length];
    const slug = `${firstName}.${lastName}${String(index).padStart(3, '0')}`.toLowerCase();
    const customer = {
      name: `${firstName} ${lastName} ${String(index).padStart(3, '0')}`,
      phone: `03${String(10 + (index % 40)).padStart(2, '0')}-7${String(index).padStart(6, '0')}`,
      address: CUSTOMER_ADDRESSES[(index - 1) % CUSTOMER_ADDRESSES.length],
      email: `${slug}@demo.pharm`,
      customerId: index,
      note: CUSTOMER_NOTES[(index - 1) % CUSTOMER_NOTES.length],
    };

    const key = customerKey(customer);
    if (!seen.has(key)) {
      merged.push(customer);
      seen.add(key);
    }

    index += 1;
  }

  const wrongCustomers = buildWrongCustomers(DEMO_COUNTS.wrongCustomers);
  return [...merged.slice(0, validTarget), ...wrongCustomers];
}

/**
 * @param {number} count
 * @returns {PosCustomer[]}
 */
function buildWrongCustomers(count) {
  const templates = [
    { name: 'Ahmed Khan', phone: '0300-1000001', address: 'Karachi', email: 'ahmed@demo.pharm', note: 'WRONG: duplicate name' },
    { name: 'Ahmed Khan', phone: '0300-1000002', address: 'Lahore', email: 'ahmed.khan2@demo.pharm', note: 'WRONG: duplicate name' },
    { name: 'Missing Phone Customer', phone: '', address: 'Islamabad', email: 'nophone@demo.pharm', note: 'WRONG: missing phone' },
    { name: 'No Phone Field', phone: 'N/A', address: 'Rawalpindi', email: 'walkin-copy@demo.pharm', note: 'WRONG: missing phone' },
    { name: 'Bad Email 001', phone: '0301-2000001', address: 'Multan', email: 'not-an-email', note: 'WRONG: invalid email' },
    { name: 'Bad Email 002', phone: '0301-2000002', address: 'Faisalabad', email: 'user@@domain..com', note: 'WRONG: invalid email' },
    { name: 'Bad Email 003', phone: '0301-2000003', address: 'Hyderabad', email: '@missing-local.com', note: 'WRONG: invalid email' },
    { name: 'Empty Address', phone: '0302-3000001', address: '', email: 'empty.addr@demo.pharm', note: 'WRONG: empty address' },
    { name: 'Whitespace Address', phone: '0302-3000002', address: '   ', email: 'space.addr@demo.pharm', note: 'WRONG: empty address' },
    { name: 'Sara Ali', phone: '0303-4000001', address: 'Gulshan, Karachi', email: 'sara@demo.pharm', note: 'WRONG: duplicate name' },
    { name: 'Sara Ali', phone: '0303-4000002', address: 'DHA, Karachi', email: 'sara.ali2@demo.pharm', note: 'WRONG: duplicate name' },
    { name: 'Combo Bad Record', phone: '', address: '', email: 'broken-email', note: 'WRONG: multiple issues' },
  ];

  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const template = templates[index % templates.length];
    rows.push({
      ...template,
      name: template.name || `WRONG Customer ${String(index + 1).padStart(3, '0')}`,
      note: template.note ?? `WRONG: generated issue ${index + 1}`,
    });
  }

  return rows;
}

/**
 * @returns {Medicine[]}
 */
export function buildDemoMedicines() {
  const validTarget = DEMO_COUNTS.products - DEMO_COUNTS.wrongProducts;
  const medicines = [];

  for (let index = 1; index <= validTarget; index += 1) {
    const form = MEDICINE_FORMS[(index - 1) % MEDICINE_FORMS.length];
    const stem = MEDICINE_STEMS[(index - 1) % MEDICINE_STEMS.length];
    const brand = BRAND_PREFIXES[(index - 1) % BRAND_PREFIXES.length];
    const strength = 50 + ((index * 13) % 450);
    const stock = 20 + ((index * 17) % 280);
    const lowStock = 5 + (index % 25);
    const purchasePrice = 40 + ((index * 11) % 640);
    const price = purchasePrice + 20 + (index % 90);
    const status = stock <= 0 ? 'Out of Stock' : stock <= lowStock ? 'Low Stock' : 'In Stock';

    medicines.push({
      id: index,
      sku: `SKU-${String(index).padStart(6, '0')}`,
      medicineName: `${brand}Rx ${stem} ${strength}mg ${form.suffix}`,
      genericName: stem,
      category: form.category,
      unit: form.unit,
      stock,
      lowStock,
      purchasePrice,
      price,
      description: `${stem} ${form.suffix.toLowerCase()} for ${form.category.toLowerCase()} dispensing.`,
      status,
      active: true,
    });
  }

  const wrongMedicines = buildWrongMedicines(DEMO_COUNTS.wrongProducts, validTarget);
  return [...medicines, ...wrongMedicines];
}

/**
 * @param {number} count
 * @param {number} idOffset
 * @returns {Medicine[]}
 */
function buildWrongMedicines(count, idOffset) {
  const templates = [
    {
      sku: 'SKU-000001',
      medicineName: 'WRONG Duplicate SKU A',
      genericName: 'Test',
      category: 'Pain Relief',
      unit: 'Tablet',
      stock: 20,
      lowStock: 5,
      purchasePrice: 100,
      price: 150,
      description: 'WRONG: duplicate SKU',
      status: 'In Stock',
      active: true,
      seedIssue: 'duplicate-sku',
    },
    {
      sku: 'SKU-000001',
      medicineName: 'WRONG Duplicate SKU B',
      genericName: 'Test',
      category: 'Antibiotic',
      unit: 'Tablet',
      stock: 15,
      lowStock: 5,
      purchasePrice: 110,
      price: 160,
      description: 'WRONG: duplicate SKU',
      status: 'In Stock',
      active: true,
      seedIssue: 'duplicate-sku',
    },
    {
      sku: 'SKU-NEG-001',
      medicineName: 'WRONG Negative Stock Syrup',
      genericName: 'Test',
      category: 'Cough & Cold',
      unit: 'Bottle',
      stock: -25,
      lowStock: 5,
      purchasePrice: 120,
      price: 180,
      description: 'WRONG: negative stock',
      status: 'In Stock',
      active: true,
      seedIssue: 'negative-stock',
    },
    {
      sku: 'SKU-NOCAT-001',
      medicineName: 'WRONG Missing Category Tablet',
      genericName: 'Test',
      category: '',
      unit: 'Tablet',
      stock: 30,
      lowStock: 5,
      purchasePrice: 80,
      price: 120,
      description: 'WRONG: missing category',
      status: 'In Stock',
      active: true,
      seedIssue: 'missing-category',
    },
    {
      sku: 'SKU-ZERO-001',
      medicineName: 'WRONG Zero Price Capsule',
      genericName: 'Test',
      category: 'General',
      unit: 'Capsule',
      stock: 40,
      lowStock: 10,
      purchasePrice: 90,
      price: 0,
      description: 'WRONG: zero price',
      status: 'In Stock',
      active: true,
      seedIssue: 'zero-price',
    },
    {
      sku: 'SKU-ZERO-002',
      medicineName: 'WRONG Zero Price Suspension',
      genericName: 'Test',
      category: 'Fever',
      unit: 'Bottle',
      stock: 12,
      lowStock: 5,
      purchasePrice: 0,
      price: 0,
      description: 'WRONG: zero price',
      status: 'In Stock',
      active: true,
      seedIssue: 'zero-price',
    },
  ];

  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length];
    return {
      ...template,
      id: idOffset + index + 1,
      sku: template.sku ?? `SKU-WRONG-${String(index + 1).padStart(4, '0')}`,
      medicineName: template.medicineName || `WRONG Medicine ${String(index + 1).padStart(3, '0')}`,
      description: template.description ?? `WRONG: generated product issue ${index + 1}`,
    };
  });
}

/**
 * @param {Medicine[]} medicines
 * @returns {PosMedicine[]}
 */
export function buildDemoPosCatalog(medicines) {
  return medicines
    .filter((medicine) => medicine.active !== false && medicine.medicineName.trim())
    .map((medicine) => ({
      id: medicine.id,
      name: medicine.medicineName,
      barcode: medicine.sku?.trim() || `MED-${String(medicine.id).padStart(5, '0')}`,
      category: medicine.category?.trim() || 'General',
      unit: medicine.unit,
      price: Math.max(0, Number(medicine.price) || 0),
      stock: Number(medicine.stock) || 0,
    }));
}

/**
 * @param {PosCustomer[]} customers
 * @param {PosMedicine[]} catalog
 * @param {(number: number) => string} formatInvoiceNumber
 * @param {(input: Record<string, unknown>) => unknown} createLine
 * @param {(input: Record<string, unknown>) => unknown} createSaleRecord
 * @param {(items: unknown[], draft: unknown) => { total: number }} calculateTotals
 * @param {(date: Date) => string} formatShortDateTime
 */
export function buildDemoCompletedSales(
  customers,
  catalog,
  formatInvoiceNumber,
  createLine,
  createSaleRecord,
  calculateTotals,
  formatShortDateTime,
) {
  const paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'JazzCash', 'EasyPaisa'];
  const validTarget = DEMO_COUNTS.invoices - DEMO_COUNTS.wrongInvoices;
  const todaySalesTarget = Math.min(360, Math.max(120, Math.round(validTarget * 0.08)));
  const seededCustomers = customers.length > 1 ? customers.slice(1) : customers;
  const catalogItems = catalog.length ? catalog : buildDemoPosCatalog(buildDemoMedicines());
  const sales = [];

  for (let index = 0; index < validTarget; index += 1) {
    const sequence = validTarget - index;
    const customer = seededCustomers[index % seededCustomers.length] ?? customers[0];
    const createdAt = new Date();
    if (index < todaySalesTarget) {
      createdAt.setHours(8 + (index % 13), (index * 7) % 60, 0, 0);
    } else {
      const dayOffset = Math.floor((index - todaySalesTarget) / 15) + 1;
      createdAt.setDate(createdAt.getDate() - dayOffset);
      createdAt.setHours(9 + (index % 11), (index * 7) % 60, 0, 0);
    }

    const items = Array.from({ length: 2 + (index % 3) }, (_, itemIndex) => {
      const medicine = catalogItems[(index + itemIndex) % catalogItems.length];
      return createLine({
        id: `seed-line-${sequence}-${itemIndex + 1}`,
        medicineId: medicine.id,
        name: medicine.name,
        barcode: medicine.barcode,
        category: medicine.category,
        unit: medicine.unit,
        price: medicine.price,
        qty: 1 + ((index + itemIndex) % 3),
        lineDiscount: itemIndex === 0 && index % 5 === 0 ? 5 : 0,
        stock: medicine.stock,
      });
    });

    sales.push(
      createSaleRecord({
        id: `seed-sale-${sequence}`,
        invoice: formatInvoiceNumber(sequence),
        status: 'Completed',
        items,
        draft: {
          customer,
          discountType: 'amount',
          discountValue: index % 6 === 0 ? 25 : 0,
          taxType: 'percentage',
          taxValue: index % 4 === 0 ? 2 : 0,
          paymentMethod: paymentMethods[index % paymentMethods.length],
          amountReceived: 0,
          notes: 'Generated demo invoice.',
        },
        createdAt: formatShortDateTime(createdAt),
      }),
    );
  }

  const wrongSales = buildWrongInvoices(
    DEMO_COUNTS.wrongInvoices,
    validTarget,
    customers,
    catalogItems,
    formatInvoiceNumber,
    createLine,
    createSaleRecord,
    calculateTotals,
    formatShortDateTime,
  );

  return [...sales, ...wrongSales];
}

function buildWrongInvoices(
  count,
  validTarget,
  customers,
  catalogItems,
  formatInvoiceNumber,
  createLine,
  createSaleRecord,
  calculateTotals,
  formatShortDateTime,
) {
  const paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'JazzCash', 'EasyPaisa'];
  const wrongCustomer = customers.find((customer) => customer.note?.startsWith('WRONG')) ?? customers[0];
  const duplicateInvoice = formatInvoiceNumber(101);
  const rows = [];

  for (let index = 0; index < count; index += 1) {
    const sequence = validTarget + count - index;
    const createdAt = new Date();
    if (index < Math.min(24, count)) {
      createdAt.setHours(8 + (index % 12), (index * 13) % 60, 0, 0);
    } else {
      createdAt.setDate(createdAt.getDate() - (validTarget + index));
      createdAt.setHours(8, (index * 11) % 60, 0, 0);
    }
    const issue = index % 8;

    let items = [];
    let invoice = formatInvoiceNumber(sequence);
    let draft = {
      customer: wrongCustomer,
      discountType: 'amount',
      discountValue: 0,
      taxType: 'percentage',
      taxValue: 0,
      paymentMethod: paymentMethods[index % paymentMethods.length],
      amountReceived: 0,
      notes: `WRONG: demo invoice issue ${index + 1}`,
    };

    if (issue === 0) {
      const medicine = catalogItems[index % catalogItems.length];
      items = [
        createLine({
          id: `seed-wrong-line-${sequence}-1`,
          medicineId: medicine.id,
          name: medicine.name,
          barcode: medicine.barcode,
          category: medicine.category,
          unit: medicine.unit,
          price: medicine.price,
          qty: 0,
          lineDiscount: 0,
          stock: medicine.stock,
        }),
      ];
      draft = { ...draft, notes: 'WRONG: zero quantity line item.' };
    } else if (issue === 1) {
      draft = {
        ...draft,
        customer: {
          name: 'Ghost Customer',
          phone: 'N/A',
          address: 'N/A',
          customerId: 999_999,
          note: 'WRONG: customer id does not exist',
        },
        notes: 'WRONG: wrong customer ID.',
      };
      const medicine = catalogItems[(index + 1) % catalogItems.length];
      items = [
        createLine({
          id: `seed-wrong-line-${sequence}-1`,
          medicineId: medicine.id,
          name: medicine.name,
          barcode: medicine.barcode,
          category: medicine.category,
          unit: medicine.unit,
          price: medicine.price,
          qty: 1,
          lineDiscount: 0,
          stock: medicine.stock,
        }),
      ];
    } else if (issue === 2) {
      items = [
        createLine({
          id: `seed-wrong-line-${sequence}-1`,
          medicineId: null,
          name: '',
          barcode: '',
          category: 'General',
          unit: 'Item',
          price: 0,
          qty: 1,
          lineDiscount: 0,
          stock: 0,
        }),
      ];
      draft = { ...draft, notes: 'WRONG: missing product on line item.' };
    } else if (issue === 3) {
      invoice = duplicateInvoice;
      const medicine = catalogItems[(index + 2) % catalogItems.length];
      items = [
        createLine({
          id: `seed-wrong-line-${sequence}-1`,
          medicineId: medicine.id,
          name: medicine.name,
          barcode: medicine.barcode,
          category: medicine.category,
          unit: medicine.unit,
          price: medicine.price,
          qty: 1,
          lineDiscount: 0,
          stock: medicine.stock,
        }),
      ];
      draft = { ...draft, notes: 'WRONG: duplicate invoice number.' };
    } else if (issue === 4) {
      draft = { ...draft, notes: 'WRONG: invoice with no line items.' };
    } else if (issue === 5) {
      const medicine = catalogItems[(index + 3) % catalogItems.length];
      items = [
        createLine({
          id: `seed-wrong-line-${sequence}-1`,
          medicineId: 9_999_999,
          name: 'Missing Catalog Product',
          barcode: 'SKU-MISSING-999',
          category: 'General',
          unit: 'Item',
          price: medicine.price,
          qty: 2,
          lineDiscount: 0,
          stock: 0,
        }),
      ];
      draft = { ...draft, notes: 'WRONG: missing product reference (invalid medicineId).' };
    } else if (issue === 6) {
      invoice = duplicateInvoice;
      draft = { ...draft, notes: 'WRONG: duplicate invoice number (second record).' };
    } else {
      const medicine = catalogItems[(index + 4) % catalogItems.length];
      items = [
        createLine({
          id: `seed-wrong-line-${sequence}-1`,
          medicineId: medicine.id,
          name: medicine.name,
          barcode: medicine.barcode,
          category: medicine.category,
          unit: medicine.unit,
          price: 0,
          qty: 0,
          lineDiscount: 0,
          stock: medicine.stock,
        }),
      ];
      draft = { ...draft, notes: 'WRONG: zero quantity and zero price.' };
    }

    const sale = createSaleRecord({
      id: `seed-wrong-sale-${sequence}`,
      invoice,
      status: 'Completed',
      items,
      draft,
      createdAt: formatShortDateTime(createdAt),
    });

    if (items.length > 0) {
      const totals = calculateTotals(items, draft);
      sale.total = totals.total;
      sale.subtotal = totals.subtotal;
      sale.discountAmount = totals.discountAmount;
      sale.taxAmount = totals.taxAmount;
    }

    rows.push(sale);
  }

  return rows;
}

/**
 * @param {PosCustomer} customer
 */
function customerKey(customer) {
  return `${customer.name.trim().toLowerCase()}|${customer.phone.trim().toLowerCase()}`;
}

/**
 * Build API store seed with products, batches, and stock movements.
 * This targets backend inventory workflow testing at high volume.
 */
export function buildInventoryStoreSeed() {
  const medicines = buildDemoMedicines();
  const validMovementTarget =
    DEMO_INVENTORY_COUNTS.stockEntries - DEMO_INVENTORY_COUNTS.wrongStockEntries;

  const categories = buildCategories();
  const suppliers = buildSuppliers();
  const products = buildProductsFromMedicines(medicines, categories);
  const batches = [];
  const stockMovements = [];

  let batchId = 1;
  let movementId = 1;
  let openingCounter = 1;
  let purchaseCounter = 1;
  let transferCounter = 1;
  let adjustmentCounter = 1;

  // Opening stock: one baseline batch per product.
  for (const product of products) {
    const supplierId = suppliers[(product.id - 1) % suppliers.length].id;
    const openingQty = 10 + (product.id % 80);
    const expiry = futureIsoDate(360 + (product.id % 900));
    const batch = {
      id: batchId++,
      batchNumber: `OP-${String(product.id).padStart(5, '0')}`,
      productId: product.id,
      supplierId,
      manufacturedAt: pastIsoDate(180 + (product.id % 240)),
      expiryDate: expiry,
      purchasePrice: String(20 + (product.id % 500)),
      sellingPrice: String(40 + (product.id % 700)),
      quantityOnHand: openingQty,
      receivedAt: nowIsoDateMinusDays(30 + (product.id % 180)),
    };
    batches.push(batch);
    stockMovements.push({
      id: movementId++,
      batchId: batch.id,
      movementType: 'RECEIVE',
      quantity: openingQty,
      reference: `OPEN-${String(openingCounter++).padStart(6, '0')}`,
      note: 'Opening stock',
      createdAt: batch.receivedAt,
    });
  }

  let validMovements = stockMovements.length;
  while (validMovements < validMovementTarget) {
    const product = products[validMovements % products.length];
    const supplier = suppliers[validMovements % suppliers.length];
    const movePattern = validMovements % 5;

    if (movePattern <= 1) {
      // Purchase stock receive on new batch.
      const qty = 20 + (validMovements % 140);
      const batch = {
        id: batchId++,
        batchNumber: `PR-${String(product.id).padStart(5, '0')}-${String(purchaseCounter).padStart(4, '0')}`,
        productId: product.id,
        supplierId: supplier.id,
        manufacturedAt: pastIsoDate(60 + (validMovements % 240)),
        expiryDate: futureIsoDate(180 + (validMovements % 720)),
        purchasePrice: String(30 + (validMovements % 550)),
        sellingPrice: String(55 + (validMovements % 800)),
        quantityOnHand: qty,
        receivedAt: nowIsoDateMinusDays(validMovements % 120),
      };
      batches.push(batch);
      stockMovements.push({
        id: movementId++,
        batchId: batch.id,
        movementType: 'RECEIVE',
        quantity: qty,
        reference: `PUR-${String(purchaseCounter++).padStart(6, '0')}`,
        note: 'Purchase stock',
        createdAt: batch.receivedAt,
      });
      validMovements += 1;
      continue;
    }

    const batch = batches[validMovements % batches.length];
    if (!batch) {
      break;
    }

    if (movePattern === 2) {
      // Transfer stock simulated as paired adjustments on same batch.
      const qty = 1 + (validMovements % 30);
      batch.quantityOnHand = Math.max(0, batch.quantityOnHand - qty) + qty;
      const ref = `TRF-${String(transferCounter++).padStart(6, '0')}`;
      stockMovements.push({
        id: movementId++,
        batchId: batch.id,
        movementType: 'ADJUSTMENT',
        quantity: -qty,
        reference: ref,
        note: 'Transfer stock out',
        createdAt: nowIsoDateMinusDays(validMovements % 45),
      });
      validMovements += 1;
      if (validMovements >= validMovementTarget) break;
      stockMovements.push({
        id: movementId++,
        batchId: batch.id,
        movementType: 'ADJUSTMENT',
        quantity: qty,
        reference: ref,
        note: 'Transfer stock in',
        createdAt: nowIsoDateMinusDays(validMovements % 45),
      });
      validMovements += 1;
      continue;
    }

    if (movePattern === 3) {
      // Regular adjustment.
      const qty = (validMovements % 21) - 10;
      const normalizedQty = qty === 0 ? 3 : qty;
      batch.quantityOnHand = Math.max(0, batch.quantityOnHand + normalizedQty);
      stockMovements.push({
        id: movementId++,
        batchId: batch.id,
        movementType: 'ADJUSTMENT',
        quantity: normalizedQty,
        reference: `ADJ-${String(adjustmentCounter++).padStart(6, '0')}`,
        note: 'Inventory adjustment',
        createdAt: nowIsoDateMinusDays(validMovements % 60),
      });
      validMovements += 1;
      continue;
    }

    // Sale/dispense movement.
    const qty = Math.min(batch.quantityOnHand, 1 + (validMovements % 6));
    if (qty <= 0) {
      continue;
    }
    batch.quantityOnHand -= qty;
    stockMovements.push({
      id: movementId++,
      batchId: batch.id,
      movementType: 'DISPENSE',
      quantity: qty,
      reference: `SAL-${String(validMovements).padStart(6, '0')}`,
      note: 'Sale dispense',
      createdAt: nowIsoDateMinusDays(validMovements % 30),
    });
    validMovements += 1;
  }

  const wrongRecords = buildWrongStockMovements(
    DEMO_INVENTORY_COUNTS.wrongStockEntries,
    batches,
    movementId,
  );
  stockMovements.push(...wrongRecords);

  const counters = {
    category: categories.length + 1,
    supplier: suppliers.length + 1,
    product: products.length + 1,
    batch: batches.length + 1,
    stockMovement: stockMovements.length + 1,
  };

  return { counters, categories, suppliers, products, batches, stockMovements };
}

function buildWrongStockMovements(count, batches, movementIdStart) {
  const wrong = [];
  for (let index = 0; index < count; index += 1) {
    const baseBatch = batches[index % batches.length];
    const issue = index % 10;
    let entry = {
      id: movementIdStart + index,
      batchId: baseBatch?.id ?? 1,
      movementType: 'ADJUSTMENT',
      quantity: 1,
      reference: `WRONG-${String(index + 1).padStart(5, '0')}`,
      note: 'WRONG: generic stock issue',
      createdAt: nowIsoDateMinusDays(index % 20),
    };

    if (issue === 0) entry = { ...entry, quantity: -50, note: 'WRONG: negative stock movement' };
    if (issue === 1) entry = { ...entry, movementType: 'RECEIVE', quantity: -20, note: 'WRONG: negative purchase qty' };
    if (issue === 2) entry = { ...entry, batchId: 9_999_999, note: 'WRONG: wrong product/batch mapping' };
    if (issue === 3) entry = { ...entry, quantity: 0, note: 'WRONG: zero stock entry' };
    if (issue === 4) entry = { ...entry, quantity: 500_000, note: 'WRONG: very large stock quantity' };
    if (issue === 5) entry = { ...entry, reference: '', note: 'WRONG: missing batch number/reference' };
    if (issue === 6) entry = { ...entry, note: 'WRONG: wrong supplier mapping' };
    if (issue === 7) entry = { ...entry, movementType: 'DISPENSE', quantity: 99999, note: 'WRONG: over-dispense impossible qty' };
    if (issue === 8) entry = { ...entry, note: 'WRONG: duplicate batch number context' };
    if (issue === 9) entry = { ...entry, createdAt: '', note: 'WRONG: missing expiry/date context' };

    wrong.push(entry);
  }
  return wrong;
}

function buildCategories() {
  const names = [
    'Pain Relief',
    'Antibiotic',
    'Cough & Cold',
    'Fever',
    'Allergy',
    'Cardiac',
    'Diabetes',
    'Respiratory',
    'Gastro',
    'Dermatology',
    'General',
  ];

  return names.map((name, index) => ({
    id: index + 1,
    name,
    createdAt: nowIsoDateMinusDays(600 - index),
    updatedAt: nowIsoDateMinusDays(300 - index),
  }));
}

function buildSuppliers() {
  return Array.from({ length: 80 }, (_, idx) => {
    const id = idx + 1;
    return {
      id,
      name: `Supplier ${String(id).padStart(3, '0')}`,
      contactName: `Contact ${String(id).padStart(3, '0')}`,
      email: `supplier${String(id).padStart(3, '0')}@demo.pharm`,
      phone: `03${String(10 + (id % 80)).padStart(2, '0')}-8${String(id).padStart(6, '0')}`,
      address: `Warehouse ${id}, Karachi`,
      createdAt: nowIsoDateMinusDays(500 - (id % 240)),
      updatedAt: nowIsoDateMinusDays(100 - (id % 60)),
    };
  });
}

function buildProductsFromMedicines(medicines, categories) {
  const categoryMap = new Map(categories.map((cat) => [cat.name.toLowerCase(), cat.id]));
  return medicines.map((medicine, idx) => {
    const categoryId = categoryMap.get((medicine.category || 'general').trim().toLowerCase()) ?? categoryMap.get('general');
    return {
      id: idx + 1,
      sku: medicine.sku || `SKU-${String(idx + 1).padStart(6, '0')}`,
      barcode: `BAR-${String(idx + 1).padStart(7, '0')}`,
      name: medicine.medicineName,
      description: medicine.description ?? '',
      strength: `${50 + ((idx + 1) % 400)}mg`,
      form: medicine.unit,
      unit: medicine.unit,
      requiresPrescription: idx % 4 === 0,
      reorderLevel: 5 + ((idx + 1) % 20),
      categoryId,
      createdAt: nowIsoDateMinusDays(420 - ((idx + 1) % 200)),
      updatedAt: nowIsoDateMinusDays(60 - ((idx + 1) % 30)),
    };
  });
}

function nowIsoDateMinusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function futureIsoDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function pastIsoDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
