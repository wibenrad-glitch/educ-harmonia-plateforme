import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function createUser(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (role !== "TEACHER" && role !== "STUDENT") throw new Error("Rôle invalide");
  if (!name?.trim() || !email?.trim() || !password) throw new Error("Données manquantes");

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name: name.trim(), email: email.trim(), password: hashed, role: role as "TEACHER" | "STUDENT" } });
  revalidatePath("/dashboard/admin/users");
}

async function resetPassword(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const id = formData.get("id") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!id || !newPassword || newPassword.length < 6) throw new Error("Mot de passe trop court (min 6 caractères)");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  revalidatePath("/dashboard/admin/users");
}

async function deleteUser(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID manquant");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/admin/users");
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "STUDENT"] } },
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: { include: { class: true } },
      teacherClasses: { include: { class: true } },
    },
  });

  const teachers = users.filter((u) => u.role === "TEACHER");
  const students = users.filter((u) => u.role === "STUDENT");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/admin" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">👥</span>
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {teachers.length} professeur{teachers.length > 1 ? "s" : ""} · {students.length} élève{students.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Formulaire ajout ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
          <h2 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-base">➕</span>
            Ajouter un utilisateur
          </h2>
          <p className="text-sm text-gray-400 mb-5">Créez un compte professeur ou élève.</p>
          <form action={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Nom complet</label>
              <input name="name" required placeholder="Ex : Marie Dupont"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
              <input name="email" type="email" required placeholder="email@exemple.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mot de passe</label>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Rôle</label>
              <select name="role" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition">
                <option value="STUDENT">Élève</option>
                <option value="TEACHER">Professeur</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit"
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition">
                Créer le compte
              </button>
            </div>
          </form>
        </section>

        {/* ── Professeurs ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg">👨‍🏫</span>
            Professeurs
            <span className="ml-1 text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {teachers.length}
            </span>
          </h2>
          {teachers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Aucun professeur créé.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {teachers.map((user) => {
                  const ini = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                  const classNames = user.teacherClasses.map((tc) => tc.class.name).join(", ");
                  return (
                    <div key={user.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                      <span className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {ini}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                        {classNames && (
                          <p className="text-xs text-blue-600 mt-0.5 font-medium">Classes : {classNames}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                        <div className="flex gap-3 justify-end mt-1">
                          <details>
                            <summary className="text-xs text-blue-400 hover:text-blue-600 cursor-pointer font-semibold list-none">
                              🔑 Réinitialiser
                            </summary>
                            <form action={resetPassword} className="mt-2 flex gap-1.5 items-center">
                              <input type="hidden" name="id" value={user.id} />
                              <input name="newPassword" type="password" required minLength={6}
                                placeholder="Nouveau mdp"
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 w-32" />
                              <button type="submit"
                                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition">
                                OK
                              </button>
                            </form>
                          </details>
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={user.id} />
                            <button type="submit"
                              className="text-red-400 hover:text-red-600 text-xs font-semibold transition">
                              Supprimer
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Élèves ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-lg">👨‍🎓</span>
            Élèves
            <span className="ml-1 text-sm font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
              {students.length}
            </span>
          </h2>
          {students.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Aucun élève créé.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {students.map((user) => {
                  const ini = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                  const classNames = user.enrollments.map((e) => e.class.name).join(", ");
                  return (
                    <div key={user.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                      <span className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {ini}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                        {classNames ? (
                          <p className="text-xs text-green-600 mt-0.5 font-medium">Classe : {classNames}</p>
                        ) : (
                          <p className="text-xs text-orange-500 mt-0.5 font-medium">⚠️ Non inscrit dans une classe</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                        <div className="flex gap-3 justify-end mt-1">
                          <details>
                            <summary className="text-xs text-blue-400 hover:text-blue-600 cursor-pointer font-semibold list-none">
                              🔑 Réinitialiser
                            </summary>
                            <form action={resetPassword} className="mt-2 flex gap-1.5 items-center">
                              <input type="hidden" name="id" value={user.id} />
                              <input name="newPassword" type="password" required minLength={6}
                                placeholder="Nouveau mdp"
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 w-32" />
                              <button type="submit"
                                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition">
                                OK
                              </button>
                            </form>
                          </details>
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={user.id} />
                            <button type="submit"
                              className="text-red-400 hover:text-red-600 text-xs font-semibold transition">
                              Supprimer
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
