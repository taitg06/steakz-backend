import express from 'express';
import { 
  createContactMessage, 
  getContactMessages, 
  updateContactMessageStatus,
  deleteContactMessage 
} from '../controllers/contactController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// Create contact message (public - anyone can send a message)
router.post('/', createContactMessage);

// Get all contact messages (staff only)
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER']), getContactMessages);

// Update contact message status
router.put('/:id/status', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER']), updateContactMessageStatus);

// Delete contact message (management only)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER']), deleteContactMessage);

export default router;
