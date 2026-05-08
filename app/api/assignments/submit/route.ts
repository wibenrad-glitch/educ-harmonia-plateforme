import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { assignmentId, studentId, content, fileUrl } = await req.json();

  if (!assignmentId || studentId !== session.user.id) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  if (!content && !fileUrl) {
    return NextResponse.json({ error: "Contenu ou fichier requis" }, { status: 400 });
  }

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    update: { content: content ?? null, fileUrl: fileUrl ?? null },
    create: { assignmentId, studentId, content: content ?? null, fileUrl: fileUrl ?? null },
  });

  // Notifier le professeur du cours
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });

  if (assignment) {
    await notify(
      assignment.course.teacherId,
      "Devoir rendu 📝",
      `${session.user.name} a rendu "${assignment.title}" dans ${assignment.course.title}`
    );
  }

  return NextResponse.json(submission);
}
