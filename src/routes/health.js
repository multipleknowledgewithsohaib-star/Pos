import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Pharma API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get(
  '/database',
  asyncHandler(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
