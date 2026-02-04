import prisma from './prisma';

// Default menu items to be created for all branches
export const DEFAULT_MENU_ITEMS = [
  {
    name: 'Tomahawk Steak',
    description: 'Premium bone-in ribeye, perfectly grilled and served with roasted garlic and herb butter.',
    price: 65.00,
    quantity: 50
  },
  {
    name: 'Wagyu Striploin',
    description: 'Japanese A5 Wagyu, melt-in-your-mouth texture, served with truffle mashed potatoes.',
    price: 120.00,
    quantity: 30
  },
  {
    name: 'Filet Mignon',
    description: 'Center-cut tenderloin, char-grilled, with red wine demi-glace and seasonal vegetables.',
    price: 48.00,
    quantity: 60
  },
  {
    name: 'Swiss Rösti & Steak',
    description: 'Juicy steak medallions served atop crispy Swiss rösti, with creamy mushroom sauce.',
    price: 38.00,
    quantity: 40
  },
  {
    name: 'Steakz Burger',
    description: 'House-ground steak burger, aged cheddar, caramelized onions, and steakhouse aioli.',
    price: 22.00,
    quantity: 80
  }
];

// Helper function to create menu items for a specific branch
export async function createMenuItemsForBranch(branchId: number) {
  try {
    for (const item of DEFAULT_MENU_ITEMS) {
      // Check if this menu item already exists for this branch
      const existingItem = await prisma.menuItem.findFirst({
        where: {
          name: item.name,
          branchId: branchId
        }
      });
      
      if (!existingItem) {
        await prisma.menuItem.create({
          data: {
            ...item,
            branchId
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error creating menu items for branch ${branchId}:`, error);
  }
}

export async function seedMenuItems() {
  try {
    // Get or create a default branch
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Main Branch',
          address: '123 Main Street',
          phone: '+1234567890'
        }
      });
    }

    // Create menu items for the branch if they don't exist
    await createMenuItemsForBranch(branch.id);

    // Also create menu items for any other branches that don't have items yet
    const allBranches = await prisma.branch.findMany();
    for (const branchItem of allBranches) {
      const menuCount = await prisma.menuItem.count({
        where: { branchId: branchItem.id }
      });
      
      if (menuCount === 0) {
        await createMenuItemsForBranch(branchItem.id);
      }
    }

    console.log('✅ Seeded menu items for all branches.');
  } catch (error) {
    console.error('Error seeding menu items:', error);
  }
}
