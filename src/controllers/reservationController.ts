import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    branchId?: number | null;
  };
}

// Create a reservation
export const createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, date, time, guests, branchId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !guests) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // If user is logged in, associate reservation with their account
    const customerId = req.user?.userId;

    const reservation = await prisma.reservation.create({
      data: {
        name,
        email,
        phone,
        date,
        time,
        guests: parseInt(guests),
        branchId: branchId ? parseInt(branchId) : null,
        customerId,
        status: 'PENDING'
      }
    });

    res.status(201).json({ 
      message: 'Reservation created successfully', 
      reservation 
    });
  } catch (error: any) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Failed to create reservation', error: error.message });
  }
};

// Get all reservations (for staff)
export const getReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const userBranchId = req.user?.branchId;

    let whereClause: any = {};

    // Branch-specific roles can only see their branch's reservations
    if (userRole === 'BRANCH_MANAGER' || userRole === 'CHEF' || userRole === 'CASHIER') {
      let branchId = userBranchId;
      
      // For BRANCH_MANAGER, get the branch they manage
      if (userRole === 'BRANCH_MANAGER') {
        const managedBranch = await prisma.branch.findFirst({
          where: { managerId: userId }
        });
        
        if (!managedBranch) {
          res.status(400).json({ message: 'No branch assigned to this user' });
          return;
        }
        
        branchId = managedBranch.id;
      } else {
        // For CHEF and CASHIER, use branchId
        if (!branchId) {
          res.status(400).json({ message: 'No branch assigned to this user' });
          return;
        }
      }
      
      whereClause.branchId = branchId;
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reservations);
  } catch (error: any) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
  }
};

// Get customer's own reservations
export const getMyReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.userId;

    if (!customerId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        customerId
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reservations);
  } catch (error: any) {
    console.error('Get my reservations error:', error);
    res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
  }
};

// Update reservation status
export const updateReservationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const reservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ message: 'Reservation status updated', reservation });
  } catch (error: any) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Failed to update reservation', error: error.message });
  }
};

// Delete reservation
export const deleteReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.reservation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error: any) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ message: 'Failed to delete reservation', error: error.message });
  }
};
