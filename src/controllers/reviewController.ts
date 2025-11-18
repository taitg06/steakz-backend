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

export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user;
    let whereClause: any = {};

    // Branch managers can only see reviews for their branch
    if (currentUser?.role === 'BRANCH_MANAGER') {
      const managedBranch = await prisma.branch.findFirst({
        where: { managerId: currentUser.userId }
      });
      
      if (managedBranch) {
        // Get reviews from users who made orders/reservations at this branch
        // For now, show all reviews (can be enhanced to filter by branch)
        whereClause = {};
      }
    } else if (currentUser?.role === 'HEADQUARTER_MANAGER') {
      // HQ managers can see all reviews
      whereClause = {};
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment, review } = req.body;
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Use 'comment' if provided, otherwise use 'review' (for backward compatibility)
    const reviewText = comment || review;
    
    if (!reviewText || !rating) {
      res.status(400).json({ message: 'Rating and comment are required' });
      return;
    }
    
    const newReview = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment: reviewText,
        userId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({ 
      message: 'Review submitted successfully',
      review: newReview 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review' });
  }
};