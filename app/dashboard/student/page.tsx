import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NotificationBanner from "./NotificationBanner";

export default async function StudentDashboard() {
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
              sessions: {
                where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
                orderBy: { scheduledAt: "asc" },
                take: 1,
              },
              assignments: {
                include: {
                  submissions: { where: { studentId: session.user.id } },
                },
              },
            },
          },
        },
      },
    },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const courses = enrollments.flatMap((e) =>
    e.class.courses.map((c) => ({ ...c, className: e.class.name, levelName: e.class.level.name }))
  );

  const nextSessions = courses
    .flatMap((c) => c.sessions.map((s) => ({ ...s, courseTitle: c.title })))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const totalAssignments = courses.flatMap((c) => c.assignments).length;
  const submittedAssignments = courses
    .flatMap((c) => c.assignments)
    .filter((a) => a.submissions.length > 0).length;
  const pendingAssignments = totalAssignments - submittedAssignments;

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;
  const initials = session.user.name
    ?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header personnalisé ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-200">
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

        {/* ── Bannière notifications ── */}
        <NotificationBanner notifications={notifications} />

        {/* ── Statistiques rapides ── */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-indigo-400 rounded" /> Vue d&apos;ensemble
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <span className="text-3xl block mb-2">📚</span>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500 mt-1">Cours</p>
            </div>
            <div className={`rounded-2xl p-5 shadow-sm border text-center hover:shadow-md transition ${pendingAssignments > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"}`}>
              <span className="text-3xl block mb-2">📝</span>
              <p className={`text-3xl font-bold ${pendingAssignments > 0 ? "text-orange-600" : "text-gray-900"}`}>
                {pendingAssignments}
              </p>
              <p className="text-sm text-gray-500 mt-1">Devoirs à rendre</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <span className="text-3xl block mb-2">✅</span>
              <p className="text-3xl font-bold text-green-600">{submittedAssignments}</p>
              <p className="text-sm text-gray-500 mt-1">Devoirs rendus</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <span className="text-3xl block mb-2">🎥</span>
              <p className="text-3xl font-bold text-indigo-600">{nextSessions.length}</p>
              <p className="text-sm text-gray-500 mt-1">Cours à venir</p>
            </div>
          </div>
        </section>

        {/* ── Prochains cours Zoom ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
              <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-base">🎥</span>
              Prochains cours Zoom
            </h2>
            <a href="/dashboard/student/schedule" className="text-sm text-indigo-600 font-medium hover:underline">
              Voir l&apos;emploi du temps →
            </a>
          </div>

          {nextSessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <span className="text-5xl block mb-3">📅</span>
              <p className="text-gray-500 font-medium">Aucun cours planifié pour le moment.</p>
              <p className="text-gray-400 text-sm mt-1">Tes professeurs vont bientôt ajouter des sessions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nextSessions.map((s) => {
                const date = new Date(s.scheduledAt);
                const isToday = date.toDateString() === now.toDateString();
                const isTomorrow =
                  date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                const dayLabel = isToday
                  ? "Aujourd'hui"
                  : isTomorrow
                  ? "Demain"
                  : date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });

                return (
                  <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                    <div className={`px-5 py-3 ${isToday ? "bg-red-500" : "bg-indigo-500"}`}>
                      <p className="text-white font-semibold text-sm capitalize">{dayLabel}</p>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-1">{s.courseTitle}</h3>
                      <p className="text-base text-gray-600 mb-4 font-medium">
                        🕐 {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <a
                        href={s.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        🔗 Rejoindre le cours
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Mon espace — Navigation ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-base">🗂️</span>
            Mon espace
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            <a href="/dashboard/student/courses"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-indigo-100 hover:border-indigo-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">📖</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Mes cours</p>
                <p className="text-sm text-gray-600 mt-0.5">Ressources & leçons</p>
              </div>
            </a>

            <a href="/dashboard/student/assignments"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-orange-100 hover:border-orange-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">✏️</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Mes devoirs</p>
                <p className="text-sm text-gray-600 mt-0.5">Rendre & voir les notes</p>
              </div>
              {pendingAssignments > 0 && (
                <span className="bg-orange-100 text-orange-600 text-sm font-bold px-3 py-0.5 rounded-full">
                  {pendingAssignments} à rendre
                </span>
              )}
            </a>

            <a href="/dashboard/student/schedule"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-blue-100 hover:border-blue-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">📅</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Emploi du temps</p>
                <p className="text-sm text-gray-600 mt-0.5">Mes cours de la semaine</p>
              </div>
            </a>

            <a href="/dashboard/student/grades"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-green-100 hover:border-green-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">🏆</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Mes notes</p>
                <p className="text-sm text-gray-600 mt-0.5">Bulletin & résultats</p>
              </div>
            </a>

            <a href="/dashboard/student/messages"
              className="group bg-white rounded-2xl p-6 shadow-md border-2 border-purple-100 hover:border-purple-400 hover:shadow-lg transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">💬</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Messagerie</p>
                <p className="text-sm text-gray-600 mt-0.5">Contacter mes profs</p>
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
