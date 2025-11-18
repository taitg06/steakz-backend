import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMenuItems = async (_req: Request, res: Response): Promise<void> => {
    try {
        const menuItems = await prisma.menuItem.findMany({
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
        
        const menuItem = await prisma.menuItem.create({
            data: {
                name,
                description: description || '',
                price: parseFloat(price),
                quantity: quantity || 100,
                branchId: branchId || 1, // default to first branch
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

        const menuItem = await prisma.menuItem.update({
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

        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating menu item' });
    }
};

export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.menuItem.delete({
            where: { id: Number(id) }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item' });
    }
};
