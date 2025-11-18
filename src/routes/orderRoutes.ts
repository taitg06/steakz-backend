import { Router } from 'express';
import { checkout, getOrders, createCustomerOrder, getMyOrders, confirmPayment, confirmCollection, getPendingOrders, cashierConfirmOrder, getKitchenOrders, updateOrderStatus } from '../controllers/orderController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Customer order routes
router.post('/customer-order', authenticateToken, authorizeRole(['CUSTOMER']), createCustomerOrder);
router.get('/my-orders', authenticateToken, authorizeRole(['CUSTOMER']), getMyOrders);
router.post('/confirm-payment/:orderId', authenticateToken, authorizeRole(['CUSTOMER']), confirmPayment);
router.post('/confirm-collection/:orderId', authenticateToken, authorizeRole(['CUSTOMER']), confirmCollection);

// Cashier POS routes
router.get('/pending', authenticateToken, authorizeRole(['CASHIER', 'BRANCH_MANAGER']), getPendingOrders);
router.post('/cashier-confirm/:orderId', authenticateToken, authorizeRole(['CASHIER', 'BRANCH_MANAGER']), cashierConfirmOrder);

// Chef kitchen routes
router.get('/kitchen', authenticateToken, authorizeRole(['CHEF', 'BRANCH_MANAGER']), getKitchenOrders);
router.post('/update-status/:orderId', authenticateToken, authorizeRole(['CHEF', 'BRANCH_MANAGER']), updateOrderStatus);

// Checkout route - only cashiers and branch managers can process orders
router.post('/checkout', authenticateToken, authorizeRole(['CASHIER', 'BRANCH_MANAGER']), checkout);

// Get orders - accessible by staff
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'HEADQUARTER_MANAGER', 'BRANCH_MANAGER', 'CASHIER', 'CHEF']), getOrders);

export default router;
