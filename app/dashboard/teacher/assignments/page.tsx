import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TeacherAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const assignments = await prisma.assignment.findMany({
    where: { course: { teacherId: session.user.id } },
    include: {
      course: { include: { class: true } },
      submissions: {
        include: { student: true, grade: true },
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalRendus = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
  const totalACorreger = assignments.reduce(
    (sum, a) => sum + a.submissions.filter((s) => !s.grade).length, 0
  );
  const totalCorrigés = totalRendus - totalACorreger;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/teacher" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour au tableau de bord
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">✏️</span>
            Devoirs à corriger
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">{assignments.length} devoir{assignments.length > 1 ? "s" : ""} au total</p>
        </div>

        {/* ── Statistiques ── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-orange-400 rounded" /> Vue d&apos;ensemble
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-4xl font-bold text-gray-900">{totalRendus}</p>
              <p className="text-sm text-gray-500 mt-2">Rendus au total</p>
            </div>
            <div className={`rounded-2xl p-5 shadow-sm border text-center ${totalACorreger > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"}`}>
              <p className={`text-4xl font-bold ${totalACorreger > 0 ? "text-orange-600" : "text-gray-900"}`}>
                {totalACorreger}
              </p>
              <p className="text-sm text-gray-500 mt-2">À corriger</p>
              {totalACorreger > 0 && (
                <p className="text-xs text-orange-400 mt-1">⚠️ En attente</p>
              )}
            </div>
            <div className="bg-green-50 rounded-2xl p-5 shadow-sm border border-green-100 text-center">
              <p className="text-4xl font-bold text-green-600">{totalCorrigés}</p>
              <p className="text-sm text-gray-500 mt-2">Corrigés ✓</p>
            </div>
          </div>
        </section>

        {/* ── Liste devoirs ── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-blue-400 rounded" /> Détail par devoir
          </h2>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <span className="text-6xl block mb-4">📋</span>
              <p className="text-gray-600 text-lg font-semibold">Aucun devoir créé</p>
              <p className="text-gray-400 text-sm mt-2">Créez des devoirs depuis la page de vos cours.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((a) => {
                const pending = a.submissions.filter((s) => !s.grade);
                const graded = a.submissions.filter((s) => s.grade);
                const isOverdue = new Date(a.dueDate) < new Date();

                return (
                  <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">

                    {/* En-tête du devoir */}
                    <div className={`px-6 py-4 border-b ${isOverdue ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-gray-900 text-base">{a.title}</h2>
                          <p className="text-sm text-gray-600 mt-0.5 font-medium">
                            {a.course.title} — {a.course.class.name}
                          </p>
                          {a.description && (
                            <p className="text-sm text-gray-400 mt-1 italic">{a.description}</p>
                          )}
                        </div>
                        <div className={`shrink-0 text-right text-sm font-semibold ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                          {isOverdue ? "⚠️ Date dépassée" : "📅"}
                          <p className="text-xs font-normal mt-0.5">
                            Limite : {new Date(a.dueDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Corps */}
                    <div className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pending.length > 0 && (
                          <span className="bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1 rounded-full">
                            {pending.length} à corriger
                          </span>
                        )}
                        {graded.length > 0 && (
                          <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                            {graded.length} corrigé{graded.length > 1 ? "s" : ""} ✓
                          </span>
                        )}
                        {a.submissions.length === 0 && (
                          <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
                            Aucun rendu
                          </span>
                        )}
                      </div>

                      {/* Aperçu des élèves */}
                      {a.submissions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {a.submissions.map((sub) => (
                            <div key={sub.id} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${sub.grade ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                              <span>{sub.grade ? "✅" : "⏳"}</span>
                              <span>{sub.student.name}</span>
                              {sub.grade && <span className="font-bold">{sub.grade.score}/20</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bouton corriger */}
                      {a.submissions.length > 0 && (
                        <a
                          href={`/dashboard/teacher/assignments/${a.id}`}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                        >
                          Voir les rendus ({a.submissions.length}) →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
