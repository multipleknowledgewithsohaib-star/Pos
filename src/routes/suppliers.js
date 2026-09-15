import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/async-handler.js';
import { ApiError } from '../lib/api-error.js';
import { parseId, stringField } from '../lib/validators.js';

const router = Router();

async function getSupplierOrThrow(id) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      batches: {
        orderBy: {
          expiryDate: 'asc',
        },
        include: {
          product: true,
        },
      },
      _count: {
        select: {
          batches: true,
        },
      },
    },
  });

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  return supplier;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            batches: true,
          },
        },
      },
    });

    res.json({ data: suppliers });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const data = {
      name: stringField(body.name, 'name', { required: true }),
    };

    if (Object.hasOwn(body, 'contactName')) {
      data.contactName = stringField(body.contactName, 'contactName', {
        allowNull: true,
      });
    }

    if (Object.hasOwn(body, 'email')) {
      data.email = stringField(body.email, 'email', { allowNull: true });
    }

    if (Object.hasOwn(body, 'phone')) {
      data.phone = stringField(body.phone, 'phone', { allowNull: true });
    }

    if (Object.hasOwn(body, 'address')) {
      data.address = stringField(body.address, 'address', { allowNull: true });
    }

    const supplier = await prisma.supplier.create({
      data,
    });

    res.status(201).json({ data: supplier });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const supplier = await getSupplierOrThrow(parseId(req.params.id));
    res.json({ data: supplier });
  }),
);

const updateSupplier = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body ?? {};
  const data = {};

  if (Object.hasOwn(body, 'name')) {
    data.name = stringField(body.name, 'name', { required: true });
  }

  if (Object.hasOwn(body, 'contactName')) {
    data.contactName = stringField(body.contactName, 'contactName', {
      allowNull: true,
    });
  }

  if (Object.hasOwn(body, 'email')) {
    data.email = stringField(body.email, 'email', { allowNull: true });
  }

  if (Object.hasOwn(body, 'phone')) {
    data.phone = stringField(body.phone, 'phone', { allowNull: true });
  }

  if (Object.hasOwn(body, 'address')) {
    data.address = stringField(body.address, 'address', { allowNull: true });
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update');
  }

  await getSupplierOrThrow(id);

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });

  res.json({ data: supplier });
});

router.patch('/:id', updateSupplier);
router.put('/:id', updateSupplier);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await getSupplierOrThrow(id);

    await prisma.supplier.delete({
      where: { id },
    });

    res.status(204).end();
  }),
);

export default router;
