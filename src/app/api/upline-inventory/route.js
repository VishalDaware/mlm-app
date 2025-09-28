import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get the logged-in user
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

/**
 * This endpoint is specifically for fetching the inventory of the
 * logged-in user's direct upline. For a Farmer, this gets their
 * assigned Dealer's available stock.
 */
export async function GET() {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // If the user doesn't have an upline (e.g., Admin, or unassigned user),
    // return an empty array as there's no inventory to show.
    if (!loggedInUser.uplineId) {
        return NextResponse.json([]); 
    }

    // Fetch the inventory of the user's upline (e.g., the Dealer)
    const uplineInventory = await prisma.userInventory.findMany({
      where: {
        userId: loggedInUser.uplineId,
        quantity: { gt: 0 } // IMPORTANT: Only show products the dealer actually has in stock
      },
      include: {
        product: true, // Include full product details (name, price, etc.)
      },
      orderBy: {
        product: { name: 'asc' }
      }
    });

    return NextResponse.json(uplineInventory);

  } catch (error) {
    console.error("Failed to fetch upline inventory:", error);
    return NextResponse.json({ error: "Failed to fetch dealer's stock." }, { status: 500 });
  }
}

