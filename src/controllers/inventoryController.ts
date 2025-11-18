import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
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

    // Filter inventory by branch for branch managers and staff
    const shouldFilterByBranch = currentUser.role === 'BRANCH_MANAGER' || 
                                  currentUser.role === 'CHEF' || 
                                  currentUser.role === 'CASHIER';

    const inventory = await prisma.menuItem.findMany({
      where: shouldFilterByBranch && branchId
        ? { branchId }
        : undefined
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory' });
  }
};

export const createInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, description, quantity, branchId } = req.body;
    const currentUser = (req as any).user; // From JWT token
    
    if (!name || !price || !description || quantity === undefined) {
      res.status(400).json({ message: 'All fields required' });
      return;
    }
    
    // Determine branchId based on user role
    let targetBranchId: number;
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      if (!managerBranch) {
        res.status(400).json({ message: 'Branch manager must be assigned to a branch' });
        return;
      }
      targetBranchId = managerBranch.id;
    } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
      const staffUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      if (!staffUser?.branchId) {
        res.status(400).json({ message: 'Staff member must be assigned to a branch' });
        return;
      }
      targetBranchId = staffUser.branchId;
    } else {
      // Admin or HQ Manager can specify branchId
      targetBranchId = branchId ? Number(branchId) : 1;
    }
    
    const item = await prisma.menuItem.create({
      data: {
        name,
        price: Number(price),
        description,
        quantity: Number(quantity),
        branchId: targetBranchId
      }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error creating inventory item' });
  }
};

export const updateInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, price, description, quantity } = req.body;
    const currentUser = (req as any).user; // From JWT token
    
    // Check if branch manager owns this inventory item
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      
      const item = await prisma.menuItem.findUnique({
        where: { id: Number(id) }
      });
      
      if (!item || item.branchId !== managerBranch?.id) {
        res.status(403).json({ message: 'You can only update inventory for your branch' });
        return;
      }
    }
    
    const item = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: { name, price: Number(price), description, quantity: Number(quantity) }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item' });
  }
};

export const deleteInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user; // From JWT token
    
    // Check if branch manager owns this inventory item
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      
      const item = await prisma.menuItem.findUnique({
        where: { id: Number(id) }
      });
      
      if (!item || item.branchId !== managerBranch?.id) {
        res.status(403).json({ message: 'You can only delete inventory for your branch' });
        return;
      }
    }
    
    await prisma.menuItem.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
};