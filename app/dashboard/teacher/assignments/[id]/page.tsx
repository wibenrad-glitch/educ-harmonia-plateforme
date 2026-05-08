import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";

async function gradeSubmission(formData: FormData) {
  "use server";
  const submissionId = formData.get("submissionId") as string;
  const scoreRaw = formData.get("score") as string;
  const score = parseFloat(scoreRaw);
  const feedback = formData.get("feedback") as string;
  const gradedById = formData.get("gradedById") as string;

  if (!scoreRaw || isNaN(score) || score < 0 || score > 20) return;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { course: true } } },
  });

  await prisma.grade.upsert({
    where: { submissionId },
    update: { score, feedback },
    create: { submissionId, score, feedback, gradedById },
  });

  if (submission) {
    await notify(
      submission.studentId,
      "Devoir corrigé ✅",
      `Ton devoir "${submission.assignment.title}" a été noté : ${score}/20${feedback ? ` — ${feedback}` : ""}`
    );
  }

  revalidatePath(`/dashboard/teacher/assignments/${submission?.assignmentId}`);
}

function getScoreColor(score: number) {
  if (score >= 16) return "bg-green-100 text-green-700 border-green-300";
  if (score >= 12) return "bg-blue-100 text-blue-700 border-blue-300";
  if (score >= 8) return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-red-100 text-red-700 border-red-300";
}

export default async function AssignmentSubmissions({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: true,
      submissions: {
        include: { student: true, grade: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment || assignment.course.teacherId !== session.user.id) notFound();

  const graded = assignment.submissions.filter((s) => s.grade).length;
  const pending = assignment.submissions.filter((s) => !s.grade).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href={`/dashboard/teacher/courses/${assignment.courseId}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour au cours
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">✏️</span>
            Correction — {assignment.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {assignment.course.title} · À rendre avant le {new Date(assignment.dueDate).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-900">{assignment.submissions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Rendus</p>
          </div>
          <div className={`rounded-2xl p-5 shadow-sm border-2 text-center ${pending > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"}`}>
            <p className={`text-3xl font-bold ${pending > 0 ? "text-orange-600" : "text-gray-900"}`}>{pending}</p>
            <p className="text-sm text-gray-600 mt-1">À corriger</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-5 shadow-sm border-2 border-green-100 text-center">
            <p className="text-3xl font-bold text-green-600">{graded}</p>
            <p className="text-sm text-gray-600 mt-1">Corrigés ✓</p>
          </div>
        </div>

        {/* ── Liste des rendus ── */}
        {assignment.submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <span className="text-6xl block mb-4">📭</span>
            <p className="text-gray-600 text-lg font-semibold">Aucun élève n&apos;a encore rendu ce devoir.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {assignment.submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden hover:shadow-md transition">

                {/* En-tête élève */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {sub.student.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">{sub.student.name}</p>
                      <p className="text-xs text-gray-400">
                        Rendu le {new Date(sub.submittedAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {sub.grade && (
                    <div className={`border-2 rounded-xl px-4 py-2 text-center ${getScoreColor(sub.grade.score)}`}>
                      <p className="text-2xl font-bold leading-none">{sub.grade.score}</p>
                      <p className="text-xs mt-0.5">/20</p>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Réponse texte */}
                  {sub.content && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Réponse de l&apos;élève</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{sub.content}</p>
                    </div>
                  )}

                  {/* Fichier joint */}
                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 transition mb-4">
                      📎 Télécharger le fichier joint
                    </a>
                  )}

                  {!sub.content && !sub.fileUrl && (
                    <p className="text-sm text-gray-400 italic mb-4">Aucun contenu soumis.</p>
                  )}

                  {/* Feedback existant */}
                  {sub.grade?.feedback && (
                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Ton commentaire</p>
                      <p className="text-sm text-gray-700 italic">&ldquo;{sub.grade.feedback}&rdquo;</p>
                    </div>
                  )}

                  {/* Formulaire notation */}
                  <form action={gradeSubmission} className="flex flex-col sm:flex-row gap-3 items-end pt-4 border-t border-gray-100">
                    <input type="hidden" name="submissionId" value={sub.id} />
                    <input type="hidden" name="gradedById" value={session.user.id} />
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Note /20</label>
                      <input
                        name="score" type="number" min="0" max="20" step="0.5"
                        defaultValue={sub.grade?.score ?? ""}
                        placeholder="Ex : 15"
                        className="w-28 border-2 border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Commentaire (optionnel)</label>
                      <input
                        name="feedback"
                        placeholder="Ex : Bon travail, attention aux calculs..."
                        defaultValue={sub.grade?.feedback ?? ""}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>
                    <button type="submit"
                      className="shrink-0 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                      {sub.grade ? "Modifier la note" : "✓ Noter"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
