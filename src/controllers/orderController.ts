import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const { customerName, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items are required' });
      return;
    }

    // Get cashier's branch
    let branchId: number | null = null;
    if (currentUser.role === 'CASHIER' || currentUser.role === 'CHEF') {
      const staffUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      branchId = staffUser?.branchId || null;
    }

    if (!branchId) {
      res.status(403).json({ message: 'You must be assigned to a branch to process orders' });
      return;
    }

    let totalAmount = 0;
    const orderItems: Array<{
      menuItemId: number;
      quantity: number;
      price: number;
    }> = [];

    // Validate items and calculate total
    for (const item of items) {
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: item.menuItemId,
          branchId: branchId
        }
      });

      if (!menuItem) {
        res.status(404).json({ message: `Menu item ${item.menuItemId} not found in your branch` });
        return;
      }

      if (menuItem.quantity < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.quantity}` });
        return;
      }

      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          customerName: customerName || 'Walk-in Customer',
          totalAmount,
          branchId,
          cashierId: currentUser.id,
          items: {
            create: orderItems.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });

      // Update inventory quantities
      for (const item of orderItems) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return newOrder;
    });

    res.status(201).json({
      message: 'Order completed successfully',
      order: {
        id: order.id,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price
        }))
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Error processing checkout' });
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
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

    const orders = await prisma.order.findMany({
      where: shouldFilterByBranch && branchId
        ? { branchId }
        : undefined,
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        cashier: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// Customer order endpoint - allows customers to place orders
export const createCustomerOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const { items, branchId, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items are required' });
      return;
    }

    if (!branchId) {
      res.status(400).json({ message: 'Branch selection is required' });
      return;
    }

    if (!paymentMethod) {
      res.status(400).json({ message: 'Payment method is required' });
      return;
    }

    // Validate payment method
    const validPaymentMethods = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE_PAYMENT'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      res.status(400).json({ message: 'Invalid payment method' });
      return;
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch) {
      res.status(404).json({ message: 'Branch not found' });
      return;
    }

    let totalAmount = 0;
    const orderItems: Array<{
      menuItemId: number;
      quantity: number;
      price: number;
    }> = [];

    // Validate items and calculate total
    for (const item of items) {
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: item.menuItemId,
          branchId: branchId
        }
      });

      if (!menuItem) {
        res.status(404).json({ message: `Menu item not available at selected branch` });
        return;
      }

      if (menuItem.quantity < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.quantity}` });
        return;
      }

      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Get customer name
    const customer = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { name: true }
    });

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order with PENDING status
      const newOrder = await tx.order.create({
        data: {
          customerName: customer?.name || 'Customer',
          totalAmount,
          branchId,
          customerId: currentUser.id,
          paymentMethod,
          status: 'PENDING',
          items: {
            create: orderItems.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: {
            include: {
              menuItem: true
            }
          },
          branch: {
            select: {
              name: true,
              address: true,
              phone: true
            }
          }
        }
      });

      // Update inventory quantities
      for (const item of orderItems) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return newOrder;
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order.id,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
        branch: order.branch,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price
        }))
      }
    });
  } catch (error) {
    console.error('Customer order error:', error);
    res.status(500).json({ message: 'Error placing order' });
  }
};

// Get customer's own orders
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;

    const orders = await prisma.order.findMany({
      where: {
        customerId: currentUser.id
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Error fetching your orders' });
  }
};

// Confirm payment for a customer order
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const { orderId } = req.params;

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Verify the order belongs to the current customer
    if (order.customerId !== currentUser.id) {
      res.status(403).json({ message: 'You are not authorized to confirm this order' });
      return;
    }

    // Check if order is already completed
    if (order.status === 'COMPLETED' || order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'READY') {
      res.status(400).json({ message: 'Order has already been processed' });
      return;
    }

    // Update order status to PENDING (waiting for cashier confirmation)
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'PENDING' },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    res.json({
      message: 'Payment confirmed successfully. Waiting for cashier confirmation.',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
};

// Customer confirms order collection
export const confirmCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const { orderId } = req.params;

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Verify the order belongs to the current customer
    if (order.customerId !== currentUser.id) {
      res.status(403).json({ message: 'You are not authorized to confirm this order' });
      return;
    }

    // Check if order is ready for collection
    if (order.status !== 'READY') {
      res.status(400).json({ message: 'Order is not ready for collection yet' });
      return;
    }

    // Update order status to COMPLETED
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'COMPLETED' },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    res.json({
      message: 'Order collection confirmed. Thank you!',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Confirm collection error:', error);
    res.status(500).json({ message: 'Error confirming collection' });
  }
};

// Get pending customer orders for cashier POS
export const getPendingOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;

    // Get cashier's branch
    let branchId: number | null = null;
    
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      branchId = managerBranch?.id || null;
    } else if (currentUser.role === 'CASHIER') {
      const cashierUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      branchId = cashierUser?.branchId || null;
    }

    if (!branchId) {
      res.status(400).json({ message: 'No branch assigned' });
      return;
    }

    // Fetch pending orders from customer orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        branchId,
        customerId: { not: null },
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(pendingOrders);
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ message: 'Error fetching pending orders' });
  }
};

// Cashier confirms customer order
export const cashierConfirmOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const { orderId } = req.params;

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        customer: {
          select: {
            name: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Verify cashier's branch matches order branch
    const cashierUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { branchId: true }
    });

    if (cashierUser?.branchId !== order.branchId) {
      res.status(403).json({ message: 'You can only confirm orders for your branch' });
      return;
    }

    // Check if order is already completed
    if (order.status === 'COMPLETED' || order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'READY') {
      res.status(400).json({ message: 'Order has already been processed' });
      return;
    }

    // Update order status to CONFIRMED (ready for kitchen) and assign cashier
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { 
        status: 'CONFIRMED',
        cashierId: currentUser.id
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        customer: {
          select: {
            name: true
          }
        },
        cashier: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Order confirmed successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cashier confirm order error:', error);
    res.status(500).json({ message: 'Error confirming order' });
  }
};

// Get confirmed orders for chef (kitchen display)
export const getKitchenOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;

    // Get chef's branch
    let branchId: number | null = null;
    
    if (currentUser.role === 'BRANCH_MANAGER') {
      const managerBranch = await prisma.branch.findUnique({
        where: { managerId: currentUser.id }
      });
      branchId = managerBranch?.id || null;
    } else if (currentUser.role === 'CHEF') {
      const chefUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { branchId: true }
      });
      branchId = chefUser?.branchId || null;
    }

    if (!branchId) {
      res.status(400).json({ message: 'No branch assigned' });
      return;
    }

    // Fetch orders that are confirmed but not yet completed (for kitchen)
    const kitchenOrders = await prisma.order.findMany({
      where: {
        branchId,
        customerId: { not: null },
        status: {
          in: ['CONFIRMED', 'PREPARING', 'READY']
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        cashier: {
          select: {
            name: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(kitchenOrders);
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    res.status(500).json({ message: 'Error fetching kitchen orders' });
  }
};

// Chef updates order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Verify chef's branch matches order branch
    const chefUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { branchId: true }
    });

    if (chefUser?.branchId !== order.branchId) {
      res.status(403).json({ message: 'You can only update orders for your branch' });
      return;
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        customer: {
          select: {
            name: true
          }
        },
        cashier: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};
