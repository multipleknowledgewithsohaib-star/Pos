import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/async-handler.js';
import { ApiError } from '../lib/api-error.js';
import {
  dateField,
  decimalField,
  integerField,
  parseId,
  stringField,
} from '../lib/validators.js';

const router = Router();

async function ensureProductExists(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(400, 'productId does not reference an existing product');
  }
}

async function ensureSupplierExists(supplierId) {
  if (supplierId === null || supplierId === undefined) {
    return;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true },
  });

  if (!supplier) {
    throw new ApiError(400, 'supplierId does not reference an existing supplier');
  }
}

async function getBatchOrThrow(id) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      supplier: true,
      movements: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  return batch;
}

function buildBatchData(body, { forUpdate = false } = {}) {
  const data = {};

  if (Object.hasOwn(body, 'batchNumber')) {
    data.batchNumber = stringField(body.batchNumber, 'batchNumber', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'productId')) {
    data.productId = integerField(body.productId, 'productId', {
      required: !forUpdate,
      min: 1,
    });
  }

  if (Object.hasOwn(body, 'supplierId')) {
    data.supplierId = integerField(body.supplierId, 'supplierId', {
      allowNull: true,
      min: 1,
    });
  }

  if (Object.hasOwn(body, 'manufacturedAt')) {
    data.manufacturedAt = dateField(body.manufacturedAt, 'manufacturedAt', {
      allowNull: true,
    });
  }

  if (Object.hasOwn(body, 'expiryDate')) {
    data.expiryDate = dateField(body.expiryDate, 'expiryDate', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'purchasePrice')) {
    data.purchasePrice = decimalField(body.purchasePrice, 'purchasePrice', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'sellingPrice')) {
    data.sellingPrice = decimalField(body.sellingPrice, 'sellingPrice', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'quantityOnHand')) {
    data.quantityOnHand = integerField(body.quantityOnHand, 'quantityOnHand', {
      min: 0,
      required: !forUpdate,
    });
  }

  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const batches = await prisma.batch.findMany({
      orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'desc' }],
      include: {
        product: {
          include: {
            category: true,
          },
        },
        supplier: true,
        _count: {
          select: {
            movements: true,
          },
        },
      },
    });

    res.json({ data: batches });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const data = buildBatchData(body);

    if (!Object.hasOwn(data, 'batchNumber')) {
      throw new ApiError(400, 'batchNumber is required');
    }

    if (!Object.hasOwn(data, 'productId')) {
      throw new ApiError(400, 'productId is required');
    }

    if (!Object.hasOwn(data, 'expiryDate')) {
      throw new ApiError(400, 'expiryDate is required');
    }

    if (!Object.hasOwn(data, 'purchasePrice')) {
      throw new ApiError(400, 'purchasePrice is required');
    }

    if (!Object.hasOwn(data, 'sellingPrice')) {
      throw new ApiError(400, 'sellingPrice is required');
    }

    if (!Object.hasOwn(data, 'quantityOnHand')) {
      data.quantityOnHand = 0;
    }

    await ensureProductExists(data.productId);
    await ensureSupplierExists(data.supplierId);

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.batch.create({
        data,
      });

      if (createdBatch.quantityOnHand > 0) {
        await tx.stockMovement.create({
          data: {
            batchId: createdBatch.id,
            movementType: 'RECEIVE',
            quantity: createdBatch.quantityOnHand,
            reference: 'INITIAL_STOCK',
            note: 'Initial stock recorded during batch creation',
          },
        });
      }

      return tx.batch.findUnique({
        where: { id: createdBatch.id },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          supplier: true,
          movements: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    });

    res.status(201).json({ data: batch });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const batch = await getBatchOrThrow(parseId(req.params.id));
    res.json({ data: batch });
  }),
);

const updateBatch = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body ?? {};
  const data = buildBatchData(body, { forUpdate: true });

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update');
  }

  delete data.productId;
  delete data.quantityOnHand;

  if (Object.hasOwn(data, 'supplierId')) {
    await ensureSupplierExists(data.supplierId);
  }

  await getBatchOrThrow(id);

  const batch = await prisma.batch.update({
    where: { id },
    data,
  });

  res.json({ data: batch });
});

router.patch('/:id', updateBatch);
router.put('/:id', updateBatch);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await getBatchOrThrow(id);

    await prisma.batch.delete({
      where: { id },
    });

    res.status(204).end();
  }),
);

export default router;
