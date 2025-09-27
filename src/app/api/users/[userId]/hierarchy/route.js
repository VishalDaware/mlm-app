// src/app/api/users/[userId]/hierarchy/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { userId } = params;

  try {
    // 1. Fetch all users from the database at once, but only the fields we need.
    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, role: true, uplineId: true },
    });

    // 2. Create a map for easy lookups (id -> user object).
    // Initialize each user with an empty 'children' array.
    const userMap = new Map(allUsers.map(user => [user.id, { ...user, children: [] }]));

    // 3. Build the complete tree structure.
    // Iterate over all users and place each one as a child of their upline.
    allUsers.forEach(user => {
      if (user.uplineId) {
        const parent = userMap.get(user.uplineId);
        if (parent) {
          parent.children.push(userMap.get(user.id));
        }
      }
    });

    // 4. Find the correct starting point for the hierarchy (e.g., 'admin').
    const rootUserInDb = allUsers.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    
    if (!rootUserInDb) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // 5. Get the complete, nested tree structure starting from that root user.
    const hierarchyData = userMap.get(rootUserInDb.id);
    
    return NextResponse.json(hierarchyData);

  } catch (error) {
    console.error("Failed to fetch hierarchy:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
