import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: '1Kampus API',
      version: '1.0.0',
      database: db.isUsingSupabase() ? 'Supabase PostgreSQL' : 'Resilient In-Memory Local Store',
    },
  });
});

export default router;
