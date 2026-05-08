import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MessageUI from "./MessageUI";

export default async function AdminMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const adminId = session.user.id;

  const users = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "STUDENT"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });

  const rooms = await prisma.room.findMany({
    where: {
      type: "DIRECT",
      members: { some: { userId: adminId } },
    },
    include: {
      members: { include: { user: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
  });

  return (
    <MessageUI
      currentUserId={adminId}
      currentUserName={session.user.name ?? ""}
      contacts={users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role as "TEACHER" | "STUDENT",
      }))}
      rooms={rooms.map((r) => ({
        id: r.id,
        otherUser: r.members.find((m) => m.userId !== adminId)?.user ?? null,
        lastMessage: r.messages[0] ?? null,
      }))}
    />
  );
}
