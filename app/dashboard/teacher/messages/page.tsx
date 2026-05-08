import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MessageUI from "./MessageUI";

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const teacherId = session.user.id;

  // Trouver les élèves des classes du prof
  const teacherClasses = await prisma.teacherClass.findMany({
    where: { teacherId },
    include: {
      class: {
        include: {
          enrollments: { include: { student: true } },
        },
      },
    },
  });

  const students = Array.from(
    new Map(
      teacherClasses
        .flatMap((tc) => tc.class.enrollments.map((e) => e.student))
        .map((s) => [s.id, s])
    ).values()
  );

  // Charger les rooms existantes avec le prof
  const rooms = await prisma.room.findMany({
    where: {
      type: "DIRECT",
      members: { some: { userId: teacherId } },
    },
    include: {
      members: { include: { user: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
  });

  return (
    <MessageUI
      currentUserId={teacherId}
      currentUserName={session.user.name ?? ""}
      contacts={students.map((s) => ({ id: s.id, name: s.name, role: "STUDENT" as const }))}
      rooms={rooms.map((r) => ({
        id: r.id,
        otherUser: r.members.find((m) => m.userId !== teacherId)?.user ?? null,
        lastMessage: r.messages[0] ?? null,
      }))}
    />
  );
}
