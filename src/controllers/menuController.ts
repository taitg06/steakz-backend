import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentUser = (req as any).user;
        
        // Determine branch ID based on role for staff members
        let branchId: number | null = null;
        
        if (currentUser && currentUser.role === 'BRANCH_MANAGER') {
            const managerBranch = await prisma.branch.findUnique({
                where: { managerId: currentUser.id }
            });
            branchId = managerBranch?.id || null;
        } else if (currentUser && (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER')) {
            const staffUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { branchId: true }
            });
            branchId = staffUser?.branchId || null;
        }

        // Filter menu items by branch for staff members
        const shouldFilterByBranch = currentUser && (currentUser.role === 'BRANCH_MANAGER' || 
                                                     currentUser.role === 'CHEF' || 
                                                     currentUser.role === 'CASHIER');

        const menuItems = await prisma.menuItem.findMany({
            where: shouldFilterByBranch && branchId ? { branchId } : undefined,
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

// Get menu items by branch ID
export const getMenuItemsByBranch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { branchId } = req.params;
        
        const menuItems = await prisma.menuItem.findMany({
            where: {
                branchId: parseInt(branchId)
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, price, quantity, branchId } = req.body;
        const currentUser = (req as any).user;
        
        if (!name || !price) {
            res.status(400).json({ message: 'Name and price are required' });
            return;
        }

        // Determine the branch ID for the menu item based on user role
        let targetBranchId: number;
        
        if (currentUser.role === 'BRANCH_MANAGER') {
            // Branch managers can only add items to their branch
            const managerBranch = await prisma.branch.findUnique({
                where: { managerId: currentUser.id }
            });
            
            if (!managerBranch) {
                res.status(403).json({ message: 'You are not assigned to a branch' });
                return;
            }
            
            targetBranchId = managerBranch.id;
        } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
            // Staff can only add items to their assigned branch
            const staffUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { branchId: true }
            });
            
            if (!staffUser?.branchId) {
                res.status(403).json({ message: 'You are not assigned to a branch' });
                return;
            }
            
            targetBranchId = staffUser.branchId;
        } else {
            // Admin and HQ managers can specify branch
            targetBranchId = branchId ? Number(branchId) : 1;
        }
        
        const menuItem = await prisma.menuItem.create({
            data: {
                name,
                description: description || '',
                price: parseFloat(price),
                quantity: quantity || 100,
                branchId: targetBranchId
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Error creating menu item' });
    }
};

export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, price, quantity } = req.body;
        const currentUser = (req as any).user;

        // Find the menu item first
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: Number(id) },
            select: { branchId: true }
        });

        if (!menuItem) {
            res.status(404).json({ message: 'Menu item not found' });
            return;
        }

        // Check branch authorization for staff members
        if (currentUser.role === 'BRANCH_MANAGER') {
            const managerBranch = await prisma.branch.findUnique({
                where: { managerId: currentUser.id }
            });
            
            if (managerBranch?.id !== menuItem.branchId) {
                res.status(403).json({ message: 'You can only modify items in your branch' });
                return;
            }
        } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
            const staffUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { branchId: true }
            });
            
            if (staffUser?.branchId !== menuItem.branchId) {
                res.status(403).json({ message: 'You can only modify items in your branch' });
                return;
            }
        }

        const updatedMenuItem = await prisma.menuItem.update({
            where: { id: Number(id) },
            data: {
                name,
                description,
                price: parseFloat(price),
                quantity
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json(updatedMenuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating menu item' });
    }
};

export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const currentUser = (req as any).user;

        // Find the menu item first
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: Number(id) },
            select: { branchId: true }
        });

        if (!menuItem) {
            res.status(404).json({ message: 'Menu item not found' });
            return;
        }

        // Check branch authorization for staff members
        if (currentUser.role === 'BRANCH_MANAGER') {
            const managerBranch = await prisma.branch.findUnique({
                where: { managerId: currentUser.id }
            });
            
            if (managerBranch?.id !== menuItem.branchId) {
                res.status(403).json({ message: 'You can only delete items from your branch' });
                return;
            }
        } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
            const staffUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { branchId: true }
            });
            
            if (staffUser?.branchId !== menuItem.branchId) {
                res.status(403).json({ message: 'You can only delete items from your branch' });
                return;
            }
        }

        await prisma.menuItem.delete({
            where: { id: Number(id) }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item' });
    }
};
