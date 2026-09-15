import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiError } from './api-error.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const storePath = resolve(
  rootDir,
  process.env.STORE_PATH ?? 'data/pharma-store.json',
);

function createEmptyState() {
  return {
    counters: {
      category: 1,
      supplier: 1,
      product: 1,
      batch: 1,
      stockMovement: 1,
    },
    categories: [],
    suppliers: [],
    products: [],
    batches: [],
    stockMovements: [],
  };
}

function normalizeCounter(value, items) {
  const maxId = items.reduce(
    (max, item) => Math.max(max, Number(item.id) || 0),
    0,
  );

  if (!Number.isInteger(value) || value <= maxId) {
    return maxId + 1;
  }

  return value;
}

function normalizeState(raw) {
  const state = createEmptyState();

  if (!raw || typeof raw !== 'object') {
    return state;
  }

  if (Array.isArray(raw.categories)) state.categories = raw.categories;
  if (Array.isArray(raw.suppliers)) state.suppliers = raw.suppliers;
  if (Array.isArray(raw.products)) state.products = raw.products;
  if (Array.isArray(raw.batches)) state.batches = raw.batches;
  if (Array.isArray(raw.stockMovements)) state.stockMovements = raw.stockMovements;

  const counters = raw.counters && typeof raw.counters === 'object' ? raw.counters : {};
  state.counters.category = normalizeCounter(
    counters.category,
    state.categories,
  );
  state.counters.supplier = normalizeCounter(
    counters.supplier,
    state.suppliers,
  );
  state.counters.product = normalizeCounter(counters.product, state.products);
  state.counters.batch = normalizeCounter(counters.batch, state.batches);
  state.counters.stockMovement = normalizeCounter(
    counters.stockMovement,
    state.stockMovements,
  );

  return state;
}

function persistState(state) {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function loadState() {
  if (!existsSync(storePath)) {
    const fresh = createEmptyState();
    persistState(fresh);
    return fresh;
  }

  try {
    const raw = readFileSync(storePath, 'utf8');
    if (!raw.trim()) {
      const fresh = createEmptyState();
      persistState(fresh);
      return fresh;
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    const fresh = createEmptyState();
    persistState(fresh);
    return fresh;
  }
}

function replaceState(target, next) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, next);
}

let state = loadState();

function clone(value) {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeStringValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value?.toString === 'function') {
    return value.toString();
  }

  return String(value);
}

function normalizeDateValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function nextId(db, key) {
  const current = db.counters[key];
  db.counters[key] += 1;
  return current;
}

function selectFields(record, select) {
  const out = {};

  for (const [key, enabled] of Object.entries(select ?? {})) {
    if (enabled) {
      out[key] = clone(record[key]);
    }
  }

  return out;
}

function normalizeRelationOptions(options) {
  if (!options || options === true) {
    return {};
  }

  if (typeof options === 'object' && options.include) {
    return options.include;
  }

  return options;
}

function findCategoryRaw(db, id) {
  return db.categories.find((item) => item.id === id) ?? null;
}

function findSupplierRaw(db, id) {
  return db.suppliers.find((item) => item.id === id) ?? null;
}

function findProductRaw(db, id) {
  return db.products.find((item) => item.id === id) ?? null;
}

function findBatchRaw(db, id) {
  return db.batches.find((item) => item.id === id) ?? null;
}

function findMovementRaw(db, id) {
  return db.stockMovements.find((item) => item.id === id) ?? null;
}

function countProductsForCategory(db, categoryId) {
  return db.products.filter((product) => product.categoryId === categoryId).length;
}

function countBatchesForSupplier(db, supplierId) {
  return db.batches.filter((batch) => batch.supplierId === supplierId).length;
}

function countBatchesForProduct(db, productId) {
  return db.batches.filter((batch) => batch.productId === productId).length;
}

function countMovementsForBatch(db, batchId) {
  return db.stockMovements.filter((movement) => movement.batchId === batchId).length;
}

