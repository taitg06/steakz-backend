import express, { Request, Response, NextFunction } from 'express';
import { 
  createReservation, 
  getReservations, 
  getMyReservations,
  updateReservationStatus,
  deleteReservation 
} from '../controllers/reservationController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// Create reservation (optional auth - guests can make reservations too)
// We'll use a custom middleware that makes auth optional
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (token) {
    // If token is provided, verify it
    authenticateToken(req, res, next);
  } else {
    // If no token, continue without authentication
    next();
  }
};

router.post('/', optionalAuth, createReservation);

// Get all reservations (staff only - excluding chefs)
router.get('/all', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER', 'CASHIER']), getReservations);

// Get customer's own reservations
router.get('/my-reservations', authenticateToken, authorizeRole(['CUSTOMER', 'ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER', 'CASHIER']), getMyReservations);

// Update reservation status (staff can update - excluding chefs)
router.put('/:id/status', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER', 'CASHIER']), updateReservationStatus);

// Delete reservation (management only)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER']), deleteReservation);

export default router;
