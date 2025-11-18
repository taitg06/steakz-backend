import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getBranches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
};

// Public endpoint for customers to view available branches
export const getPublicBranches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true
      }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
};

export const createBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, phone, managerId } = req.body;
    
    // Validate required fields
    if (!name || !address || !phone) {
      res.status(400).json({ message: 'Name, address, and phone are required' });
      return;
    }
    
    // If managerId is provided, verify the user exists and is a branch manager
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: Number(managerId) }
      });
      
      if (!manager) {
        res.status(400).json({ message: 'Manager not found' });
        return;
      }
      
      if (manager.role !== 'BRANCH_MANAGER') {
        res.status(400).json({ message: 'Selected user is not a branch manager' });
        return;
      }
      
      // Check if manager is already assigned to another branch
      const existingBranch = await prisma.branch.findUnique({
        where: { managerId: Number(managerId) }
      });
      
      if (existingBranch) {
        res.status(400).json({ message: 'This manager is already assigned to another branch' });
        return;
      }
    }
    
    const branch = await prisma.branch.create({
      data: { 
        name, 
        address, 
        phone,
        managerId: managerId ? Number(managerId) : null
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ message: 'Error creating branch' });
  }
};

export const updateBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, phone, managerId } = req.body;
    
    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingBranch) {
      res.status(404).json({ message: 'Branch not found' });
      return;
    }
    
    // If managerId is provided, verify the user exists and is a branch manager
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: Number(managerId) }
      });
      
      if (!manager) {
        res.status(400).json({ message: 'Manager not found' });
        return;
      }
      
      if (manager.role !== 'BRANCH_MANAGER') {
        res.status(400).json({ message: 'Selected user is not a branch manager' });
        return;
      }
      
      // Check if manager is already assigned to another branch (excluding current branch)
      const otherBranch = await prisma.branch.findFirst({
        where: {
          managerId: Number(managerId),
          id: { not: Number(id) }
        }
      });
      
      if (otherBranch) {
        res.status(400).json({ message: 'This manager is already assigned to another branch' });
        return;
      }
    }
    
    const branch = await prisma.branch.update({
      where: { id: Number(id) },
      data: { 
        name, 
        address, 
        phone,
        managerId: managerId ? Number(managerId) : null
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ message: 'Error updating branch' });
  }
};

export const deleteBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.branch.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting branch' });
  }
};