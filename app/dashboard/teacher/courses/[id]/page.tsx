import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import ResourceUpload from "./ResourceUpload";
import { notifyMany } from "@/lib/notify";
async function createSession(formData: FormData) {
  "use server";
  const courseId = formData.get("courseId") as string;
  const title = formData.get("title") as string;
  const zoomLink = formData.get("zoomLink") as string;
  const scheduledAt = new Date(formData.get("scheduledAt") as string);
  const duration = parseInt(formData.get("duration") as string);

  await prisma.zoomSession.create({
    data: { courseId, title, zoomLink, scheduledAt, duration },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { class: { include: { enrollments: true } } },
  });
  if (course) {
    const studentIds = course.class.enrollments.map((e) => e.studentId);
    const date = scheduledAt.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit",
    });
    await notifyMany(studentIds, "Nouveau cours Zoom 🎥", `${course.title} — "${title}" le ${date}`);
  }
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

async function deleteSessionAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const courseId = formData.get("courseId") as string;
  await prisma.zoomSession.delete({ where: { id } });
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

async function createAssignment(formData: FormData) {
  "use server";
  const courseId = formData.get("courseId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = new Date(formData.get("dueDate") as string);

  await prisma.assignment.create({
    data: { courseId, title, description, dueDate },
  });
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

async function addLinkResource(formData: FormData) {
  "use server";
  const courseId = formData.get("courseId") as string;
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;

  await prisma.resource.create({
    data: { courseId, name, type: "LINK", url },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { class: { include: { enrollments: true } } },
  });
  if (course) {
    const studentIds = course.class.enrollments.map((e) => e.studentId);
    await notifyMany(studentIds, "Nouvelle ressource", `"${name}" a été ajouté dans ${course.title}`);
  }
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

async function deleteResource(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const courseId = formData.get("courseId") as string;
  await prisma.resource.delete({ where: { id } });
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}


export default async function TeacherCourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      class: { include: { level: true, enrollments: { include: { student: true } } } },
      sessions: { orderBy: { scheduledAt: "asc" } },
      assignments: {
        orderBy: { dueDate: "asc" },
        include: { submissions: { include: { grade: true } } },
      },
      resources: { orderBy: { id: "asc" } },
    },
  });

  if (!course || course.teacherId !== session.user.id) notFound();

  const students = course.class.enrollments.map((e) => e.student);
  const ungradedCount = course.assignments.flatMap((a) =>
    a.submissions.filter((s) => !s.grade)
  ).length;

  const RESOURCE_ICONS: Record<string, string> = { PDF: "📄", IMAGE: "🖼️", LINK: "🔗" };
  const RESOURCE_COLORS: Record<string, string> = {
    PDF: "bg-red-100 text-red-600",
    IMAGE: "bg-blue-100 text-blue-600",
    LINK: "bg-purple-100 text-purple-600",
  };
  const STATUS_STYLES: Record<string, string> = {
    LIVE: "bg-red-100 text-red-600",
    DONE: "bg-gray-100 text-gray-500",
    SCHEDULED: "bg-green-100 text-green-600",
    CANCELLED: "bg-gray-100 text-gray-400",
  };
  const STATUS_LABELS: Record<string, string> = {
    LIVE: "En cours",
    DONE: "Terminé",
    SCHEDULED: "Planifié",
    CANCELLED: "Annulé",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">

        {/* Header */}
        <div className="mb-8">
          <a href="/dashboard/teacher" className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← Retour
          </a>
          <div className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-6 py-5 text-white">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-blue-100 text-sm mt-1">
              {course.class.level.name} — {course.class.name} · {students.length} élève{students.length > 1 ? "s" : ""}
            </p>
            {ungradedCount > 0 && (
              <span className="mt-3 inline-block bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✏️ {ungradedCount} devoir{ungradedCount > 1 ? "s" : ""} à corriger
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── SESSIONS ZOOM ── */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">🎥</span>
              Sessions Zoom
            </h2>

            {/* Formulaire planifier */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-1">Planifier une session</h3>
              <p className="text-xs text-gray-400 mb-4">Créez une réunion sur zoom.us puis collez le lien ci-dessous.</p>
              <form action={createSession} className="space-y-3">
                <input type="hidden" name="courseId" value={course.id} />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titre de la session</label>
                  <input name="title" required placeholder="Ex : Leçon 3 — Les fractions"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lien Zoom</label>
                  <input name="zoomLink" required placeholder="https://zoom.us/j/..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date et heure</label>
                  <input name="scheduledAt" type="datetime-local" required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Durée (minutes)</label>
                    <input name="duration" type="number" required defaultValue={60} min={15} max={300}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                  </div>
                  <div className="flex items-end">
                    <button type="submit"
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition whitespace-nowrap">
                      🎥 Planifier
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Liste sessions */}
            <div className="space-y-3">
              {course.sessions.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">Aucune session planifiée.</p>
                </div>
              ) : course.sessions.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2 flex items-center justify-between bg-gray-50 border-b border-gray-100">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                    <p className="text-xs text-gray-400">{s.duration} min</p>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                    <p className="text-sm text-gray-500 mb-3 capitalize">
                      {new Date(s.scheduledAt).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "numeric", month: "long",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={s.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                      >
                        🚀 Lancer le cours
                      </a>
                      <form action={deleteSessionAction} className="ml-auto">
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="courseId" value={course.id} />
                        <button type="submit" className="text-red-400 hover:text-red-600 text-xs font-medium transition px-2 py-1 rounded-lg hover:bg-red-50">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── DEVOIRS ── */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>✏️</span> Devoirs
            </h2>

            {/* Formulaire créer devoir */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-700 mb-4">Créer un devoir</h3>
              <form action={createAssignment} className="space-y-3">
                <input type="hidden" name="courseId" value={course.id} />
                <input name="title" required placeholder="Titre du devoir"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                <textarea name="description" placeholder="Instructions (optionnel)" rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none" />
                <div className="flex gap-3">
                  <input name="dueDate" type="date" required
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                  <button type="submit"
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap">
                    Créer
                  </button>
                </div>
              </form>
            </div>

            {/* Liste devoirs */}
            <div className="space-y-3">
              {course.assignments.length === 0 && (
                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">Aucun devoir créé.</p>
                </div>
              )}
              {course.assignments.map((a) => {
                const pending = a.submissions.filter((s) => !s.grade).length;
                const graded = a.submissions.filter((s) => s.grade).length;
                return (
                  <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{a.title}</p>
                        {a.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{a.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          À rendre avant le {new Date(a.dueDate).toLocaleDateString("fr-FR")}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {pending > 0 && (
                            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
                              {pending} à corriger
                            </span>
                          )}
                          {graded > 0 && (
                            <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">
                              {graded} corrigé{graded > 1 ? "s" : ""}
                            </span>
                          )}
                          {a.submissions.length === 0 && (
                            <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                              Aucun rendu
                            </span>
                          )}
                        </div>
                      </div>
                      {a.submissions.length > 0 && (
                        <a href={`/dashboard/teacher/assignments/${a.id}`}
                          className="shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition">
                          Voir les rendus →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RESSOURCES ── */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📂</span> Ressources du cours
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Ajouter un lien */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Ajouter un lien</h3>
              <form action={addLinkResource} className="space-y-3">
                <input type="hidden" name="courseId" value={course.id} />
                <input name="name" required placeholder="Nom (ex: Vidéo YouTube — Les fractions)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                <input name="url" required placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                <button type="submit"
                  className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
                  Ajouter le lien
                </button>
              </form>
            </div>

            {/* Upload fichier */}
            <ResourceUpload courseId={course.id} />
          </div>

          {/* Liste ressources */}
          {course.resources.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {course.resources.map((r) => (
                  <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${RESOURCE_COLORS[r.type]}`}>
                      {RESOURCE_ICONS[r.type]} {r.type}
                    </span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-sm text-gray-800 hover:text-blue-600 truncate transition">
                      {r.name}
                    </a>
                    <form action={deleteResource}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="courseId" value={course.id} />
                      <button type="submit" className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0">
                        Supprimer
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.resources.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Aucune ressource ajoutée pour ce cours.</p>
            </div>
          )}
        </div>

        {/* ── ÉLÈVES DE LA CLASSE ── */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👨‍🎓</span> Élèves de la classe ({students.length})
          </h2>
          {students.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Aucun élève inscrit dans cette classe.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
              {students.map((s) => {
                const initials = s.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">{s.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
