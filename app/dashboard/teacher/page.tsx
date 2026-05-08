import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TeacherDashboard() {
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
        include: {
          submissions: { include: { grade: true } },
        },
      },
    },
  });

  const totalStudents = new Set(
    courses.flatMap((c) => c.class.enrollments.map((e) => e.studentId))
  ).size;

  const totalSubmissions = courses.flatMap((c) =>
    c.assignments.flatMap((a) => a.submissions)
  ).length;

  const ungradedSubmissions = courses.flatMap((c) =>
    c.assignments.flatMap((a) => a.submissions.filter((s) => !s.grade))
  ).length;

  const nextSessions = courses
    .flatMap((c) => c.sessions.map((s) => ({ ...s, courseTitle: c.title, className: c.class.name })))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;
  const initials = session.user.name
    ?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-200">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {greeting}, {firstName} ! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* ── Vue d'ensemble ── */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-blue-400 rounded" /> Vue d&apos;ensemble
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <span className="text-3xl block mb-2">📚</span>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500 mt-1">Cours</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <span className="text-3xl block mb-2">👨‍🎓</span>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-sm text-gray-500 mt-1">Élèves</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <span className="text-3xl block mb-2">📝</span>
              <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
              <p className="text-sm text-gray-500 mt-1">Rendus</p>
            </div>
            <div className={`rounded-2xl p-5 shadow-sm border text-center hover:shadow-md transition ${ungradedSubmissions > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"}`}>
              <span className="text-3xl block mb-2">✏️</span>
              <p className={`text-3xl font-bold ${ungradedSubmissions > 0 ? "text-orange-600" : "text-gray-900"}`}>
                {ungradedSubmissions}
              </p>
              <p className="text-sm text-gray-500 mt-1">À corriger</p>
            </div>
          </div>
        </section>

        {/* ── Prochains cours Zoom ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-base">🎥</span>
            Prochains cours Zoom
          </h2>
          {nextSessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <span className="text-5xl block mb-3">📅</span>
              <p className="text-gray-500 font-medium">Aucun cours planifié prochainement.</p>
              <p className="text-gray-400 text-sm mt-1">Planifiez des sessions depuis la page de vos cours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nextSessions.map((s) => {
                const date = new Date(s.scheduledAt);
                const isToday = date.toDateString() === now.toDateString();
                return (
                  <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                    <div className={`px-5 py-3 ${isToday ? "bg-red-500" : "bg-blue-500"}`}>
                      <p className="text-white font-semibold text-sm capitalize">
                        {isToday ? "Aujourd'hui" : date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="p-5">
                      <p className="font-bold text-gray-900 text-base">{s.courseTitle}</p>
                      <p className="text-sm text-gray-500 mt-0.5">Classe : {s.className}</p>
                      <p className="text-base text-gray-600 mt-2 font-medium">
                        🕐 {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <a href={s.zoomLink} target="_blank" rel="noopener noreferrer"
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                        🔗 Lancer le cours
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Mes cours ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-base">📖</span>
            Mes cours
          </h2>
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
              <span className="text-5xl block mb-3">📚</span>
              <p className="text-gray-500 font-medium">Aucun cours assigné pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => {
                const pending = course.assignments.flatMap((a) =>
                  a.submissions.filter((s) => !s.grade)
                ).length;
                const totalEleves = course.class.enrollments.length;

                return (
                  <a key={course.id} href={`/dashboard/teacher/courses/${course.id}`}
                    className="group bg-white rounded-2xl shadow-md border-2 border-blue-100 hover:border-blue-400 hover:shadow-lg transition overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 text-white">
                      <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                      <p className="text-blue-100 text-sm mt-0.5">
                        {course.class.level.name} — {course.class.name}
                      </p>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex gap-5 text-sm text-gray-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-green-100 rounded-md flex items-center justify-center text-xs">👨‍🎓</span>
                          {totalEleves} élève{totalEleves > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center text-xs">📝</span>
                          {course.assignments.length} devoir{course.assignments.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      {pending > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                          {pending} à corriger
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Actions rapides ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-base">⚡</span>
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <a href="/dashboard/teacher/assignments"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-orange-100 hover:border-orange-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">✏️</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Devoirs à corriger</p>
                <p className="text-sm text-gray-600 mt-0.5">Noter les rendus des élèves</p>
              </div>
              {ungradedSubmissions > 0 && (
                <span className="bg-orange-100 text-orange-700 text-sm font-bold px-3 py-0.5 rounded-full">
                  {ungradedSubmissions} en attente
                </span>
              )}
            </a>

            <a href="/dashboard/teacher/messages"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-purple-100 hover:border-purple-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">💬</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Messagerie</p>
                <p className="text-sm text-gray-600 mt-0.5">Contacter mes élèves</p>
              </div>
            </a>

            <a href="/dashboard/profile"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">👤</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Mon profil</p>
                <p className="text-sm text-gray-600 mt-0.5">Mes informations</p>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
