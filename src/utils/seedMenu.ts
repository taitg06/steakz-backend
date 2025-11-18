import prisma from './prisma';

export async function seedMenuItems() {
  try {
    // Check if we already have menu items
    const existingItems = await prisma.menuItem.count();
    if (existingItems > 0) {
      console.log('Menu items already seeded.');
      return;
    }

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

    // Seed menu items
    const menuItems = [
      {
        name: 'Tomahawk Steak',
        description: 'Premium bone-in ribeye, perfectly grilled and served with roasted garlic and herb butter.',
        price: 65.00,
        quantity: 50,
        branchId: branch.id
      },
      {
        name: 'Wagyu Striploin',
        description: 'Japanese A5 Wagyu, melt-in-your-mouth texture, served with truffle mashed potatoes.',
        price: 120.00,
        quantity: 30,
        branchId: branch.id
      },
      {
        name: 'Filet Mignon',
        description: 'Center-cut tenderloin, char-grilled, with red wine demi-glace and seasonal vegetables.',
        price: 48.00,
        quantity: 60,
        branchId: branch.id
      },
      {
        name: 'Swiss Rösti & Steak',
        description: 'Juicy steak medallions served atop crispy Swiss rösti, with creamy mushroom sauce.',
        price: 38.00,
        quantity: 40,
        branchId: branch.id
      },
      {
        name: 'Steakz Burger',
        description: 'House-ground steak burger, aged cheddar, caramelized onions, and steakhouse aioli.',
        price: 22.00,
        quantity: 80,
        branchId: branch.id
      }
    ];

    for (const item of menuItems) {
      await prisma.menuItem.create({ data: item });
    }

    console.log('✅ Seeded menu items.');
  } catch (error) {
    console.error('Error seeding menu items:', error);
  }
}