function getCategoryByIdOrThrow(db, id) {
  const category = findCategoryRaw(db, id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
}

function getSupplierByIdOrThrow(db, id) {
  const supplier = findSupplierRaw(db, id);
  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }
  return supplier;
}

function getProductByIdOrThrow(db, id) {
  const product = findProductRaw(db, id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
}

function getBatchByIdOrThrow(db, id) {
  const batch = findBatchRaw(db, id);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }
  return batch;
}

function getMovementByIdOrThrow(db, id) {
  const movement = findMovementRaw(db, id);
  if (!movement) {
    throw new ApiError(404, 'Stock movement not found');
  }
  return movement;
}

function shapeCategory(db, category, options = {}) {
  const include = normalizeRelationOptions(options);
  const result = clone(category);

  if (include._count) {
    result._count = {
      products: countProductsForCategory(db, category.id),
    };
  }

  return result;
}

function shapeSupplier(db, supplier, options = {}) {
  const include = normalizeRelationOptions(options);
  const result = clone(supplier);

  if (include.batches) {
    result.batches = db.batches
      .filter((batch) => batch.supplierId === supplier.id)
      .slice()
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .map((batch) => shapeBatch(db, batch, include.batches));
  }

  if (include._count) {
    result._count = {
      batches: countBatchesForSupplier(db, supplier.id),
    };
  }

  return result;
}

function shapeProduct(db, product, options = {}) {
  const include = normalizeRelationOptions(options);
  const result = clone(product);

  if (include.category) {
    const category = findCategoryRaw(db, product.categoryId);
    result.category = category ? clone(category) : null;
  }

  if (include.batches) {
    result.batches = db.batches
      .filter((batch) => batch.productId === product.id)
      .slice()
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .map((batch) => shapeBatch(db, batch, include.batches));
  }

  if (include._count) {
    result._count = {
      batches: countBatchesForProduct(db, product.id),
    };
  }

  return result;
}

function shapeBatch(db, batch, options = {}) {
  const include = normalizeRelationOptions(options);
  const result = clone(batch);

  if (include.product) {
    const product = findProductRaw(db, batch.productId);
    result.product = product ? shapeProduct(db, product, include.product) : null;
  }

  if (include.supplier) {
    const supplier = findSupplierRaw(db, batch.supplierId);
    result.supplier = supplier ? clone(supplier) : null;
  }

  if (include.movements) {
    result.movements = db.stockMovements
      .filter((movement) => movement.batchId === batch.id)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((movement) => shapeMovement(db, movement, include.movements));
  }

  if (include._count) {
    result._count = {
      movements: countMovementsForBatch(db, batch.id),
    };
  }

  return result;
}

function shapeMovement(db, movement, options = {}) {
  const include = normalizeRelationOptions(options);
  const result = clone(movement);

  if (include.batch) {
    const batch = findBatchRaw(db, movement.batchId);
    result.batch = batch ? shapeBatch(db, batch, include.batch) : null;
  }

  return result;
}

function createCategoryRecord(db, data) {
  if (db.categories.some((category) => category.name === data.name)) {
    throw new ApiError(409, 'A category with that name already exists');
  }

  const record = {
    id: nextId(db, 'category'),
    name: data.name,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.categories.push(record);
  return record;
}

function updateCategoryRecord(db, id, data) {
  const category = getCategoryByIdOrThrow(db, id);

  if (
    Object.prototype.hasOwnProperty.call(data, 'name') &&
    db.categories.some((item) => item.id !== id && item.name === data.name)
  ) {
    throw new ApiError(409, 'A category with that name already exists');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    category.name = data.name;
  }

  category.updatedAt = nowIso();
  return category;
}

function deleteCategoryRecord(db, id) {
  const category = getCategoryByIdOrThrow(db, id);
  db.categories = db.categories.filter((item) => item.id !== id);

  for (const product of db.products) {
    if (product.categoryId === id) {
      product.categoryId = null;
      product.updatedAt = nowIso();
    }
  }

  return category;
}

function createSupplierRecord(db, data) {
  if (data.email && db.suppliers.some((supplier) => supplier.email === data.email)) {
    throw new ApiError(409, 'A supplier with that email already exists');
  }

  const record = {
    id: nextId(db, 'supplier'),
    name: data.name,
    contactName: data.contactName ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.suppliers.push(record);
  return record;
}

function updateSupplierRecord(db, id, data) {
  const supplier = getSupplierByIdOrThrow(db, id);

  if (
    Object.prototype.hasOwnProperty.call(data, 'email') &&
    data.email &&
    db.suppliers.some((item) => item.id !== id && item.email === data.email)
  ) {
    throw new ApiError(409, 'A supplier with that email already exists');
  }

  for (const field of ['name', 'contactName', 'email', 'phone', 'address']) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      supplier[field] = data[field];
    }
  }

  supplier.updatedAt = nowIso();
  return supplier;
}

