import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function assignTeacher(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const classId = formData.get("classId") as string;
  const teacherId = formData.get("teacherId") as string;
  if (!classId || !teacherId) throw new Error("Données manquantes");

  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER") throw new Error("Professeur invalide");

  await prisma.teacherClass.upsert({
    where: { teacherId_classId: { teacherId, classId } },
    update: {},
    create: { teacherId, classId },
  });
  revalidatePath("/dashboard/admin/classes");
}

async function enrollStudent(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const classId = formData.get("classId") as string;
  const studentId = formData.get("studentId") as string;
  if (!classId || !studentId) throw new Error("Données manquantes");

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") throw new Error("Élève invalide");

  await prisma.enrollment.upsert({
    where: { studentId_classId: { studentId, classId } },
    update: {},
    create: { studentId, classId },
  });
  revalidatePath("/dashboard/admin/classes");
}

async function removeEnrollment(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const studentId = formData.get("studentId") as string;
  const classId = formData.get("classId") as string;
  if (!studentId || !classId) throw new Error("Données manquantes");

  await prisma.enrollment.delete({
    where: { studentId_classId: { studentId, classId } },
  });
  revalidatePath("/dashboard/admin/classes");
}

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [classes, teachers, students] = await Promise.all([
    prisma.class.findMany({
      include: {
        level: true,
        enrollments: { include: { student: true } },
        teacherClasses: { include: { teacher: true } },
        courses: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { name: "asc" } }),
  ]);

  const maternelle = classes.filter((c) => c.level.name === "Maternelle");
  const primaire = classes.filter((c) => c.level.name === "Primaire");

  const levelSections = [
    { label: "Maternelle", emoji: "🌱", items: maternelle, gradient: "from-pink-500 to-rose-500", badge: "bg-pink-100 text-pink-700" },
    { label: "Primaire", emoji: "📖", items: primaire, gradient: "from-blue-500 to-indigo-500", badge: "bg-blue-100 text-blue-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/admin" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">🏫</span>
            Gestion des classes
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {classes.length} classe{classes.length > 1 ? "s" : ""} · {students.length} élève{students.length > 1 ? "s" : ""} · {teachers.length} professeur{teachers.length > 1 ? "s" : ""}
          </p>
        </div>

        {levelSections.map(({ label, emoji, items, gradient, badge }) => (
          <section key={label} className="mb-12">

            {/* ── En-tête de niveau ── */}
            <div className={`bg-gradient-to-r ${gradient} rounded-2xl px-6 py-5 text-white mb-6 flex items-center gap-4`}>
              <span className="text-3xl">{emoji}</span>
              <div>
                <h2 className="text-xl font-bold">{label}</h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {items.length} classe{items.length > 1 ? "s" : ""} ·{" "}
                  {items.reduce((s, c) => s + c.enrollments.length, 0)} élève{items.reduce((s, c) => s + c.enrollments.length, 0) > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Aucune classe dans ce niveau.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {items.map((cls) => {
                  const currentTeacher = cls.teacherClasses[0]?.teacher;
                  const enrolled = cls.enrollments.map((e) => e.student);
                  const notEnrolled = students.filter((s) => !enrolled.some((e) => e.id === s.id));

                  return (
                    <div key={cls.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                      {/* En-tête de la classe */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Année {cls.year} · {cls.courses.length} cours
                          </p>
                        </div>
                        <div className={`${badge} rounded-xl px-4 py-2 text-center`}>
                          <p className="text-2xl font-bold">{enrolled.length}</p>
                          <p className="text-xs">élève{enrolled.length > 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Professeur principal */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-xs">👨‍🏫</span>
                            Professeur principal
                          </p>
                          {currentTeacher && (
                            <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5 mb-3 border border-blue-100">
                              <span className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                                {currentTeacher.name[0]}
                              </span>
                              <span className="text-sm font-semibold text-blue-800">{currentTeacher.name}</span>
                            </div>
                          )}
                          <form action={assignTeacher} className="flex gap-2">
                            <input type="hidden" name="classId" value={cls.id} />
                            <select name="teacherId"
                              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                              <option value="">-- Choisir --</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id} selected={currentTeacher?.id === t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <button type="submit"
                              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition">
                              OK
                            </button>
                          </form>
                        </div>

                        {/* Inscrire un élève */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-green-100 rounded flex items-center justify-center text-xs">👨‍🎓</span>
                            Inscrire un élève
                          </p>
                          {notEnrolled.length === 0 ? (
                            <p className="text-sm text-gray-400 italic bg-gray-50 px-3 py-2.5 rounded-xl">
                              ✅ Tous les élèves sont inscrits.
                            </p>
                          ) : (
                            <form action={enrollStudent} className="flex gap-2">
                              <input type="hidden" name="classId" value={cls.id} />
                              <select name="studentId"
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">-- Choisir --</option>
                                {notEnrolled.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                              <button type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition">
                                Inscrire
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Liste des élèves inscrits */}
                      {enrolled.length > 0 && (
                        <div className="px-6 pb-6 border-t border-gray-50 pt-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                            Élèves inscrits ({enrolled.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {enrolled.map((student) => (
                              <div key={student.id} className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 px-3 py-1.5 rounded-xl text-sm">
                                <span className="w-5 h-5 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-xs font-bold">
                                  {student.name[0]}
                                </span>
                                <span className="font-semibold">{student.name}</span>
                                <form action={removeEnrollment}>
                                  <input type="hidden" name="studentId" value={student.id} />
                                  <input type="hidden" name="classId" value={cls.id} />
                                  <button type="submit" className="text-green-400 hover:text-red-500 ml-1 font-bold leading-none transition text-base">
                                    ×
                                  </button>
                                </form>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}

      </div>
    </div>
  );
}
