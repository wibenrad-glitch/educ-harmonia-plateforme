"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ── Panneau gauche (branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 flex-col items-center justify-center p-16 text-white relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-5xl mb-8 mx-auto shadow-2xl backdrop-blur-sm">
            🎓
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Éduc&apos;Harmonia</h1>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
            La plateforme d&apos;enseignement en ligne pensée pour vos élèves et vos enseignants.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">📚</p>
              <p className="text-sm text-indigo-200 mt-1">Cours en ligne</p>
            </div>
            <div>
              <p className="text-3xl font-bold">🎥</p>
              <p className="text-sm text-indigo-200 mt-1">Sessions Zoom</p>
            </div>
            <div>
              <p className="text-3xl font-bold">✏️</p>
              <p className="text-sm text-indigo-200 mt-1">Devoirs & notes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-indigo-200">
              🎓
            </div>
            <h1 className="text-2xl font-bold text-indigo-700">Éduc&apos;Harmonia</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
              <p className="text-gray-500 text-sm mt-1">Entrez vos identifiants pour accéder à votre espace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">✉️</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="votre@email.com"
                    className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔒</span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-12 py-3 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm transition"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <span className="text-red-500 text-base shrink-0">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Connexion en cours…
                  </span>
                ) : (
                  "Se connecter →"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              <a href="/forgot-password" className="text-indigo-500 hover:underline">
                Mot de passe oublié ?
              </a>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Éduc&apos;Harmonia — Tous droits réservés
          </p>
        </div>
      </div>

    </div>
  );
}