function deleteSupplierRecord(db, id) {
  const supplier = getSupplierByIdOrThrow(db, id);
  db.suppliers = db.suppliers.filter((item) => item.id !== id);

  for (const batch of db.batches) {
    if (batch.supplierId === id) {
      batch.supplierId = null;
    }
  }

  return supplier;
}

function createProductRecord(db, data) {
  if (db.products.some((product) => product.sku === data.sku)) {
    throw new ApiError(409, 'A product with that SKU already exists');
  }

  if (
    data.barcode &&
    db.products.some((product) => product.barcode === data.barcode)
  ) {
    throw new ApiError(409, 'A product with that barcode already exists');
  }

  if (data.categoryId !== null && data.categoryId !== undefined) {
    getCategoryByIdOrThrow(db, data.categoryId);
  }

  const record = {
    id: nextId(db, 'product'),
    sku: data.sku,
    barcode: data.barcode ?? null,
    name: data.name,
    description: data.description ?? null,
    strength: data.strength ?? null,
    form: data.form ?? null,
    unit: data.unit ?? 'piece',
    requiresPrescription: data.requiresPrescription ?? false,
    reorderLevel: data.reorderLevel ?? 0,
    categoryId: data.categoryId ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.products.push(record);
  return record;
}

function updateProductRecord(db, id, data) {
  const product = getProductByIdOrThrow(db, id);

  if (
    Object.prototype.hasOwnProperty.call(data, 'sku') &&
    db.products.some((item) => item.id !== id && item.sku === data.sku)
  ) {
    throw new ApiError(409, 'A product with that SKU already exists');
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'barcode') &&
    data.barcode &&
    db.products.some((item) => item.id !== id && item.barcode === data.barcode)
  ) {
    throw new ApiError(409, 'A product with that barcode already exists');
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'categoryId') &&
    data.categoryId !== null &&
    data.categoryId !== undefined
  ) {
    getCategoryByIdOrThrow(db, data.categoryId);
  }

  for (const field of [
    'sku',
    'barcode',
    'name',
    'description',
    'strength',
    'form',
    'unit',
    'requiresPrescription',
    'reorderLevel',
    'categoryId',
  ]) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      product[field] = data[field];
    }
  }

  product.updatedAt = nowIso();
  return product;
}

function deleteProductRecord(db, id) {
  const product = getProductByIdOrThrow(db, id);
  const batchIds = db.batches
    .filter((batch) => batch.productId === id)
    .map((batch) => batch.id);

  for (const batchId of batchIds) {
    deleteBatchRecord(db, batchId);
  }

  db.products = db.products.filter((item) => item.id !== id);
  return product;
}

function createMovementRecord(db, data, { adjustBatch = true } = {}) {
  const batch = getBatchByIdOrThrow(db, data.batchId);

  let quantity = data.quantity;
  let delta = quantity;

  if (data.movementType === 'DISPENSE') {
    if (quantity > batch.quantityOnHand) {
      throw new ApiError(400, 'Not enough stock to dispense that quantity');
    }

    delta = -quantity;
  } else if (data.movementType === 'ADJUSTMENT') {
    if (quantity === 0) {
      throw new ApiError(400, 'quantity cannot be 0 for an adjustment');
    }

    delta = quantity;
  }

  if (adjustBatch) {
    batch.quantityOnHand += delta;
  }

  const record = {
    id: nextId(db, 'stockMovement'),
    batchId: batch.id,
    movementType: data.movementType,
    quantity,
    reference: data.reference ?? null,
    note: data.note ?? null,
    createdAt: nowIso(),
  };

  db.stockMovements.push(record);
  return record;
}

