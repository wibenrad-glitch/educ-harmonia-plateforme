import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const COLORS = [
  "bg-indigo-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
];

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        include: {
          courses: {
            include: {
              teacher: true,
              sessions: {
                where: { scheduledAt: { gte: new Date() } },
                orderBy: { scheduledAt: "asc" },
                take: 10,
              },
            },
          },
        },
      },
    },
  });

  const courses = enrollments.flatMap((e) => e.class.courses);

  type SessionItem = {
    id: string;
    title: string;
    courseTitle: string;
    teacherName: string;
    zoomLink: string;
    scheduledAt: Date;
    duration: number;
    colorClass: string;
  };

  const sessionsByDay: Record<string, SessionItem[]> = {
    Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [],
  };

  courses.forEach((course, idx) => {
    const colorClass = COLORS[idx % COLORS.length];
    course.sessions.forEach((s) => {
      const date = new Date(s.scheduledAt);
      const dayIndex = date.getDay();
      const dayName = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][dayIndex];
      if (sessionsByDay[dayName]) {
        sessionsByDay[dayName].push({
          id: s.id,
          title: s.title,
          courseTitle: course.title,
          teacherName: course.teacher.name,
          zoomLink: s.zoomLink,
          scheduledAt: date,
          duration: s.duration,
          colorClass,
        });
      }
    });
  });

  Object.values(sessionsByDay).forEach((arr) =>
    arr.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
  );

  const totalSessions = Object.values(sessionsByDay).flat().length;
  const now = new Date();
  const todayName = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][now.getDay()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/student" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour au tableau de bord
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📅</span>
            Mon emploi du temps
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {totalSessions === 0
              ? "Aucune session planifiée pour le moment."
              : `${totalSessions} session${totalSessions > 1 ? "s" : ""} à venir cette semaine`}
          </p>
        </div>

        {totalSessions === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <span className="text-6xl block mb-4">🎉</span>
            <p className="text-gray-600 text-lg font-semibold">Pas de cours planifié</p>
            <p className="text-gray-400 text-sm mt-2">Tes professeurs n&apos;ont pas encore planifié de sessions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const sessions = sessionsByDay[day] ?? [];
              const isToday = day === todayName;
              const hasSessions = sessions.length > 0;

              return (
                <div key={day} className={`rounded-2xl overflow-hidden border-2 transition ${
                  isToday
                    ? "border-indigo-400 shadow-lg shadow-indigo-100"
                    : hasSessions
                    ? "border-gray-200 shadow-sm"
                    : "border-gray-100 opacity-60"
                }`}>

                  {/* ── En-tête du jour ── */}
                  <div className={`px-6 py-4 flex items-center gap-3 ${
                    isToday ? "bg-indigo-600 text-white" : "bg-white border-b border-gray-100"
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isToday ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      {day.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h2 className={`font-bold text-base ${isToday ? "text-white" : "text-gray-800"}`}>
                        {day}
                      </h2>
                      {isToday && (
                        <span className="text-xs text-indigo-200">Aujourd&apos;hui</span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      isToday
                        ? "bg-white/20 text-white"
                        : sessions.length > 0
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-400"
                    }`}>
                      {sessions.length === 0 ? "Pas de cours" : `${sessions.length} cours`}
                    </span>
                  </div>

                  {/* ── Sessions du jour ── */}
                  {sessions.length > 0 && (
                    <div className="bg-white divide-y divide-gray-50">
                      {sessions.map((s) => (
                        <div key={s.id} className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50 transition">

                          {/* Heure */}
                          <div className="text-center shrink-0 w-16 bg-gray-50 rounded-xl py-2">
                            <p className="text-base font-bold text-gray-900">
                              {s.scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-xs text-gray-400">{s.duration} min</p>
                          </div>

                          {/* Trait coloré */}
                          <div className={`w-1.5 h-14 rounded-full shrink-0 ${s.colorClass}`} />

                          {/* Infos cours */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-base truncate">{s.courseTitle}</p>
                            <p className="text-sm text-gray-600 truncate mt-0.5">{s.title}</p>
                            <p className="text-xs text-gray-400 mt-1">👨‍🏫 {s.teacherName}</p>
                          </div>

                          {/* Bouton Zoom */}
                          <a
                            href={s.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                          >
                            🔗 <span className="hidden sm:inline">Rejoindre</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
