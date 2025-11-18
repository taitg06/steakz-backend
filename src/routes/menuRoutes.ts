import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMenuItems, getMenuItemsByBranch, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';

const router = express.Router();

router.get('/', getMenuItems);
router.get('/branch/:branchId', getMenuItemsByBranch);
router.post('/', authenticateToken, createMenuItem);
router.put('/:id', authenticateToken, updateMenuItem);
router.delete('/:id', authenticateToken, deleteMenuItem);

export default router;
