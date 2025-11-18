import express from 'express';
import { getStats } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getStats);

export default router;