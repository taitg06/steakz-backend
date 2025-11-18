import { Router } from 'express';
import { getReports, downloadReport, getAnalytics } from '../controllers/reportsController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Reports routes - accessible by ADMIN, HEADQUARTER_MANAGER, and BRANCH_MANAGER
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER', 'CHEF', 'CASHIER']), getReports);
router.get('/download', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER']), downloadReport);
router.get('/analytics', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER', 'CHEF', 'CASHIER']), getAnalytics);

export default router;