function deleteBatchRecord(db, id) {
  const batch = getBatchByIdOrThrow(db, id);
  db.batches = db.batches.filter((item) => item.id !== id);
  db.stockMovements = db.stockMovements.filter(
    (movement) => movement.batchId !== id,
  );
  return batch;
}

function createBatchRecord(db, data) {
  getProductByIdOrThrow(db, data.productId);

  if (data.supplierId !== null && data.supplierId !== undefined) {
    getSupplierByIdOrThrow(db, data.supplierId);
  }

  if (
    db.batches.some(
      (batch) =>
        batch.productId === data.productId &&
        batch.batchNumber === data.batchNumber,
    )
  ) {
    throw new ApiError(
      409,
      'A batch with that number already exists for this product',
    );
  }

  const record = {
    id: nextId(db, 'batch'),
    batchNumber: data.batchNumber,
    productId: data.productId,
    supplierId: data.supplierId ?? null,
    manufacturedAt: data.manufacturedAt ?? null,
    expiryDate: data.expiryDate,
    purchasePrice: normalizeStringValue(data.purchasePrice),
    sellingPrice: normalizeStringValue(data.sellingPrice),
    quantityOnHand: data.quantityOnHand ?? 0,
    receivedAt: nowIso(),
  };

  db.batches.push(record);

  if (record.quantityOnHand > 0) {
    createMovementRecord(
      db,
      {
        batchId: record.id,
        movementType: 'RECEIVE',
        quantity: record.quantityOnHand,
        reference: 'INITIAL_STOCK',
        note: 'Initial stock recorded during batch creation',
      },
      { adjustBatch: false },
    );
  }

  return record;
}

function updateBatchRecord(db, id, data) {
  const batch = getBatchByIdOrThrow(db, id);

  if (Object.prototype.hasOwnProperty.call(data, 'batchNumber')) {
    if (
      db.batches.some(
        (item) =>
          item.id !== id &&
          item.productId === batch.productId &&
          item.batchNumber === data.batchNumber,
      )
    ) {
      throw new ApiError(
        409,
        'A batch with that number already exists for this product',
      );
    }

    batch.batchNumber = data.batchNumber;
  }

  for (const field of [
    'supplierId',
    'manufacturedAt',
    'expiryDate',
    'purchasePrice',
    'sellingPrice',
  ]) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      batch[field] =
        field === 'purchasePrice' || field === 'sellingPrice'
          ? normalizeStringValue(data[field])
          : data[field];
    }
  }

  return batch;
}

function listCategories(db, options = {}) {
  return db.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => shapeCategory(db, category, options));
}

function listSuppliers(db, options = {}) {
  return db.suppliers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((supplier) => shapeSupplier(db, supplier, options));
}

function listProducts(db, options = {}) {
  return db.products
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => shapeProduct(db, product, options));
}

function listBatches(db, options = {}) {
  return db.batches
    .slice()
    .sort(
      (a, b) =>
        a.expiryDate.localeCompare(b.expiryDate) ||
        b.receivedAt.localeCompare(a.receivedAt),
    )
    .map((batch) => shapeBatch(db, batch, options));
}

function listMovements(db, options = {}) {
  return db.stockMovements
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((movement) => shapeMovement(db, movement, options));
}

