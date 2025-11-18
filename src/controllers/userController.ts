import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/hash';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    id: number;
    role: string;
    branchId?: number | null;
  };
}

// Get all users (paginated)
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        branchId: true,
        createdAt: true, 
        updatedAt: true,
        managedBranch: {
          select: {
            id: true,
            name: true
          }
        },
        assignedBranch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user details' });
  }
};

// Admin: Create user
export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'All fields required' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Admin: Update user
export const adminUpdateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await hashPassword(password);
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Admin: Change user role
export const adminChangeRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      res.status(400).json({ message: 'Role required' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user role' });
  }
};

// Admin: Delete user
export const adminDeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Admin: Assign staff to branch
export const assignStaffToBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;
    
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { branchId: branchId ? Number(branchId) : null },
      select: { id: true, name: true, email: true, role: true, branchId: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning staff to branch' });
  }
};

// Update user role (admin and HQ manager with restrictions)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = (req as any).user; // From JWT token
    
    if (!role) {
      res.status(400).json({ message: 'Role required' });
      return;
    }
    
    // HQ Manager cannot assign ADMIN or HEADQUARTER_MANAGER roles
    if (currentUser.role === 'HEADQUARTER_MANAGER' && 
        (role === 'ADMIN' || role === 'HEADQUARTER_MANAGER')) {
      res.status(403).json({ message: 'You do not have permission to assign this role' });
      return;
    }
    
    // Get target user to check if HQ Manager is trying to modify ADMIN or HQ_MANAGER
    const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!targetUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (currentUser.role === 'HEADQUARTER_MANAGER' && 
        (targetUser.role === 'ADMIN' || targetUser.role === 'HEADQUARTER_MANAGER')) {
      res.status(403).json({ message: 'You do not have permission to modify this user' });
      return;
    }
    
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// Example protected endpoints for each role
export const customerEndpoint = (_req: Request, res: Response) => {
  res.json({ message: 'Hello, customer!' });
};
export const adminEndpoint = (_req: Request, res: Response) => {
  res.json({ message: 'Hello, admin!' });
};
export const managerEndpoint = (_req: Request, res: Response) => {
  res.json({ message: 'Hello, manager!' });
};
export const cashierEndpoint = (_req: Request, res: Response) => {
  res.json({ message: 'Hello, cashier!' });
};
export const headquarterEndpoint = (_req: Request, res: Response) => {
  res.json({ message: 'Hello, headquarter!' });
};
export const chefEndpoint = (_req: Request, res: Response) => {
  res.json({ message: 'Hello, chef!' });
};

// Update own profile (authenticated user)
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId || authReq.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { name, email } = req.body;

    if (!name && !email) {
      res.status(400).json({ message: 'At least one field (name or email) is required' });
      return;
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        res.status(400).json({ message: 'Email already in use by another account' });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Change password (authenticated user)
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId || authReq.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long' });
      return;
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};
