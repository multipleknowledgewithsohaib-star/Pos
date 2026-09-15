import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/async-handler.js';
import { ApiError } from '../lib/api-error.js';
import { parseId, stringField } from '../lib/validators.js';

const router = Router();

async function getCategoryOrThrow(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  return category;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    res.json({ data: categories });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const name = stringField(body.name, 'name', { required: true });

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({ data: category });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const category = await getCategoryOrThrow(parseId(req.params.id));
    res.json({ data: category });
  }),
);

const updateCategory = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body ?? {};
  const data = {};

  if (Object.hasOwn(body, 'name')) {
    data.name = stringField(body.name, 'name', { required: true });
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update');
  }

  await getCategoryOrThrow(id);

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  res.json({ data: category });
});

router.patch('/:id', updateCategory);
router.put('/:id', updateCategory);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await getCategoryOrThrow(id);

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).end();
  }),
);

export default router;
