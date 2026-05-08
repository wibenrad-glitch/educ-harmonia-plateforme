import { prisma } from "@/lib/prisma";

export async function notify(userId: string, title: string, message: string) {
  await prisma.notification.create({
    data: { userId, title, message },
  });
}

export async function notifyMany(userIds: string[], title: string, message: string) {
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, title, message })),
  });
}