function makeClient(db, persist) {
  const save = () => {
    if (persist) {
      persistState(db);
    }
  };

  return {
    category: {
      findMany: async (args = {}) => listCategories(db, args.include ?? {}),
      findUnique: async (args = {}) => {
        const record = args.where?.id
          ? findCategoryRaw(db, args.where.id)
          : null;
        if (!record) return null;
        if (args.select) return selectFields(record, args.select);
        return shapeCategory(db, record, args.include ?? {});
      },
      create: async (args = {}) => {
        const record = createCategoryRecord(db, args.data ?? {});
        save();
        return clone(record);
      },
      update: async (args = {}) => {
        const record = updateCategoryRecord(db, args.where?.id, args.data ?? {});
        save();
        return clone(record);
      },
      delete: async (args = {}) => {
        const record = deleteCategoryRecord(db, args.where?.id);
        save();
        return clone(record);
      },
    },
    supplier: {
      findMany: async (args = {}) => listSuppliers(db, args.include ?? {}),
      findUnique: async (args = {}) => {
        const record = args.where?.id
          ? findSupplierRaw(db, args.where.id)
          : null;
        if (!record) return null;
        if (args.select) return selectFields(record, args.select);
        return shapeSupplier(db, record, args.include ?? {});
      },
      create: async (args = {}) => {
        const record = createSupplierRecord(db, args.data ?? {});
        save();
        return clone(record);
      },
      update: async (args = {}) => {
        const record = updateSupplierRecord(db, args.where?.id, args.data ?? {});
        save();
        return clone(record);
      },
      delete: async (args = {}) => {
        const record = deleteSupplierRecord(db, args.where?.id);
        save();
        return clone(record);
      },
    },
    product: {
      findMany: async (args = {}) => listProducts(db, args.include ?? {}),
      findUnique: async (args = {}) => {
        const record = args.where?.id
          ? findProductRaw(db, args.where.id)
          : null;
        if (!record) return null;
        if (args.select) return selectFields(record, args.select);
        return shapeProduct(db, record, args.include ?? {});
      },
      create: async (args = {}) => {
        const record = createProductRecord(db, args.data ?? {});
        save();
        return clone(record);
      },
      update: async (args = {}) => {
        const record = updateProductRecord(db, args.where?.id, args.data ?? {});
        save();
        return clone(record);
      },
      delete: async (args = {}) => {
        const record = deleteProductRecord(db, args.where?.id);
        save();
        return clone(record);
      },
    },
    batch: {
      findMany: async (args = {}) => listBatches(db, args.include ?? {}),
      findUnique: async (args = {}) => {
        const record = args.where?.id ? findBatchRaw(db, args.where.id) : null;
        if (!record) return null;
        if (args.select) return selectFields(record, args.select);
        return shapeBatch(db, record, args.include ?? {});
      },
      create: async (args = {}) => {
        const record = createBatchRecord(db, args.data ?? {});
        save();
        return clone(record);
      },
      update: async (args = {}) => {
        const record = updateBatchRecord(db, args.where?.id, args.data ?? {});
        save();
        return clone(record);
      },
      delete: async (args = {}) => {
        const record = deleteBatchRecord(db, args.where?.id);
        save();
        return clone(record);
      },
    },
    stockMovement: {
      findMany: async (args = {}) => listMovements(db, args.include ?? {}),
      findUnique: async (args = {}) => {
        const record = args.where?.id
          ? findMovementRaw(db, args.where.id)
          : null;
        if (!record) return null;
        if (args.select) return selectFields(record, args.select);
        return shapeMovement(db, record, args.include ?? {});
      },
      create: async (args = {}) => {
        const record = createMovementRecord(db, args.data ?? {});
        save();
        return clone(record);
      },
    },
    $queryRaw: async () => [{ 1: 1 }],
    $queryRawUnsafe: async () => [{ 1: 1 }],
    $transaction: async (callback) => {
      const snapshot = clone(db);
      const tx = makeClient(snapshot, false);
      const result = await callback(tx);
      replaceState(state, snapshot);
      persistState(state);
      return result;
    },
    $disconnect: async () => {},
  };
}

export function resetStore() {
  const fresh = createEmptyState();
  replaceState(state, fresh);
  persistState(state);
  return clone(state);
}

export const prisma = makeClient(state, true);

export function getRawState() {
  return state;
}
