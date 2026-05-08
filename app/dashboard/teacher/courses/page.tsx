import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Mes cours" };

export default async function TeacherCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id },
    include: {
      class: { include: { level: true, enrollments: true } },
      sessions: {
        where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
        orderBy: { scheduledAt: "asc" },
        take: 1,
      },
      assignments: {
        include: { submissions: { include: { grade: true } } },
      },
      resources: true,
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/dashboard/teacher"
              className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1 mb-2">
              ← Retour au tableau de bord
            </a>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">📖</span>
              Mes cours
            </h1>
            <p className="text-gray-500 text-sm mt-1 ml-1">
              {courses.length} cours assigné{courses.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Liste ── */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <span className="text-6xl block mb-4">📚</span>
            <p className="text-gray-600 text-lg font-semibold">Aucun cours assigné pour le moment.</p>
            <p className="text-gray-400 text-sm mt-1">Contactez votre administrateur pour obtenir des cours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((course) => {
              const totalEleves = course.class.enrollments.length;
              const pending = course.assignments.flatMap((a) =>
                a.submissions.filter((s) => !s.grade)
              ).length;
              const nextSession = course.sessions[0];
              const totalSubmissions = course.assignments.flatMap((a) => a.submissions).length;

              return (
                <a
                  key={course.id}
                  href={`/dashboard/teacher/courses/${course.id}`}
                  className="group bg-white rounded-2xl shadow-md border-2 border-blue-100 hover:border-blue-400 hover:shadow-lg transition overflow-hidden flex flex-col"
                >
                  {/* En-tête coloré */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 text-white">
                    <h2 className="font-bold text-lg leading-tight">{course.title}</h2>
                    <p className="text-blue-100 text-sm mt-0.5">
                      {course.class.level.name} — {course.class.name}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="px-6 py-4 flex gap-5 text-sm text-gray-700 border-b border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-xs">👨‍🎓</span>
                      {totalEleves} élève{totalEleves > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-xs">📝</span>
                      {course.assignments.length} devoir{course.assignments.length > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-xs">📎</span>
                      {course.resources.length} ressource{course.resources.length > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center text-xs">📬</span>
                      {totalSubmissions} rendu{totalSubmissions > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 flex items-center justify-between mt-auto">
                    {nextSession ? (
                      <p className="text-xs text-gray-500">
                        🎥 Prochain cours :{" "}
                        <span className="font-semibold text-gray-700">
                          {new Date(nextSession.scheduledAt).toLocaleDateString("fr-FR", {
                            weekday: "short", day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Aucun cours planifié</p>
                    )}
                    {pending > 0 && (
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                        {pending} à corriger
              </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
