import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    assignStaffToBranch,
    updateUserRole,
    customerEndpoint,
    adminEndpoint,
    managerEndpoint,
    cashierEndpoint,
    headquarterEndpoint,
    chefEndpoint,
    updateProfile,
    changePassword
} from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// User profile management (all authenticated users)
router.put('/profile', authenticateToken, updateProfile);           // Update own profile
router.put('/change-password', authenticateToken, changePassword);  // Change own password

// Base routes - require authentication
router.get('/', authenticateToken, getAllUsers);                // List users based on role
router.get('/:id', authenticateToken, getUserById);            // View user details and posts

// Admin user management routes
router.post('/', authenticateToken, authorizeRole(['ADMIN']), adminCreateUser);         // Create new user
router.put('/:id/assign-branch', authenticateToken, authorizeRole(['ADMIN']), assignStaffToBranch); // Assign staff to branch
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), adminDeleteUser);     // Delete user

// Update user role (admin and HQ manager can change roles, but HQ manager has restrictions)
router.put('/:id/role', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER']), updateUserRole);

// Update user details (admin only)
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), adminUpdateUser);       // Update user details

// Example protected endpoints for each role
router.get('/example/customer', authenticateToken, authorizeRole(['CUSTOMER']), customerEndpoint);
router.get('/example/admin', authenticateToken, authorizeRole(['ADMIN']), adminEndpoint);
router.get('/example/manager', authenticateToken, authorizeRole(['BRANCH_MANAGER']), managerEndpoint);
router.get('/example/cashier', authenticateToken, authorizeRole(['CASHIER']), cashierEndpoint);
router.get('/example/headquarter', authenticateToken, authorizeRole(['HEADQUARTER_MANAGER']), headquarterEndpoint);
router.get('/example/chef', authenticateToken, authorizeRole(['CHEF']), chefEndpoint);

export default router;
