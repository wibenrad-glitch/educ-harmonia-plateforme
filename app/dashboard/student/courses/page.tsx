import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const RESOURCE_ICONS: Record<string, string> = {
  PDF: "📄",
  IMAGE: "🖼️",
  LINK: "🔗",
};

const RESOURCE_COLORS: Record<string, string> = {
  PDF: "bg-red-100 text-red-700 border border-red-200",
  IMAGE: "bg-blue-100 text-blue-700 border border-blue-200",
  LINK: "bg-purple-100 text-purple-700 border border-purple-200",
};

const COURSE_GRADIENTS = [
  "from-indigo-500 to-indigo-700",
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-green-500 to-green-700",
  "from-orange-500 to-orange-700",
  "from-pink-500 to-pink-700",
];

export default async function StudentCourses() {
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
              sessions: {
                where: { status: { in: ["SCHEDULED", "LIVE"] } },
                orderBy: { scheduledAt: "asc" },
                take: 1,
              },
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: session.user.id },
                    include: { grade: true },
                  },
                },
                orderBy: { dueDate: "asc" },
              },
              resources: { orderBy: { id: "asc" } },
            },
          },
        },
      },
    },
  });

  const courses = enrollments.flatMap((e, idx) =>
    e.class.courses.map((c, cidx) => ({
      ...c,
      level: e.class.level,
      className: e.class.name,
      gradient: COURSE_GRADIENTS[(idx + cidx) % COURSE_GRADIENTS.length],
    }))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/student" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour au tableau de bord
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">📖</span>
            Mes cours
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {courses.length} matière{courses.length > 1 ? "s" : ""} inscrite{courses.length > 1 ? "s" : ""}
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <span className="text-6xl block mb-4">📚</span>
            <p className="text-gray-600 text-lg font-semibold">Tu n&apos;es inscrit à aucun cours</p>
            <p className="text-gray-400 text-sm mt-2">Contacte l&apos;administration pour t&apos;inscrire.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => {
              const nextSession = course.sessions[0];
              const pendingAssignments = course.assignments.filter((a) => !a.submissions[0]).length;
              const totalAssignments = course.assignments.length;

              return (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">

                  {/* ── En-tête coloré ── */}
                  <div className={`bg-gradient-to-r ${course.gradient} px-6 py-5 text-white`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold leading-tight">{course.title}</h2>
                        <p className="text-white/75 text-sm mt-1">
                          {course.level.name} — {course.className}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white/60 text-xs">Professeur</p>
                        <p className="font-bold text-sm mt-0.5">{course.teacher.name}</p>
                      </div>
                    </div>

                    {/* Prochain cours */}
                    {nextSession && (
                      <div className="mt-4 bg-white/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-white/60 font-medium uppercase tracking-wide">Prochain cours</p>
                          <p className="font-semibold text-sm mt-0.5">{nextSession.title}</p>
                          <p className="text-xs text-white/75 mt-0.5">
                            {new Date(nextSession.scheduledAt).toLocaleDateString("fr-FR", {
                              weekday: "long", day: "numeric", month: "long",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <a
                          href={nextSession.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition"
                        >
                          🔗 Rejoindre
                        </a>
                      </div>
                    )}
                  </div>

                  {/* ── Corps ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                    {/* Devoirs */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-sm">✏️</span>
                          Devoirs
                        </h3>
                        {pendingAssignments > 0 && (
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {pendingAssignments} à rendre
                          </span>
                        )}
                      </div>

                      {totalAssignments === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aucun devoir pour ce cours.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {course.assignments.slice(0, 4).map((a) => {
                            const submitted = a.submissions[0];
                            const graded = submitted?.grade;
                            return (
                              <div key={a.id} className="flex items-center justify-between gap-2 py-1">
                                <p className="text-sm text-gray-700 truncate flex-1 font-medium">{a.title}</p>
                                <div className="shrink-0">
                                  {graded ? (
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                                      {graded.score}/20
                                    </span>
                                  ) : submitted ? (
                                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-yellow-200">
                                      Rendu ✓
                                    </span>
                                  ) : (
                                    <span className="bg-red-50 text-red-500 text-xs px-2.5 py-0.5 rounded-full border border-red-100">
                                      {new Date(a.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {totalAssignments > 4 && (
                            <p className="text-xs text-gray-400 mt-1">+{totalAssignments - 4} autre{totalAssignments - 4 > 1 ? "s" : ""}</p>
                          )}
                          <a href="/dashboard/student/assignments"
                            className="text-indigo-600 text-sm font-medium hover:underline block mt-2">
                            Voir tous les devoirs →
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Ressources */}
                    <div className="p-6">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-4">
                        <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📂</span>
                        Ressources
                      </h3>

                      {course.resources.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aucune ressource disponible.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {course.resources.map((r) => (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition group"
                            >
                              <span className={`text-xs px-2 py-1 rounded-lg font-semibold shrink-0 ${RESOURCE_COLORS[r.type]}`}>
                                {RESOURCE_ICONS[r.type]}
                              </span>
                              <span className="text-sm text-gray-700 group-hover:text-indigo-600 truncate transition font-medium">
                                {r.name}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
