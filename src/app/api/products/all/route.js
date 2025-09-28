import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Find the Admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'Admin' },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'System error: Admin account not found.' }, { status: 500 });
    }

    // 2. Get all products and the Admin's inventory in parallel
    const [allProducts, adminInventory] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: 'asc' } }),
      prisma.userInventory.findMany({
        where: { userId: adminUser.id },
      }),
    ]);

    // 3. Create a simple map for the Admin's stock quantities
    const adminStockMap = new Map(
      adminInventory.map(item => [item.productId, item.quantity])
    );

    // 4. Combine the data, ensuring every product has a stock value
    const productsWithMasterStock = allProducts.map(product => ({
      ...product,
      // Use the Admin's stock, or default to 0 if they don't have an entry
      stock: adminStockMap.get(product.id) || 0,
    }));

    return NextResponse.json(productsWithMasterStock);
  } catch (error) {
    console.error("Failed to fetch master product list:", error);
    return NextResponse.json({ error: 'Failed to fetch product data.' }, { status: 500 });
  }
}
