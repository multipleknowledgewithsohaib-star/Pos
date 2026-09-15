import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/async-handler.js';
import { ApiError } from '../lib/api-error.js';
import {
  booleanField,
  integerField,
  parseId,
  stringField,
} from '../lib/validators.js';

const router = Router();

async function ensureCategoryExists(categoryId) {
  if (categoryId === null || categoryId === undefined) {
    return;
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new ApiError(400, 'categoryId does not reference an existing category');
  }
}

async function getProductOrThrow(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      batches: {
        orderBy: {
          expiryDate: 'asc',
        },
        include: {
          supplier: true,
        },
      },
      _count: {
        select: {
          batches: true,
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
}

function buildProductData(body, { forUpdate = false } = {}) {
  const data = {};

  if (Object.hasOwn(body, 'sku')) {
    data.sku = stringField(body.sku, 'sku', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'barcode')) {
    data.barcode = stringField(body.barcode, 'barcode', {
      allowNull: true,
    });
  }

  if (Object.hasOwn(body, 'name')) {
    data.name = stringField(body.name, 'name', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'description')) {
    data.description = stringField(body.description, 'description', {
      allowNull: true,
    });
  }

  if (Object.hasOwn(body, 'strength')) {
    data.strength = stringField(body.strength, 'strength', {
      allowNull: true,
    });
  }

  if (Object.hasOwn(body, 'form')) {
    data.form = stringField(body.form, 'form', {
      allowNull: true,
    });
  }

  if (Object.hasOwn(body, 'unit')) {
    data.unit = stringField(body.unit, 'unit', {
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'requiresPrescription')) {
    data.requiresPrescription = booleanField(
      body.requiresPrescription,
      'requiresPrescription',
      {
        required: !forUpdate,
      },
    );
  }

  if (Object.hasOwn(body, 'reorderLevel')) {
    data.reorderLevel = integerField(body.reorderLevel, 'reorderLevel', {
      min: 0,
      required: !forUpdate,
    });
  }

  if (Object.hasOwn(body, 'categoryId')) {
    data.categoryId = integerField(body.categoryId, 'categoryId', {
      allowNull: true,
      min: 1,
    });
  }

  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        _count: {
          select: {
            batches: true,
          },
        },
      },
    });

    res.json({ data: products });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const data = buildProductData(body);

    if (!Object.hasOwn(data, 'sku')) {
      throw new ApiError(400, 'sku is required');
    }

    if (!Object.hasOwn(data, 'name')) {
      throw new ApiError(400, 'name is required');
    }

    if (!Object.hasOwn(data, 'unit')) {
      data.unit = 'piece';
    }

    if (!Object.hasOwn(data, 'requiresPrescription')) {
      data.requiresPrescription = false;
    }

    if (!Object.hasOwn(data, 'reorderLevel')) {
      data.reorderLevel = 0;
    }

    await ensureCategoryExists(data.categoryId);

    const product = await prisma.product.create({
      data,
    });

    res.status(201).json({ data: product });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await getProductOrThrow(parseId(req.params.id));
    res.json({ data: product });
  }),
);

const updateProduct = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body ?? {};
  const data = buildProductData(body, { forUpdate: true });

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update');
  }

  if (Object.hasOwn(data, 'categoryId')) {
    await ensureCategoryExists(data.categoryId);
  }

  await getProductOrThrow(id);

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  res.json({ data: product });
});

router.patch('/:id', updateProduct);
router.put('/:id', updateProduct);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await getProductOrThrow(id);

    await prisma.product.delete({
      where: { id },
    });

    res.status(204).end();
  }),
);

export default router;
