import express from 'express';
import { getInventory, updateInventory, deleteInventory, createInventoryItem } from '../controllers';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, authorizeRole(['ADMIN', 'BRANCH_MANAGER', 'HEADQUARTER_MANAGER', 'CHEF', 'CASHIER']), getInventory);
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'BRANCH_MANAGER', 'HEADQUARTER_MANAGER']), createInventoryItem);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'BRANCH_MANAGER', 'HEADQUARTER_MANAGER']), updateInventory);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'BRANCH_MANAGER', 'HEADQUARTER_MANAGER']), deleteInventory);

export default router;