import express from 'express';
import { getBranches, getPublicBranches, createBranch, updateBranch, deleteBranch } from '../controllers';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Public route for customers to view branches
router.get('/public', getPublicBranches);

router.get('/', authenticateToken, getBranches);
router.post('/', authenticateToken, createBranch);
router.put('/:id', authenticateToken, updateBranch);
router.delete('/:id', authenticateToken, deleteBranch);

export default router;