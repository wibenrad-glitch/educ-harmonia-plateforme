import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function createCourse(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const teacherId = formData.get("teacherId") as string;
  const classId = formData.get("classId") as string;
  await prisma.course.create({ data: { title, description, teacherId, classId } });
  revalidatePath("/dashboard/admin/courses");
}

async function deleteCourse(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.course.delete({ where: { id } });
  revalidatePath("/dashboard/admin/courses");
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [courses, teachers, classes] = await Promise.all([
    prisma.course.findMany({
      include: {
        teacher: true,
        class: { include: { level: true } },
        assignments: true,
        sessions: { where: { scheduledAt: { gte: new Date() } }, take: 1, orderBy: { scheduledAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ include: { level: true }, orderBy: { name: "asc" } }),
  ]);

  const maternelleClasses = classes.filter((c) => c.level.name === "Maternelle");
  const primaireClasses = classes.filter((c) => c.level.name === "Primaire");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/admin" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📚</span>
            Gestion des cours
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {courses.length} cours créé{courses.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Formulaire création ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
          <h2 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-base">➕</span>
            Créer un cours
          </h2>
          <p className="text-sm text-gray-400 mb-5">Assignez un cours à un professeur et une classe.</p>
          <form action={createCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Titre du cours</label>
              <input name="title" required placeholder="Ex : Mathématiques CP"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Description</label>
              <input name="description" placeholder="Optionnel"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Professeur</label>
              <select name="teacherId" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition">
                <option value="">-- Choisir un professeur --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Classe</label>
              <select name="classId" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition">
                <option value="">-- Choisir une classe --</option>
                {maternelleClasses.length > 0 && (
                  <optgroup label="🌱 Maternelle">
                    {maternelleClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
                {primaireClasses.length > 0 && (
                  <optgroup label="📖 Primaire">
                    {primaireClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit"
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition">
                Créer le cours
              </button>
            </div>
          </form>
        </section>

        {/* ── Liste des cours ── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-purple-400 rounded" /> Cours existants ({courses.length})
          </h2>

          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <span className="text-6xl block mb-4">📚</span>
              <p className="text-gray-500 text-lg font-semibold">Aucun cours créé</p>
              <p className="text-gray-400 text-sm mt-1">Utilisez le formulaire ci-dessus pour en créer un.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const nextSession = course.sessions[0];
                const isMaternelle = course.class.level.name === "Maternelle";
                return (
                  <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4 hover:shadow-md transition">

                    {/* Badge niveau */}
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      isMaternelle ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {isMaternelle ? "🌱" : "📖"}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-base">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
                        <span>👨‍🏫 {course.teacher.name}</span>
                        <span className="text-gray-300">·</span>
                        <span>🏫 {course.class.level.name} — {course.class.name}</span>
                        <span className="text-gray-300">·</span>
                        <span>📝 {course.assignments.length} devoir{course.assignments.length > 1 ? "s" : ""}</span>
                      </div>
                      {nextSession && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">
                          🎥 Prochain cours : {new Date(nextSession.scheduledAt).toLocaleDateString("fr-FR", {
                            weekday: "short", day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Supprimer */}
                    <form action={deleteCourse} className="shrink-0">
                      <input type="hidden" name="id" value={course.id} />
                      <button type="submit"
                        className="text-red-400 hover:text-red-600 text-sm font-semibold transition px-3 py-1.5 rounded-lg hover:bg-red-50">
                        Supprimer
                      </button>
                    </form>
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
