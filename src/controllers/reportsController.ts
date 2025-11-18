import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    
    // Determine branch ID based on role
    let branchId: number | null = null;
    
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      branchId = managerBranch?.id || null;
    } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
      const staffUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      branchId = staffUser?.branchId || null;
    }

    const shouldFilterByBranch = currentUser.role === 'BRANCH_MANAGER' || 
                                  currentUser.role === 'CHEF' || 
                                  currentUser.role === 'CASHIER';

    // Get real data from database
    const [inventoryItems, totalReviews, branches, branchStaff, orders, totalRevenue] = await Promise.all([
      prisma.menuItem.findMany({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        select: {
          name: true,
          price: true,
          quantity: true,
          createdAt: true
        },
        orderBy: {
          quantity: 'desc' // Most stocked items (proxy for popular items)
        }
      }),
      prisma.review.count(),
      shouldFilterByBranch ? 1 : prisma.branch.count(),
      shouldFilterByBranch && branchId
        ? prisma.user.count({
            where: {
              branchId,
              role: { in: ['CHEF', 'CASHIER', 'BRANCH_MANAGER'] }
            }
          })
        : 0,
      prisma.order.findMany({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        }
      }),
      prisma.order.aggregate({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        _sum: {
          totalAmount: true
        }
      })
    ]);

    // Calculate top selling items based on actual order data
    const itemSales = new Map<string, { name: string; count: number; revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemSales.get(item.menuItem.name);
        if (existing) {
          existing.count += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          itemSales.set(item.menuItem.name, {
            name: item.menuItem.name,
            count: item.quantity,
            revenue: item.price * item.quantity
          });
        }
      });
    });

    const topItems = Array.from(itemSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate revenues based on actual orders
    const actualTotalRevenue = totalRevenue._sum.totalAmount || 0;
    const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get today's orders for daily revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRevenue = await prisma.order.aggregate({
      where: {
        ...(shouldFilterByBranch && branchId ? { branchId } : {}),
        createdAt: {
          gte: today
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    // Get unique customers from orders - today and monthly
    const todayCustomers = new Set(
      orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today;
        })
        .map(order => order.customerName)
        .filter(Boolean)
    );

    const monthlyCustomers = new Set(orders.map(order => order.customerName).filter(Boolean));

    res.json({
      dailyRevenue: todayRevenue._sum.totalAmount || 0,
      monthlyRevenue: actualTotalRevenue,
      topItems,
      customerCount: {
        daily: todayCustomers.size,
        monthly: monthlyCustomers.size
      },
      totalReviews,
      totalBranches: branches,
      totalStaff: branchStaff,
      inventoryValue: totalInventoryValue,
      totalInventoryItems: inventoryItems.length,
      totalOrders: orders.length,
      branchId: shouldFilterByBranch ? branchId : null
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

export const downloadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    
    // Determine branch ID based on role
    let branchId: number | null = null;
    let branchName: string | null = null;
    
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id },
        select: { id: true, name: true }
      });
      branchId = managerBranch?.id || null;
      branchName = managerBranch?.name || null;
    } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
      const staffUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true, assignedBranch: { select: { name: true } } }
      });
      branchId = staffUser?.branchId || null;
      branchName = staffUser?.assignedBranch?.name || null;
    }

    const shouldFilterByBranch = currentUser.role === 'BRANCH_MANAGER' || 
                                  currentUser.role === 'CHEF' || 
                                  currentUser.role === 'CASHIER';

    // Get comprehensive data for the report
    const [users, branches, inventory, reviews] = await Promise.all([
      prisma.user.findMany({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      shouldFilterByBranch ? 
        (branchId ? prisma.branch.findUnique({ 
          where: { id: branchId },
          select: { id: true, name: true, address: true, phone: true, createdAt: true }
        }) : null)
        : prisma.branch.findMany({
            select: { id: true, name: true, address: true, phone: true, createdAt: true }
          }),
      prisma.menuItem.findMany({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        include: {
          branch: {
            select: { name: true }
          }
        }
      }),
      prisma.review.findMany({
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    // Calculate real metrics
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.email,
      userRole: currentUser.role,
      branchId: shouldFilterByBranch ? branchId : null,
      branchName: shouldFilterByBranch ? branchName : null,
      period: 'monthly',
      
      summary: {
        totalUsers: users.length,
        totalBranches: shouldFilterByBranch ? 1 : (Array.isArray(branches) ? branches.length : 0),
        totalInventoryItems: inventory.length,
        totalReviews: reviews.length,
        totalInventoryValue: totalInventoryValue,
        averageRating: avgRating,
        usersByRole: usersByRole
      },
      
      branches: shouldFilterByBranch 
        ? (branches ? [branches] : [])
        : (Array.isArray(branches) ? branches : []),
      
      inventory: inventory.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        value: item.price * item.quantity,
        branch: item.branch.name,
        createdAt: item.createdAt
      })),
      
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customerName: review.user.name
      })),
      
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt
      })),
      
      estimatedSales: {
        description: 'Estimated based on inventory turnover',
        dailyRevenue: totalInventoryValue * 0.05,
        monthlyRevenue: totalInventoryValue * 0.05 * 30,
        topSellingItems: inventory.slice(0, 10).map(item => ({
          name: item.name,
          estimatedUnitsSold: Math.max(100 - item.quantity, 0),
          estimatedRevenue: Math.max(100 - item.quantity, 0) * item.price
        }))
      }
    };

    res.json(reportData);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    
    // Determine branch ID based on role
    let branchId: number | null = null;
    
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      branchId = managerBranch?.id || null;
    } else if (currentUser.role === 'CHEF' || currentUser.role === 'CASHIER') {
      const staffUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      branchId = staffUser?.branchId || null;
    }

    const shouldFilterByBranch = currentUser.role === 'BRANCH_MANAGER' || 
                                  currentUser.role === 'CHEF' || 
                                  currentUser.role === 'CASHIER';

    // Get inventory, reviews, and orders for calculations
    const [inventory, reviews, customers, branches, orders] = await Promise.all([
      prisma.menuItem.findMany({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          createdAt: true
        }
      }),
      prisma.review.findMany({
        select: {
          rating: true,
          createdAt: true
        }
      }),
      prisma.user.count({
        where: shouldFilterByBranch && branchId
          ? { role: 'CUSTOMER', branchId }
          : { role: 'CUSTOMER' }
      }),
      shouldFilterByBranch ? 1 : prisma.branch.count(),
      prisma.order.findMany({
        where: shouldFilterByBranch && branchId
          ? { branchId }
          : undefined,
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Calculate daily sales for the last 30 days based on actual orders
    const today = new Date();
    const dailySales = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      dailySales.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length
      });
    }

    // Calculate customer retention (customers who have reviews vs total customers)
    const customersWithReviews = await prisma.review.findMany({
      distinct: ['userId'],
      select: { userId: true }
    });
    
    const retentionRate = customers > 0 
      ? (customersWithReviews.length / customers) * 100 
      : 0;

    // Calculate average rating over time
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Top selling items based on actual order data
    const itemSales = new Map<string, { name: string; sales: number; stock: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemSales.get(item.menuItem.name);
        if (existing) {
          existing.sales += item.price * item.quantity;
        } else {
          const currentItem = inventory.find(inv => inv.id === item.menuItemId);
          itemSales.set(item.menuItem.name, {
            name: item.menuItem.name,
            sales: item.price * item.quantity,
            stock: currentItem?.quantity || 0
          });
        }
      });
    });

    const topItems = Array.from(itemSales.values())
      .map(item => ({
        name: item.name,
        estimatedSales: item.sales,
        currentStock: item.stock
      }))
      .sort((a, b) => b.estimatedSales - a.estimatedSales)
      .slice(0, 5);

    // Revenue growth calculation (compare last 7 days vs previous 7 days)
    const last7Days = dailySales.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    const previous7Days = dailySales.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
    const revenueGrowth = previous7Days > 0 
      ? ((last7Days - previous7Days) / previous7Days) * 100 
      : 0;

    const analyticsData = {
      period: {
        start: dailySales[0].date,
        end: dailySales[dailySales.length - 1].date
      },
      sales: {
        daily: dailySales,
        totalRevenue: dailySales.reduce((sum, day) => sum + day.revenue, 0),
        totalOrders: dailySales.reduce((sum, day) => sum + day.orders, 0),
        avgOrderValue: dailySales.reduce((sum, day) => sum + day.orders, 0) > 0 
          ? dailySales.reduce((sum, day) => sum + day.revenue, 0) / dailySales.reduce((sum, day) => sum + day.orders, 0)
          : 0
      },
      customers: {
        total: customers,
        withReviews: customersWithReviews.length,
        retentionRate: retentionRate
      },
      performance: {
        averageRating: avgRating,
        totalReviews: reviews.length,
        revenueGrowth: revenueGrowth,
        topSellingItems: topItems
      },
      inventory: {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        lowStockItems: inventory.filter(item => item.quantity < 10).length
      },
      branches: {
        total: branches,
        filteredByBranch: shouldFilterByBranch
      }
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
};
