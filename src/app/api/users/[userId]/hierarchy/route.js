import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { userId } = params;

  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, role: true, uplineId: true },
    });


    const userMap = new Map(allUsers.map(user => [user.id, { ...user, children: [] }]));


    allUsers.forEach(user => {
      if (user.uplineId) {
        const parent = userMap.get(user.uplineId);
        if (parent) {
          parent.children.push(userMap.get(user.id));
        }
      }
    });

    const rootUserInDb = allUsers.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    
    if (!rootUserInDb) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const hierarchyData = userMap.get(rootUserInDb.id);
    
    return NextResponse.json(hierarchyData);

  } catch (error) {
    console.error("Failed to fetch hierarchy:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
