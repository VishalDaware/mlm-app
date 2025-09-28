import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get the logged-in user, defined once
async function getLoggedInUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// GET function to fetch all sales data for analytics (Admin only)
export async function GET() {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sales = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        seller: { select: { name: true } },
        buyer: { select: { name: true } },
      },
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales data:", error);
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
  }
}

// POST function to create a new sale/transaction
export async function POST(request) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity } = body;
    
    // --- NEW LOGIC FOR FARMER AND OTHER ROLES ---
    let sellerId;
    let buyerId;
    let stockHolderId;

    // Case 1: A Farmer is buying from their upline (Dealer)
    if (loggedInUser.role === 'Farmer') {
        if (!loggedInUser.uplineId) {
            return NextResponse.json({ error: 'Your account is not assigned to a dealer.' }, { status: 400 });
        }
        sellerId = loggedInUser.uplineId;
        buyerId = loggedInUser.id;
        stockHolderId = sellerId; // The dealer's stock is checked
    } 
    // Case 2: A Franchise is selling (stock comes from Admin)
    else if (loggedInUser.role === 'Franchise') {
        const adminUser = await prisma.user.findFirst({ where: { role: 'Admin' } });
        if (!adminUser) {
            return NextResponse.json({ error: 'System configuration error: Admin account not found.' }, { status: 500 });
        }
        sellerId = loggedInUser.id; // Franchise is the seller of record
        buyerId = body.buyerId;     // The buyer is passed in the request
        stockHolderId = adminUser.id; // But stock is deducted from the Admin
    }
    // Case 3: Any other user (Dealer, Distributor) is selling from their own stock
    else {
        sellerId = loggedInUser.id;
        buyerId = body.buyerId;
        stockHolderId = sellerId; // They sell from their own inventory
    }

    if (!buyerId) {
        return NextResponse.json({ error: 'Buyer ID is required for this transaction.' }, { status: 400 });
    }

    const [seller, buyer, product, stockHolderInventory] = await Promise.all([
      prisma.user.findUnique({ where: { id: sellerId } }),
      prisma.user.findUnique({ where: { id: buyerId } }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.userInventory.findUnique({
        where: { userId_productId: { userId: stockHolderId, productId: productId } },
      }),
    ]);
    
    if (!seller || !buyer || !product) {
      return NextResponse.json({ error: 'Invalid user or product.' }, { status: 400 });
    }
    if (!stockHolderInventory || stockHolderInventory.quantity < quantity) {
      return NextResponse.json({ error: `The seller has insufficient stock for ${product.name}.` }, { status: 400 });
    }

    // Pricing Logic
    let purchasePrice;
    let costPrice;

    // Cost is based on the actual seller's role
    switch (seller.role) {
      case 'Admin': costPrice = 0; break;
      case 'Franchise': costPrice = product.franchisePrice; break;
      case 'Distributor': costPrice = product.distributorPrice; break;
      case 'SubDistributor': costPrice = product.subDistributorPrice; break;
      case 'Dealer': costPrice = product.dealerPrice; break;
      default: costPrice = 0;
    }

    // Purchase price is based on the buyer's role
    switch (buyer.role) {
      case 'Franchise': purchasePrice = product.franchisePrice; break;
      case 'Distributor': purchasePrice = product.distributorPrice; break;
      case 'SubDistributor': purchasePrice = product.subDistributorPrice; break;
      case 'Dealer': purchasePrice = product.dealerPrice; break;
      case 'Farmer': purchasePrice = product.farmerPrice; break;
      default:
        return NextResponse.json({ error: 'Invalid buyer role.' }, { status: 400 });
    }

    const totalAmount = purchasePrice * quantity;
    const profit = (purchasePrice - costPrice) * quantity;

    const newTransaction = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock from the correct stock holder
      await tx.userInventory.update({
        where: { id: stockHolderInventory.id },
        data: { quantity: { decrement: quantity } },
      });

      // 2. Add stock to the buyer
      await tx.userInventory.upsert({
        where: { userId_productId: { userId: buyerId, productId: productId } },
        update: { quantity: { increment: quantity } },
        create: { userId: buyerId, productId: productId, quantity: quantity },
      });

      // 3. Create the transaction record
      const transaction = await tx.transaction.create({
        data: { sellerId, buyerId, productId, quantity, purchasePrice, totalAmount, profit },
      });

      return transaction;
    });

    return NextResponse.json(newTransaction, { status: 201 });

  } catch (error) {
    console.error("Transaction failed:", error);
    return NextResponse.json({ error: 'Transaction failed.' }, { status: 500 });
  }
}

