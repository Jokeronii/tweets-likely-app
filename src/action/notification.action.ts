'use server';

import { prisma } from '@/lib/prisma';
import { getDbUserId } from './user.action';

export async function getNotifications() {
  try {
    const userId = await getDbUserId();
    console.log(userId);

    if (!userId) return [];

    const notifications = await prisma.notification.findMany({
      //filter kondisi by id
      where: { userId },
      //include field sama seperti join, apa yang mau di include
      include: {
        creator: {
          //select kolom mana?this case using creator(users property pointer)
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  } catch (error) {
    console.log('error in fetching notifications', error);
    throw new Error('failed to fetch notifications');
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        read: true,
      },
    });
    return { success: true };
  } catch (error) {
    console.log('error in marking notifications as read', error);
    return { success: false };
  }
}
