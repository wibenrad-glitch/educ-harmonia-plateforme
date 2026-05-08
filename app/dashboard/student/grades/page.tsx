import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function getScoreColor(score: number) {
  if (score >= 16) return "text-green-700 bg-green-50 border-green-300";
  if (score >= 12) return "text-blue-700 bg-blue-50 border-blue-300";
  if (score >= 8) return "text-orange-700 bg-orange-50 border-orange-300";
  return "text-red-700 bg-red-50 border-red-300";
}

function getScoreMention(score: number) {
  if (score >= 16) return "Très bien 🌟";
  if (score >= 14) return "Bien 👍";
  if (score >= 12) return "Assez bien";
  if (score >= 10) return "Passable";
  if (score >= 8) return "Insuffisant";
  return "Très insuffisant";
}

function getScoreBar(score: number) {
  const pct = Math.round((score / 20) * 100);
  let color = "bg-red-400";
  if (score >= 16) color = "bg-green-500";
  else if (score >= 12) color = "bg-blue-500";
  else if (score >= 8) color = "bg-orange-400";
  return { pct, color };
}

export default async function GradesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        include: {
          level: true,
          courses: {
            include: {
              teacher: true,
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: session.user.id },
                    include: { grade: true },
                  },
                },
                orderBy: { dueDate: "asc" },
              },
            },
          },
        },
      },
    },
  });

  const courses = enrollments.flatMap((e) =>
    e.class.courses.map((c) => ({
      ...c,
      className: e.class.name,
      levelName: e.class.level.name,
    }))
  );

  const courseStats = courses.map((course) => {
    const gradedAssignments = course.assignments
      .filter((a) => a.submissions[0]?.grade)
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        score: a.submissions[0].grade!.score,
        feedback: a.submissions[0].grade!.feedback,
        gradedAt: a.submissions[0].grade!.gradedAt,
      }));

    const pendingAssignments = course.assignments.filter((a) => !a.submissions[0]);
    const submittedNotGraded = course.assignments.filter(
      (a) => a.submissions[0] && !a.submissions[0].grade
    );

    const average =
      gradedAssignments.length > 0
        ? gradedAssignments.reduce((sum, a) => sum + a.score, 0) / gradedAssignments.length
        : null;

    return {
      id: course.id,
      title: course.title,
      teacherName: course.teacher.name,
      className: course.className,
      levelName: course.levelName,
      gradedAssignments,
      pendingCount: pendingAssignments.length,
      submittedNotGradedCount: submittedNotGraded.length,
      average,
    };
  });

  const allGrades = courseStats.flatMap((c) => c.gradedAssignments);
  const globalAverage =
    allGrades.length > 0
      ? allGrades.reduce((sum, g) => sum + g.score, 0) / allGrades.length
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/student" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour au tableau de bord
          </a>
          <div className="flex items-start justify-between mt-3 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">🏆</span>
                Mes notes
              </h1>
              <p className="text-gray-500 text-sm mt-1 ml-1">Bulletin de résultats — {allGrades.length} devoir{allGrades.length > 1 ? "s" : ""} noté{allGrades.length > 1 ? "s" : ""}</p>
            </div>
            {allGrades.length > 0 && (
              <a
                href="/api/grades/bulletin"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
              >
                🖨️ Imprimer le bulletin
              </a>
            )}
          </div>
        </div>

        {/* ── Moyenne générale ── */}
        {globalAverage !== null ? (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-indigo-200">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide mb-3">Moyenne générale</p>
            <div className="flex items-center gap-6">
              <div className="text-center bg-white/20 rounded-2xl px-6 py-4">
                <p className="text-5xl font-bold">{globalAverage.toFixed(1)}</p>
                <p className="text-indigo-200 text-sm mt-1">/ 20</p>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{getScoreMention(globalAverage)}</p>
                <p className="text-indigo-200 text-sm">
                  Calculée sur {allGrades.length} devoir{allGrades.length > 1 ? "s" : ""} noté{allGrades.length > 1 ? "s" : ""}
                </p>
                <div className="mt-3 bg-white/20 rounded-full h-2.5 w-48">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all"
                    style={{ width: `${Math.round((globalAverage / 20) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200 mb-8">
            <span className="text-6xl block mb-4">📋</span>
            <p className="text-gray-600 text-lg font-semibold">Aucune note pour le moment</p>
            <p className="text-gray-400 text-sm mt-2">Tes professeurs n&apos;ont pas encore corrigé de devoirs.</p>
          </div>
        )}

        {/* ── Notes par matière ── */}
        {courseStats.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-green-400 rounded" /> Notes par matière
            </h2>
            <div className="space-y-5">
              {courseStats.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* En-tête matière */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">{course.title}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {course.levelName} — {course.className} &nbsp;·&nbsp; Prof : <span className="font-medium">{course.teacherName}</span>
                      </p>
                    </div>
                    {course.average !== null ? (
                      <div className={`text-center border-2 rounded-2xl px-5 py-3 min-w-[80px] ${getScoreColor(course.average)}`}>
                        <p className="text-2xl font-bold leading-none">{course.average.toFixed(1)}</p>
                        <p className="text-xs mt-0.5 font-medium">/20</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 bg-gray-100 px-4 py-2 rounded-xl font-medium">
                        Pas encore noté
                      </span>
                    )}
                  </div>

                  {/* Barre de progression de la moyenne */}
                  {course.average !== null && (
                    <div className="px-6 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getScoreBar(course.average).color}`}
                            style={{ width: `${getScoreBar(course.average).pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{getScoreMention(course.average)}</span>
                      </div>
                    </div>
                  )}

                  {/* Liste des devoirs notés */}
                  {course.gradedAssignments.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      <p className="px-6 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Devoirs corrigés ({course.gradedAssignments.length})
                      </p>
                      {course.gradedAssignments.map((a) => (
                        <div key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{a.title}</p>
                            {a.feedback && (
                              <p className="text-sm text-gray-500 mt-0.5 italic">&ldquo;{a.feedback}&rdquo;</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Corrigé le {new Date(a.gradedAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className={`shrink-0 text-center border-2 rounded-xl px-3 py-2 min-w-[56px] ${getScoreColor(a.score)}`}>
                            <p className="text-xl font-bold leading-none">{a.score}</p>
                            <p className="text-xs mt-0.5">/20</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-5 text-sm text-gray-400 italic">
                      Aucun devoir corrigé pour cette matière.
                    </div>
                  )}

                  {/* Statuts en attente */}
                  {(course.pendingCount > 0 || course.submittedNotGradedCount > 0) && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
                      {course.pendingCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                          <strong>{course.pendingCount}</strong> devoir{course.pendingCount > 1 ? "s" : ""} à rendre
                        </span>
                      )}
                      {course.submittedNotGradedCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                          <strong>{course.submittedNotGradedCount}</strong> en attente de correction
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
