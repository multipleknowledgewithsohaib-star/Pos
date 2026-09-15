import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/async-handler.js';
import { ApiError } from '../lib/api-error.js';
import {
  integerField,
  parseId,
  stringField,
} from '../lib/validators.js';

const router = Router();

const MOVEMENT_TYPES = new Set(['RECEIVE', 'DISPENSE', 'ADJUSTMENT']);

async function getMovementOrThrow(id) {
  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      batch: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!movement) {
    throw new ApiError(404, 'Stock movement not found');
  }

  return movement;
}

function parseMovementType(value) {
  const normalized = stringField(value, 'movementType', {
    required: true,
  }).toUpperCase();

  if (!MOVEMENT_TYPES.has(normalized)) {
    throw new ApiError(
      400,
      'movementType must be one of RECEIVE, DISPENSE, or ADJUSTMENT',
    );
  }

  return normalized;
}

function parseMovementQuantity(movementType, value) {
  if (movementType === 'ADJUSTMENT') {
    const quantity = integerField(value, 'quantity', {
      required: true,
    });

    if (quantity === 0) {
      throw new ApiError(400, 'quantity cannot be 0 for an adjustment');
    }

    return quantity;
  }

  return integerField(value, 'quantity', {
    required: true,
    min: 1,
  });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({ data: movements });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const batchId = integerField(body.batchId, 'batchId', {
      required: true,
      min: 1,
    });
    const movementType = parseMovementType(body.movementType);
    const quantity = parseMovementQuantity(movementType, body.quantity);
    const reference = Object.hasOwn(body, 'reference')
      ? stringField(body.reference, 'reference', { allowNull: true })
      : undefined;
    const note = Object.hasOwn(body, 'note')
      ? stringField(body.note, 'note', { allowNull: true })
      : undefined;

    const movement = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          quantityOnHand: true,
        },
      });

      if (!batch) {
        throw new ApiError(404, 'Batch not found');
      }

      const delta = movementType === 'DISPENSE' ? -quantity : quantity;

      if (movementType === 'DISPENSE' && batch.quantityOnHand < quantity) {
        throw new ApiError(400, 'Not enough stock to dispense that quantity');
      }

      const createdMovement = await tx.stockMovement.create({
        data: {
          batchId,
          movementType,
          quantity,
          reference,
          note,
        },
      });

      await tx.batch.update({
        where: { id: batchId },
        data: {
          quantityOnHand: {
            increment: delta,
          },
        },
      });

      return tx.stockMovement.findUnique({
        where: { id: createdMovement.id },
        include: {
          batch: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    res.status(201).json({ data: movement });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const movement = await getMovementOrThrow(parseId(req.params.id));
    res.json({ data: movement });
  }),
);

export default router;
