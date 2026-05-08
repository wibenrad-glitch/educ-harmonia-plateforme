import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StudentAssignmentsClient from "./StudentAssignmentsClient";

export default async function StudentAssignments() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        include: {
          courses: {
            include: {
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: session.user.id },
                    include: { grade: true },
                  },
                },
                orderBy: { dueDate: "asc" },
              },
              teacher: true,
            },
          },
        },
      },
    },
  });

  const assignments = enrollments.flatMap((e) =>
    e.class.courses.flatMap((c) =>
      c.assignments.map((a) => ({
        ...a,
        courseName: c.title,
        teacherName: c.teacher.name,
        submission: a.submissions[0] ?? null,
      }))
    )
  );

  const pending = assignments.filter((a) => !a.submission);
  const submitted = assignments.filter((a) => a.submission);

  return (
    <StudentAssignmentsClient
      studentId={session.user.id}
      pending={pending.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate.toISOString(),
        courseName: a.courseName,
        teacherName: a.teacherName,
      }))}
      submitted={submitted.map((a) => ({
        id: a.id,
        title: a.title,
        courseName: a.courseName,
        submission: a.submission
          ? {
              content: a.submission.content,
              fileUrl: a.submission.fileUrl,
              grade: a.submission.grade
                ? { score: a.submission.grade.score, feedback: a.submission.grade.feedback }
                : null,
            }
          : null,
      }))}
    />
  );
}
