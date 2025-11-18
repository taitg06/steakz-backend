import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user; // From JWT token
    
    // Determine branch ID based on role
    let branchId: number | null = null;
    
    if (currentUser.role === 'BRANCH_MANAGER') {
      // Branch managers are assigned via managerId in Branch table
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      branchId = managerBranch?.id || null;
    } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
      // Staff members are assigned via branchId in User table
      const staffUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      branchId = staffUser?.branchId || null;
    }

    // Filter stats by branch for branch managers and staff
    const shouldFilterByBranch = currentUser.role === 'BRANCH_MANAGER' || 
                                  currentUser.role === 'CHEF' || 
                                  currentUser.role === 'CASHIER';

    const [userCount, reviewCount, branchCount, menuItemCount, orderCount] = await Promise.all([
      shouldFilterByBranch && branchId
        ? prisma.user.count({ where: { branchId } })
        : prisma.user.count(),
      prisma.review.count(),
      shouldFilterByBranch ? 1 : prisma.branch.count(),
      shouldFilterByBranch && branchId
        ? prisma.menuItem.count({ where: { branchId } })
        : prisma.menuItem.count(),
      shouldFilterByBranch && branchId
        ? prisma.order.count({ where: { branchId } })
        : prisma.order.count(),
    ]);

    res.json({
      users: userCount,
      reviews: reviewCount,
      branches: branchCount,
      menuItems: menuItemCount,
      orders: orderCount,
      branchId: shouldFilterByBranch ? branchId : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};