import { Router } from 'express';
import HealthController from '@/controllers/health.controller';
import { asyncHandler } from '@/middleware/error.middleware';

export const createHealthRoutes = (healthController: HealthController): Router => {
  const router = Router();

  // Health check endpoint
  router.get(
    '/health',
    asyncHandler(healthController.healthCheck)
  );

  // Ready check endpoint
  router.get(
    '/ready',
    asyncHandler(healthController.readyCheck)
  );

  return router;
}; 