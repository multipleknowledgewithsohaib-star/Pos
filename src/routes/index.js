import { Router } from 'express';
import categoriesRouter from './categories.js';
import suppliersRouter from './suppliers.js';
import productsRouter from './products.js';
import batchesRouter from './batches.js';
import stockMovementsRouter from './stock-movements.js';
import { getRawState } from '../lib/prisma.js';

const router = Router();

router.get('/dashboard/summary', (req, res) => {
  const state = getRawState();
  
  const stockByProduct = new Map();
  for (const batch of state.batches) {
    stockByProduct.set(
      batch.productId,
      (stockByProduct.get(batch.productId) ?? 0) + Number(batch.quantityOnHand),
    );
  }
  
  const lowStock = state.products.filter((product) => {
    const quantity = stockByProduct.get(product.id) ?? 0;
    return product.reorderLevel > 0 ? quantity <= product.reorderLevel : quantity === 0;
  }).length;
  
  const now = Date.now();
  const ninetyDays = 1000 * 60 * 60 * 24 * 90;
  const expiringSoon = state.batches.filter((batch) => {
    const expiry = new Date(batch.expiryDate).getTime();
    return Number.isFinite(expiry) && expiry >= now && expiry <= now + ninetyDays;
  }).length;
  
  const totalStock = state.batches.reduce(
    (sum, batch) => sum + Number(batch.quantityOnHand || 0),
    0,
  );
  
  const recentMovementsRaw = state.stockMovements.slice(-5).reverse();
  const recentMovements = recentMovementsRaw.map((m) => {
    const batch = state.batches.find((b) => b.id === m.batchId);
    const product = batch ? state.products.find((p) => p.id === batch.productId) : null;
    return {
      id: m.id,
      movementType: m.movementType,
      quantity: m.quantity,
      reference: m.reference,
      createdAt: m.createdAt,
      batch: batch ? {
        batchNumber: batch.batchNumber,
        product: product ? {
          name: product.name
        } : null
      } : null
    };
  });

  res.json({
    online: true,
    databaseOnline: true,
    categories: state.categories.length,
    suppliers: state.suppliers.length,
    products: state.products.length,
    batches: state.batches.length,
    movements: state.stockMovements.length,
    activeModules: 7,
    lowStock,
    expiringSoon,
    totalStock,
    recentMovements
  });
});

router.get('/', (req, res) => {
  res.json({
    service: 'Pharma API',
    resources: {
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      products: '/api/products',
      batches: '/api/batches',
      stockMovements: '/api/stock-movements',
      dashboardSummary: '/api/dashboard/summary',
    },
  });
});

router.use('/categories', categoriesRouter);
router.use('/suppliers', suppliersRouter);
router.use('/products', productsRouter);
router.use('/batches', batchesRouter);
router.use('/stock-movements', stockMovementsRouter);

export default router;
