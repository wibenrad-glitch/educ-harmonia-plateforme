import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MessageUI from "./MessageUI";

export default async function StudentMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") redirect("/login");

  const studentId = session.user.id;

  // Trouver les profs de l'élève via ses inscriptions
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      class: {
        include: {
          teacherClasses: { include: { teacher: true } },
        },
      },
    },
  });

  const teachers = Array.from(
    new Map(
      enrollments
        .flatMap((e) => e.class.teacherClasses.map((tc) => tc.teacher))
        .map((t) => [t.id, t])
    ).values()
  );

  // Charger les rooms existantes avec l'élève
  const rooms = await prisma.room.findMany({
    where: {
      type: "DIRECT",
      members: { some: { userId: studentId } },
    },
    include: {
      members: { include: { user: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
  });

  return (
    <MessageUI
      currentUserId={studentId}
      currentUserName={session.user.name ?? ""}
      contacts={teachers.map((t) => ({ id: t.id, name: t.name, role: "TEACHER" as const }))}
      rooms={rooms.map((r) => ({
        id: r.id,
        otherUser: r.members.find((m) => m.userId !== studentId)?.user ?? null,
        lastMessage: r.messages[0] ?? null,
      }))}
    />
  );
}
