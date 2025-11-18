import { Request, Response } from 'express';
import prisma from '../utils/prisma';


interface AuthRequest extends Request {
  user?: {
    userId: number;
    id: number;
    role: string;
    branchId?: number | null;
  };
}

// Create a contact message
export const createContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message, branchId } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      res.status(400).json({ message: 'Name, email, and message are required' });
      return;
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
        branchId: branchId ? parseInt(branchId) : null,
        status: 'UNREAD'
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

    res.status(201).json({ 
      message: 'Contact message sent successfully', 
      contactMessage 
    });
  } catch (error: any) {
    console.error('Create contact message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Get all contact messages (for staff)
export const getContactMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user;
    let whereClause: any = {};

    // Branch managers can only see messages for their branch
    if (currentUser?.role === 'BRANCH_MANAGER') {
      const managedBranch = await prisma.branch.findFirst({
        where: { managerId: currentUser.userId }
      });
      
      if (managedBranch) {
        whereClause.branchId = managedBranch.id;
      } else {
        // If branch manager has no branch, show no messages
        res.json([]);
        return;
      }
    }
    // HQ managers and admins can see all messages
    // No additional filter needed

    const messages = await prisma.contactMessage.findMany({
      where: whereClause,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(messages);
  } catch (error: any) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

// Update contact message status
export const updateContactMessageStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['UNREAD', 'READ', 'RESOLVED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be UNREAD, READ, or RESOLVED' });
      return;
    }

    const message = await prisma.contactMessage.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({ message: 'Status updated successfully', contactMessage: message });
  } catch (error: any) {
    console.error('Update contact message status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// Delete contact message
export const deleteContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.contactMessage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error: any) {
    console.error('Delete contact message error:', error);
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};
