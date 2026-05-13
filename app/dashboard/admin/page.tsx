import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [teachers, students, classes, courses, submissions, ungradedSubmissions] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.class.count(),
    prisma.course.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { grade: { is: null } } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "STUDENT"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const upcomingSessions = await prisma.zoomSession.findMany({
    where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
    orderBy: { scheduledAt: "asc" },
    take: 4,
    include: { course: { include: { class: true, teacher: true } } },
  });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const initials = session.user.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-200">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {greeting}, {session.user.name} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              Administration — {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* ── Statistiques principales ── */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-purple-400 rounded" /> Statistiques de la plateforme
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200 hover:shadow-xl transition">
              <span className="text-3xl block mb-2">👨‍🏫</span>
              <p className="text-4xl font-bold">{teachers}</p>
              <p className="text-blue-100 text-sm mt-1">Professeurs</p>
            </div>
            <div className="bg-green-600 rounded-2xl p-5 text-white shadow-lg shadow-green-200 hover:shadow-xl transition">
              <span className="text-3xl block mb-2">👨‍🎓</span>
              <p className="text-4xl font-bold">{students}</p>
              <p className="text-green-100 text-sm mt-1">Élèves</p>
            </div>
            <div className="bg-yellow-500 rounded-2xl p-5 text-white shadow-lg shadow-yellow-200 hover:shadow-xl transition">
              <span className="text-3xl block mb-2">🏫</span>
              <p className="text-4xl font-bold">{classes}</p>
              <p className="text-yellow-100 text-sm mt-1">Classes</p>
            </div>
            <div className="bg-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-200 hover:shadow-xl transition">
              <span className="text-3xl block mb-2">📚</span>
              <p className="text-4xl font-bold">{courses}</p>
              <p className="text-purple-100 text-sm mt-1">Cours</p>
            </div>
          </div>
        </section>

        {/* ── Statistiques secondaires ── */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-indigo-400 rounded" /> Activité des devoirs
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
              <span className="text-5xl">📝</span>
              <div>
                <p className="text-3xl font-bold text-gray-900">{submissions}</p>
                <p className="text-sm text-gray-500 mt-1">Devoirs rendus au total</p>
              </div>
            </div>
            <div className={`rounded-2xl p-6 shadow-sm border flex items-center gap-5 hover:shadow-md transition ${ungradedSubmissions > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"}`}>
              <span className="text-5xl">✏️</span>
              <div>
                <p className={`text-3xl font-bold ${ungradedSubmissions > 0 ? "text-orange-600" : "text-gray-900"}`}>
                  {ungradedSubmissions}
                </p>
                <p className="text-sm text-gray-500 mt-1">Devoirs en attente de correction</p>
                {ungradedSubmissions > 0 && (
                  <p className="text-xs text-orange-400 mt-1">⚠️ À traiter</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Prochains cours + Derniers comptes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* Prochains cours Zoom */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-base">🎥</span>
              Prochains cours Zoom
            </h2>
            {upcomingSessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Aucun cours planifié prochainement.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((s) => {
                  const date = new Date(s.scheduledAt);
                  const isToday = date.toDateString() === now.toDateString();
                  return (
                    <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                      <div className={`text-center px-3 py-2.5 rounded-xl shrink-0 min-w-[64px] ${isToday ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}>
                        <p className="text-xs font-bold capitalize">
                          {isToday ? "Auj." : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                          {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{s.course.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.course.class.name} · {s.course.teacher.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Derniers comptes créés */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-base">🆕</span>
              Derniers comptes créés
            </h2>
            {recentUsers.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Aucun utilisateur créé.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => {
                  const ini = u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${u.role === "TEACHER" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {ini}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${u.role === "TEACHER" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {u.role === "TEACHER" ? "Professeur" : "Élève"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Modules de gestion ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center text-base">⚙️</span>
            Gestion de la plateforme
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/dashboard/admin/users"
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">👥</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Utilisateurs</p>
                <p className="text-sm text-gray-400 mt-0.5">Profs & élèves</p>
              </div>
            </a>
            <a href="/dashboard/admin/classes"
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-yellow-300 transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">🏫</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Classes</p>
                <p className="text-sm text-gray-400 mt-0.5">Maternelle & primaire</p>
              </div>
            </a>
            <a href="/dashboard/admin/courses"
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-300 transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">📚</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Cours</p>
                <p className="text-sm text-gray-400 mt-0.5">Assigner & gérer</p>
              </div>
            </a>
            <a href="/dashboard/admin/messages"
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-300 transition flex flex-col items-center text-center gap-3">
              <span className="text-5xl group-hover:scale-110 transition-transform">💬</span>
              <div>
                <p className="font-bold text-gray-900 text-base">Messagerie</p>
                <p className="text-sm text-gray-400 mt-0.5">Contacter tous</p>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
