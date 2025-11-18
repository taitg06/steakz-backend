import express from 'express';
import { getReviews, createReview, deleteReview } from '../controllers';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// Get reviews (staff can see all, others see public reviews)
router.get('/', authenticateToken, getReviews);

// Create review (customers and authenticated users)
router.post('/', authenticateToken, createReview);

// Delete review (admin/management only)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER']), deleteReview);

export default router;