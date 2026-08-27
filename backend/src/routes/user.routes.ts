import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Users route' });
});

export default router;
